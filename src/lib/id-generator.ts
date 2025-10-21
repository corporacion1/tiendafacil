/**
 * ID Generator Utility
 * 
 * Genera identificadores únicos globales para el sistema multitienda.
 * Formato: {prefix}_{storeId}_{timestamp}_{random}
 * 
 * Ejemplo: prod_store123_1234567890_abc123xyz
 */

export class IDGenerator {
  /**
   * Genera un ID único global
   * 
   * @param prefix - Prefijo que identifica el tipo de entidad (prod, sale, purchase, etc.)
   * @param storeId - ID de la tienda
   * @returns ID único en formato: {prefix}_{storeId}_{timestamp}_{random}
   * 
   * @example
   * IDGenerator.generate('prod', 'store_123')
   * // Returns: 'prod_store_123_1234567890_abc123xyz'
   */
  static generate(prefix: string, storeId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${storeId}_${timestamp}_${random}`;
  }

  /**
   * Genera múltiples IDs únicos en lote
   * 
   * @param prefix - Prefijo que identifica el tipo de entidad
   * @param storeId - ID de la tienda
   * @param count - Cantidad de IDs a generar
   * @returns Array de IDs únicos
   * 
   * @example
   * IDGenerator.generateBatch('prod', 'store_123', 5)
   * // Returns: ['prod_store_123_...', 'prod_store_123_...', ...]
   */
  static generateBatch(prefix: string, storeId: string, count: number): string[] {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      // Pequeño delay para garantizar timestamps únicos
      const timestamp = Date.now() + i;
      const random = Math.random().toString(36).substr(2, 9);
      ids.push(`${prefix}_${storeId}_${timestamp}_${random}`);
    }
    return ids;
  }

  /**
   * Valida el formato de un ID
   * 
   * @param id - ID a validar
   * @returns true si el formato es válido, false en caso contrario
   * 
   * @example
   * IDGenerator.validate('prod_store_123_1234567890_abc123')
   * // Returns: true
   * 
   * IDGenerator.validate('invalid-id')
   * // Returns: false
   */
  static validate(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }
    
    // Formato: prefix_storeId_timestamp_random
    // Permite letras, números, guiones y guiones bajos
    const pattern = /^[a-z0-9]+_[a-z0-9_-]+_\d+_[a-z0-9]+$/i;
    return pattern.test(id);
  }

  /**
   * Extrae el storeId de un ID
   * 
   * @param id - ID del cual extraer el storeId
   * @returns storeId o null si el formato es inválido
   * 
   * @example
   * IDGenerator.extractStoreId('prod_store_123_1234567890_abc123')
   * // Returns: 'store_123'
   */
  static extractStoreId(id: string): string | null {
    if (!this.validate(id)) {
      return null;
    }
    
    const parts = id.split('_');
    
    // El formato es: prefix_storeId_timestamp_random
    // Pero storeId puede contener guiones bajos, así que necesitamos
    // reconstruir todo entre el primer _ y el penúltimo _
    if (parts.length < 4) {
      return null;
    }
    
    // Remover prefix (primer elemento)
    parts.shift();
    
    // Remover random (último elemento)
    parts.pop();
    
    // Remover timestamp (ahora último elemento)
    parts.pop();
    
    // Lo que queda es el storeId (puede tener múltiples partes con _)
    return parts.join('_');
  }

  /**
   * Extrae el timestamp de un ID
   * 
   * @param id - ID del cual extraer el timestamp
   * @returns timestamp como número o null si el formato es inválido
   * 
   * @example
   * IDGenerator.extractTimestamp('prod_store_123_1234567890_abc123')
   * // Returns: 1234567890
   */
  static extractTimestamp(id: string): number | null {
    if (!this.validate(id)) {
      return null;
    }
    
    const parts = id.split('_');
    if (parts.length < 4) {
      return null;
    }
    
    // El timestamp es el penúltimo elemento
    const timestamp = parseInt(parts[parts.length - 2], 10);
    return isNaN(timestamp) ? null : timestamp;
  }

  /**
   * Extrae el prefijo de un ID
   * 
   * @param id - ID del cual extraer el prefijo
   * @returns prefijo o null si el formato es inválido
   * 
   * @example
   * IDGenerator.extractPrefix('prod_store_123_1234567890_abc123')
   * // Returns: 'prod'
   */
  static extractPrefix(id: string): string | null {
    if (!this.validate(id)) {
      return null;
    }
    
    const parts = id.split('_');
    return parts.length > 0 ? parts[0] : null;
  }
}
