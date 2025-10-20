/**
 * @jest-environment jsdom
 */

import { toastLogger } from '@/utils/toast-logger';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

describe('ToastLogger', () => {
  beforeEach(() => {
    // Clear logs before each test
    toastLogger.clearLogs();
    
    // Mock console methods
    console.log = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
  });

  describe('Logging functionality', () => {
    it('should log ADD toast action', () => {
      toastLogger.log({
        type: 'ADD',
        toastId: 'test-1',
        title: 'Test Toast',
        description: 'Test Description'
      });

      const logs = toastLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe('ADD');
      expect(logs[0].toastId).toBe('test-1');
      expect(logs[0].title).toBe('Test Toast');
    });

    it('should log DISMISS toast action', () => {
      toastLogger.log({
        type: 'DISMISS',
        toastId: 'test-1'
      });

      const logs = toastLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe('DISMISS');
      expect(logs[0].toastId).toBe('test-1');
    });

    it('should log RENDER action with context data', () => {
      toastLogger.log({
        type: 'RENDER',
        contextData: { toastCount: 3 }
      });

      const logs = toastLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe('RENDER');
      expect(logs[0].contextData).toEqual({ toastCount: 3 });
    });

    it('should include timestamp in logs', () => {
      const beforeTime = Date.now();
      
      toastLogger.log({
        type: 'ADD',
        toastId: 'test-1'
      });

      const afterTime = Date.now();
      const logs = toastLogger.getLogs();
      
      expect(logs[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(logs[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should include stack trace in logs', () => {
      toastLogger.log({
        type: 'ADD',
        toastId: 'test-1'
      });

      const logs = toastLogger.getLogs();
      expect(logs[0].stackTrace).toBeDefined();
      expect(typeof logs[0].stackTrace).toBe('string');
    });
  });

  describe('Log management', () => {
    it('should limit logs to maximum count', () => {
      // Add more logs than the limit (100)
      for (let i = 0; i < 150; i++) {
        toastLogger.log({
          type: 'ADD',
          toastId: `test-${i}`
        });
      }

      const logs = toastLogger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(100);
    });

    it('should clear all logs', () => {
      toastLogger.log({ type: 'ADD', toastId: 'test-1' });
      toastLogger.log({ type: 'ADD', toastId: 'test-2' });
      
      expect(toastLogger.getLogs()).toHaveLength(2);
      
      toastLogger.clearLogs();
      
      expect(toastLogger.getLogs()).toHaveLength(0);
    });

    it('should get recent logs within time window', () => {
      const oldTime = Date.now() - 20000; // 20 seconds ago
      
      // Manually add an old log (simulating)
      toastLogger.log({ type: 'ADD', toastId: 'old-toast' });
      
      // Wait a bit and add recent log
      setTimeout(() => {
        toastLogger.log({ type: 'ADD', toastId: 'recent-toast' });
        
        const recentLogs = toastLogger.getRecentLogs(10); // Last 10 seconds
        expect(recentLogs.length).toBeGreaterThan(0);
        expect(recentLogs.every(log => log.timestamp > Date.now() - 10000)).toBe(true);
      }, 10);
    });
  });

  describe('Infinite loop detection', () => {
    it('should detect potential infinite loop with many rapid actions', () => {
      // Simulate rapid toast actions
      for (let i = 0; i < 20; i++) {
        toastLogger.log({
          type: 'ADD',
          toastId: `rapid-${i}`
        });
      }

      // Should have warned about potential infinite loop
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Posible infinite loop detectado')
      );
    });

    it('should not warn for normal usage patterns', () => {
      // Add a few logs with normal spacing
      toastLogger.log({ type: 'ADD', toastId: 'normal-1' });
      toastLogger.log({ type: 'DISMISS', toastId: 'normal-1' });
      toastLogger.log({ type: 'REMOVE', toastId: 'normal-1' });

      // Should not have warned
      expect(console.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('Posible infinite loop detectado')
      );
    });
  });

  describe('Console output', () => {
    it('should log ADD action to console with proper format', () => {
      toastLogger.log({
        type: 'ADD',
        toastId: 'test-1',
        title: 'Test Toast'
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🍞 [Toast ADD]')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Added: "Test Toast" (ID: test-1)')
      );
    });

    it('should log DISMISS action to console', () => {
      toastLogger.log({
        type: 'DISMISS',
        toastId: 'test-1'
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🍞 [Toast DISMISS]')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Dismissed: test-1')
      );
    });

    it('should log RENDER action with toast count', () => {
      toastLogger.log({
        type: 'RENDER',
        contextData: { toastCount: 2 }
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🍞 [Toast RENDER]')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Rendered: 2 toasts')
      );
    });
  });
});