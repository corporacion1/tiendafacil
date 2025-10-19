import { Sale } from '@/models/Sale';
import { AccountReceivable, AccountStatus, PaymentType } from '@/models/AccountReceivable';

/**
 * Servicio de sincronización bidireccional entre Sale y AccountReceivable
 */
export class CreditsSyncService {
  
  /**
   * Crea una cuenta por cobrar desde una venta a crédito
   */
  static async createAccountFromSale(saleId: string, createdBy: string, creditDays: number = 30) {
    const sale = await Sale.findOne({ id: saleId });
    if (!sale) {
      throw new Error('Venta no encontrada');
    }
    
    if (sale.transactionType !== 'credito') {
      throw new Error('La venta no es a crédito');
    }
    
    // Verificar si ya existe una cuenta
    const existingAccount = await AccountReceivable.findOne({ saleId });
    if (existingAccount) {
      return existingAccount;
    }
    
    // Crear cuenta por cobrar
    const account = AccountReceivable.createFromSale(sale, creditDays, createdBy);
    await account.save();
    
    // Actualizar la venta con la referencia
    sale.accountReceivableId = account.id;
    if (!sale.creditTerms) {
      sale.creditTerms = {};
    }
    sale.creditTerms.creditDays = creditDays;
    sale.creditTerms.dueDate = account.dueDate;
    
    await sale.save();
    
    return account;
  }
  
  /**
   * Sincroniza un pago desde AccountReceivable hacia Sale
   */
  static async syncPaymentToSale(accountId: string, paymentData: any) {
    const account = await AccountReceivable.findOne({ id: accountId });
    if (!account) {
      throw new Error('Cuenta por cobrar no encontrada');
    }
    
    const sale = await Sale.findOne({ id: account.saleId });
    if (!sale) {
      throw new Error('Venta asociada no encontrada');
    }
    
    // Convertir el pago al formato del modelo Sale
    const salePayment = {
      id: paymentData.id,
      amount: paymentData.amount,
      date: paymentData.processedAt.toISOString(),
      method: paymentData.paymentMethod,
      reference: paymentData.reference || '',
      receivedBy: paymentData.processedBy
    };
    
    // Agregar pago al modelo Sale
    if (!sale.payments) sale.payments = [];
    sale.payments.push(salePayment);
    
    // Actualizar totales en Sale
    sale.paidAmount = account.paidAmount;
    sale.status = account.status === AccountStatus.PAID ? 'paid' : 'unpaid';
    
    await sale.save();
    
    return sale;
  }
  
  /**
   * Sincroniza un pago desde Sale hacia AccountReceivable
   */
  static async syncPaymentToAccount(saleId: string, paymentData: any) {
    const sale = await Sale.findOne({ id: saleId });
    if (!sale) {
      throw new Error('Venta no encontrada');
    }
    
    // Buscar o crear cuenta por cobrar
    let account = await AccountReceivable.findOne({ saleId });
    if (!account && sale.transactionType === 'credito') {
      account = await this.createAccountFromSale(saleId, 'system');
    }
    
    if (!account) {
      throw new Error('No se puede crear cuenta por cobrar para venta de contado');
    }
    
    // Convertir el pago al formato del modelo AccountReceivable
    const accountPayment = {
      id: paymentData.id,
      amount: paymentData.amount,
      paymentMethod: paymentData.method,
      reference: paymentData.reference,
      type: PaymentType.PAYMENT,
      notes: paymentData.notes,
      processedBy: paymentData.receivedBy,
      processedAt: new Date(paymentData.date)
    };
    
    // Agregar pago a la cuenta
    account.payments.push(accountPayment);
    account.lastPaymentDate = new Date();
    
    // Guardar (el middleware calculará automáticamente los totales)
    await account.save();
    
    return account;
  }
  
  /**
   * Verifica y repara inconsistencias entre Sale y AccountReceivable
   */
  static async validateConsistency(storeId: string) {
    const inconsistencies = [];
    
    // Obtener todas las ventas a crédito
    const creditSales = await Sale.find({ 
      storeId, 
      transactionType: 'credito' 
    });
    
    for (const sale of creditSales) {
      const account = await AccountReceivable.findOne({ saleId: sale.id });
      
      if (!account) {
        inconsistencies.push({
          type: 'missing_account',
          saleId: sale.id,
          message: 'Venta a crédito sin cuenta por cobrar'
        });
        continue;
      }
      
      // Verificar totales
      if (Math.abs(sale.total - account.originalAmount) > 0.01) {
        inconsistencies.push({
          type: 'amount_mismatch',
          saleId: sale.id,
          accountId: account.id,
          saleTotal: sale.total,
          accountTotal: account.originalAmount
        });
      }
      
      // Verificar pagos
      if (Math.abs((sale.paidAmount || 0) - account.paidAmount) > 0.01) {
        inconsistencies.push({
          type: 'payment_mismatch',
          saleId: sale.id,
          accountId: account.id,
          salePaid: sale.paidAmount,
          accountPaid: account.paidAmount
        });
      }
      
      // Verificar estados
      const expectedSaleStatus = account.status === AccountStatus.PAID ? 'paid' : 'unpaid';
      if (sale.status !== expectedSaleStatus) {
        inconsistencies.push({
          type: 'status_mismatch',
          saleId: sale.id,
          accountId: account.id,
          saleStatus: sale.status,
          expectedStatus: expectedSaleStatus
        });
      }
    }
    
    return inconsistencies;
  }
  
  /**
   * Repara inconsistencias encontradas
   */
  static async repairInconsistencies(storeId: string, autoFix: boolean = false) {
    const inconsistencies = await this.validateConsistency(storeId);
    const repairs = [];
    
    if (!autoFix) {
      return { inconsistencies, repairs: [] };
    }
    
    for (const issue of inconsistencies) {
      try {
        switch (issue.type) {
          case 'missing_account':
            const account = await this.createAccountFromSale(issue.saleId, 'system_repair');
            repairs.push({
              type: 'created_account',
              saleId: issue.saleId,
              accountId: account.id
            });
            break;
            
          case 'payment_mismatch':
          case 'status_mismatch':
            // Sincronizar desde AccountReceivable (fuente de verdad)
            const accountData = await AccountReceivable.findOne({ id: issue.accountId });
            const saleData = await Sale.findOne({ id: issue.saleId });
            
            if (accountData && saleData) {
              saleData.paidAmount = accountData.paidAmount;
              saleData.status = accountData.status === AccountStatus.PAID ? 'paid' : 'unpaid';
              await saleData.save();
              
              repairs.push({
                type: 'synced_sale',
                saleId: issue.saleId,
                accountId: issue.accountId
              });
            }
            break;
        }
      } catch (error) {
        repairs.push({
          type: 'repair_failed',
          issue,
          error: error.message
        });
      }
    }
    
    return { inconsistencies, repairs };
  }
  
  /**
   * Migra ventas a crédito existentes a cuentas por cobrar
   */
  static async migrateExistingCreditSales(storeId: string) {
    const creditSales = await Sale.find({ 
      storeId, 
      transactionType: 'credito',
      accountReceivableId: { $exists: false }
    });
    
    const results = [];
    
    for (const sale of creditSales) {
      try {
        const account = await this.createAccountFromSale(sale.id, 'migration');
        results.push({
          success: true,
          saleId: sale.id,
          accountId: account.id
        });
      } catch (error) {
        results.push({
          success: false,
          saleId: sale.id,
          error: error.message
        });
      }
    }
    
    return results;
  }
}