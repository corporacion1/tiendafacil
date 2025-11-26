/**
 * ID Generator Utility
 * 
 * Genera identificadores únicos simples para el sistema.
 * Formato: {PREFIX}-{13 números aleatorios}
 * 
 * Ejemplos:
 * - Ventas: SAL-1234567890123
 * - Compras: PUR-1234567890123
 * - Productos: PRO-1234567890123
 */

export class IDGenerator {
  // Mapeo de prefijos para diferentes tipos de entidades
  private static readonly PREFIXES = {
    // Entidades principales
    'prod': 'PRO',
    'product': 'PRO',
    'sale': 'SAL',
    'purchase': 'PUR',
    'order': 'ORD',
    
    // Clientes y proveedores
    'cust': 'CUS',
    'customer': 'CUS',
    'sup': 'SUP',
    'supplier': 'SUP',
    
    // Configuración
    'unit': 'UNI',
    'fam': 'FAM',
    'family': 'FAM',
    'wh': 'WAR',
    'warehouse': 'WAR',
    
    // Finanzas
    'rate': 'RAT',
    'pay': 'PAY',
    'payment': 'PAY',
    'ses': 'SES',
    'session': 'SES',
    'ar': 'ACR',
    'account': 'ACR',
    
    // Inventario
    'mov': 'MOV',
    'movement': 'MOV',
    'adj': 'ADJ',
    'adjustment': 'ADJ',
    
    // Otros
    'pm': 'PME',
    'cat': 'CAT',
    'ad': 'ADS'
  };

  /**
   * Genera un ID único simple
   * 
   * @param type - Tipo de entidad (prod, sale, purchase, etc.)
   * @param storeId - ID de la tienda (no se usa en el nuevo formato, mantenido por compatibilidad)
   * @returns ID único en formato: {PREFIX}-{13 números}
   * 
   * @example
   * IDGenerator.generate('sale', 'store_123')
   * // Returns: 'SAL-1234567890123'
   */
  static generate(type: string, storeId?: string): string {
    const prefix = this.PREFIXES[type as keyof typeof this.PREFIXES] || 'GEN';
    const numbers = this.generateRandomNumbers(13);
    return `${prefix}-${numbers}`;
  }

  /**
   * Genera múltiples IDs únicos en lote
   * 
   * @param type - Tipo de entidad
   * @param storeId - ID de la tienda (mantenido por compatibilidad)
   * @param count - Cantidad de IDs a generar
   * @returns Array de IDs únicos
   * 
   * @example
   * IDGenerator.generateBatch('prod', 'store_123', 5)
   * // Returns: ['PRO-1234567890123', 'PRO-9876543210987', ...]
   */
  static generateBatch(type: string, storeId: string, count: number): string[] {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(this.generate(type, storeId));
    }
    return ids;
  }

  /**
   * Genera 13 números aleatorios
   * 
   * @param length - Longitud de números a generar
   * @returns String de números aleatorios
   */
  private static generateRandomNumbers(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }

  /**
   * Valida el formato de un ID
   * 
   * @param id - ID a validar
   * @returns true si el formato es válido, false en caso contrario
   * 
   * @example
   * IDGenerator.validate('SAL-1234567890123')
   * // Returns: true
   * 
   * IDGenerator.validate('invalid-id')
   * // Returns: false
   */
  static validate(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }
    
    // Formato: 3 letras mayúsculas + guión + 13 números
    const pattern = /^[A-Z]{3}-\d{13}$/;
    return pattern.test(id);
  }

  /**
   * Extrae el prefijo de un ID
   * 
   * @param id - ID del cual extraer el prefijo
   * @returns prefijo o null si el formato es inválido
   * 
   * @example
   * IDGenerator.extractPrefix('SAL-1234567890123')
   * // Returns: 'SAL'
   */
  static extractPrefix(id: string): string | null {
    if (!this.validate(id)) {
      return null;
    }
    
    return id.split('-')[0];
  }

  /**
   * Extrae los números de un ID
   * 
   * @param id - ID del cual extraer los números
   * @returns números como string o null si el formato es inválido
   * 
   * @example
   * IDGenerator.extractNumbers('SAL-1234567890123')
   * // Returns: '1234567890123'
   */
  static extractNumbers(id: string): string | null {
    if (!this.validate(id)) {
      return null;
    }
    
    return id.split('-')[1];
  }

  /**
   * Obtiene el tipo de entidad basado en el prefijo
   * 
   * @param id - ID del cual obtener el tipo
   * @returns tipo de entidad o null si no se reconoce
   * 
   * @example
   * IDGenerator.getEntityType('SAL-1234567890123')
   * // Returns: 'sale'
   */
  static getEntityType(id: string): string | null {
    const prefix = this.extractPrefix(id);
    if (!prefix) return null;

    // Buscar el tipo correspondiente al prefijo
    for (const [type, typePrefix] of Object.entries(this.PREFIXES)) {
      if (typePrefix === prefix) {
        return type;
      }
    }
    
    return null;
  }

  // Métodos de compatibilidad con el sistema anterior
  static extractStoreId(id: string): string | null {
    // En el nuevo formato no almacenamos storeId en el ID
    // Retornamos null para mantener compatibilidad
    return null;
  }

  static extractTimestamp(id: string): number | null {
    // En el nuevo formato no almacenamos timestamp en el ID
    // Retornamos null para mantener compatibilidad
    return null;
  }
}
