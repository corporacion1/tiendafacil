// Toast system logger for debugging infinite loops and state issues

interface ToastLogEntry {
  timestamp: number;
  type: 'ADD' | 'UPDATE' | 'DISMISS' | 'REMOVE' | 'RENDER' | 'CONTEXT_CHANGE';
  toastId?: string;
  title?: string;
  description?: string;
  stackTrace?: string;
  contextData?: any;
}

class ToastLogger {
  private logs: ToastLogEntry[] = [];
  private maxLogs = 100;
  // Enable logger in development and test environments so unit tests can assert logs
  private isEnabled = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  log(entry: Omit<ToastLogEntry, 'timestamp'>) {
    if (!this.isEnabled) return;

    const logEntry: ToastLogEntry = {
      ...entry,
      timestamp: Date.now(),
      stackTrace: new Error().stack
    };

    this.logs.push(logEntry);

    // Mantener solo los últimos maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log en consola con formato
    const timeStr = new Date(logEntry.timestamp).toLocaleTimeString();
    const prefix = `🍞 [Toast ${logEntry.type}] ${timeStr}`;
    
    switch (entry.type) {
      case 'ADD':
        console.log(`${prefix} Added: "${entry.title}" (ID: ${entry.toastId})`);
        break;
      case 'UPDATE':
        console.log(`${prefix} Updated: ${entry.toastId}`);
        break;
      case 'DISMISS':
        console.log(`${prefix} Dismissed: ${entry.toastId || 'all'}`);
        break;
      case 'REMOVE':
        console.log(`${prefix} Removed: ${entry.toastId || 'all'}`);
        break;
      case 'RENDER':
        console.log(`${prefix} Rendered: ${entry.contextData?.toastCount} toasts`);
        break;
      case 'CONTEXT_CHANGE':
        console.log(`${prefix} Context changed:`, entry.contextData);
        break;
    }

    // Detectar posibles loops
    this.detectInfiniteLoop();
  }

  private detectInfiniteLoop() {
    const recentLogs = this.logs.slice(-20); // Últimos 20 logs
    const now = Date.now();
    const recentTime = now - 5000; // Últimos 5 segundos

    const recentActions = recentLogs.filter(log => log.timestamp > recentTime);
    
    if (recentActions.length > 15) {
      console.warn('🚨 [Toast Logger] Posible infinite loop detectado!');
      console.warn('Acciones recientes:', recentActions.map(a => `${a.type}:${a.toastId}`));
      
      // Agrupar por tipo para análisis
      const actionCounts = recentActions.reduce((acc, action) => {
        acc[action.type] = (acc[action.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.warn('Conteo de acciones:', actionCounts);
    }
  }

  getLogs() {
    return [...this.logs];
  }

  getRecentLogs(seconds = 10) {
    const cutoff = Date.now() - (seconds * 1000);
    return this.logs.filter(log => log.timestamp > cutoff);
  }

  clearLogs() {
    this.logs = [];
    console.log('🍞 [Toast Logger] Logs cleared');
  }

  exportLogs() {
    const data = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `toast-logs-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  // Método para debugging manual
  debug() {
    console.group('🍞 Toast System Debug Info');
    console.log('Total logs:', this.logs.length);
    console.log('Recent logs (last 10):', this.logs.slice(-10));
    
    const actionCounts = this.logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Action counts:', actionCounts);
    console.groupEnd();
  }
}

export const toastLogger = new ToastLogger();

// Exponer globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).toastLogger = toastLogger;
}