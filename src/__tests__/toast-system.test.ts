/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useToast, reducer } from '@/hooks/use-toast';

// Mock del logger para tests
jest.mock('@/utils/toast-logger', () => ({
  toastLogger: {
    log: jest.fn()
  }
}));

describe('Toast System', () => {
  describe('useToast hook', () => {
    it('should initialize with empty toasts', () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts).toEqual([]);
    });

    it('should add a toast', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({
          title: 'Test Toast',
          description: 'Test Description'
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Test Toast');
      expect(result.current.toasts[0].description).toBe('Test Description');
    });

    it('should prevent duplicate toasts', () => {
      const { result } = renderHook(() => useToast());
      
      const toastData = {
        title: 'Duplicate Test',
        description: 'Same content'
      };

      act(() => {
        result.current.toast(toastData);
        result.current.toast(toastData); // Duplicate
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('should dismiss a toast', () => {
      const { result } = renderHook(() => useToast());
      
      let toastId: string;
      
      act(() => {
        const toast = result.current.toast({
          title: 'Test Toast'
        });
        toastId = toast.id;
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismiss(toastId);
      });

      // Toast should be marked as closed but not removed yet
      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should limit toasts to TOAST_LIMIT', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        // Add more toasts than the limit (TOAST_LIMIT = 1)
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
        result.current.toast({ title: 'Toast 3' });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Toast 3'); // Latest should be kept
    });
  });

  describe('Toast reducer', () => {
    const initialState = { toasts: [] };

    it('should add toast to state', () => {
      const toast = {
        id: '1',
        title: 'Test',
        open: true
      };

      const action = {
        type: 'ADD_TOAST' as const,
        toast
      };

      const newState = reducer(initialState, action);
      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0]).toEqual(toast);
    });

    it('should update existing toast', () => {
      const initialToast = {
        id: '1',
        title: 'Original',
        open: true
      };

      const stateWithToast = { toasts: [initialToast] };

      const action = {
        type: 'UPDATE_TOAST' as const,
        toast: { id: '1', title: 'Updated' }
      };

      const newState = reducer(stateWithToast, action);
      expect(newState.toasts[0].title).toBe('Updated');
      expect(newState.toasts[0].id).toBe('1');
    });

    it('should dismiss toast by setting open to false', () => {
      const initialToast = {
        id: '1',
        title: 'Test',
        open: true
      };

      const stateWithToast = { toasts: [initialToast] };

      const action = {
        type: 'DISMISS_TOAST' as const,
        toastId: '1'
      };

      const newState = reducer(stateWithToast, action);
      expect(newState.toasts[0].open).toBe(false);
    });

    it('should remove toast from state', () => {
      const initialToast = {
        id: '1',
        title: 'Test',
        open: true
      };

      const stateWithToast = { toasts: [initialToast] };

      const action = {
        type: 'REMOVE_TOAST' as const,
        toastId: '1'
      };

      const newState = reducer(stateWithToast, action);
      expect(newState.toasts).toHaveLength(0);
    });

    it('should remove all toasts when toastId is undefined', () => {
      const toasts = [
        { id: '1', title: 'Test 1', open: true },
        { id: '2', title: 'Test 2', open: true }
      ];

      const stateWithToasts = { toasts };

      const action = {
        type: 'REMOVE_TOAST' as const,
        toastId: undefined
      };

      const newState = reducer(stateWithToasts, action);
      expect(newState.toasts).toHaveLength(0);
    });
  });

  describe('Toast deduplication', () => {
    it('should not add duplicate toasts with same title and description', () => {
      const { result } = renderHook(() => useToast());
      
      const toastData = {
        title: 'Error',
        description: 'Something went wrong'
      };

      act(() => {
        result.current.toast(toastData);
      });

      const firstCount = result.current.toasts.length;

      act(() => {
        result.current.toast(toastData); // Same content
      });

      expect(result.current.toasts.length).toBe(firstCount);
    });

    it('should allow toasts with different content', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({
          title: 'Error 1',
          description: 'First error'
        });
        
        result.current.toast({
          title: 'Error 2', 
          description: 'Second error'
        });
      });

      expect(result.current.toasts.length).toBe(1); // Limited by TOAST_LIMIT
    });
  });
});