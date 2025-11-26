// src/lib/cash-session-utils.ts
import type { CashSession } from '@/lib/types';

export async function getActiveCashSession(storeId: string): Promise<CashSession | null> {
  try {
    const response = await fetch(`/api/cashsessions?storeId=${storeId}`);
    
    if (!response.ok) {
      console.error('Error fetching cash sessions:', response.statusText);
      return null;
    }
    
    const sessions: CashSession[] = await response.json();
    const activeSession = sessions.find(session => session.status === 'open');
    
    return activeSession || null;
  } catch (error) {
    console.error('Error loading active cash session:', error);
    return null;
  }
}

export async function createCashSession(sessionData: CashSession): Promise<CashSession | null> {
  try {
    const response = await fetch('/api/cashsessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });

    if (!response.ok) {
      throw new Error('Failed to create cash session');
    }

    const createdSession = await response.json();
    return createdSession;
  } catch (error) {
    console.error('Error creating cash session:', error);
    return null;
  }
}

export async function updateCashSession(sessionData: CashSession): Promise<CashSession | null> {
  try {
    const response = await fetch('/api/cashsessions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });

    if (!response.ok) {
      throw new Error('Failed to update cash session');
    }

    const updatedSession = await response.json();
    return updatedSession;
  } catch (error) {
    console.error('Error updating cash session:', error);
    return null;
  }
}

export function calculateSessionTotals(session: CashSession, sales: any[]) {
  const sessionSales = sales.filter(sale => session.salesIds.includes(sale.id));
  
  const totalSales = sessionSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalCashPayments = sessionSales
    .flatMap(sale => sale.payments || [])
    .filter(payment => payment.method === 'Efectivo')
    .reduce((sum, payment) => sum + payment.amount, 0);
  
  const expectedCash = session.openingBalance + totalCashPayments;
  
  return {
    totalSales,
    totalCashPayments,
    expectedCash,
    salesCount: sessionSales.length,
    sessionSales
  };
}