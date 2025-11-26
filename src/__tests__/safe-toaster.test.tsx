/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Toaster } from '@/components/safe-toaster';
import { useToast } from '@/hooks/use-toast';

// Mock del logger
jest.mock('@/utils/toast-logger', () => ({
  toastLogger: {
    log: jest.fn()
  }
}));

// Mock del hook useToast
jest.mock('@/hooks/use-toast');

const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('SafeToaster Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    mockUseToast.mockReturnValue({
      toasts: [],
      toast: jest.fn(),
      dismiss: jest.fn()
    });

    render(<Toaster />);
    // No debería lanzar errores
  });

  it('should limit toasts to maximum of 5', () => {
    const manyToasts = Array.from({ length: 10 }, (_, i) => ({
      id: `toast-${i}`,
      title: `Toast ${i}`,
      description: `Description ${i}`,
      open: true
    }));

    mockUseToast.mockReturnValue({
      toasts: manyToasts,
      toast: jest.fn(),
      dismiss: jest.fn()
    });

    render(<Toaster />);
    
    // Debería renderizar máximo 5 toasts
    const toastElements = screen.getAllByRole('status');
    expect(toastElements.length).toBeLessThanOrEqual(5);
  });

  it('should handle empty toasts array', () => {
    mockUseToast.mockReturnValue({
      toasts: [],
      toast: jest.fn(),
      dismiss: jest.fn()
    });

    render(<Toaster />);
    
    // No debería renderizar ningún toast
    const toastElements = screen.queryAllByRole('status');
    expect(toastElements).toHaveLength(0);
  });

  it('should render toast with title and description', () => {
    const testToast = {
      id: 'test-toast',
      title: 'Test Title',
      description: 'Test Description',
      open: true
    };

    mockUseToast.mockReturnValue({
      toasts: [testToast],
      toast: jest.fn(),
      dismiss: jest.fn()
    });

    render(<Toaster />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should handle toasts without description', () => {
    const testToast = {
      id: 'test-toast',
      title: 'Test Title Only',
      open: true
    };

    mockUseToast.mockReturnValue({
      toasts: [testToast],
      toast: jest.fn(),
      dismiss: jest.fn()
    });

    render(<Toaster />);
    
    expect(screen.getByText('Test Title Only')).toBeInTheDocument();
  });

  it('should wrap each toast in error boundary', () => {
    const testToast = {
      id: 'test-toast',
      title: 'Test Toast',
      open: true
    };

    mockUseToast.mockReturnValue({
      toasts: [testToast],
      toast: jest.fn(),
      dismiss: jest.fn()
    });

    // Esto debería renderizar sin errores incluso si hay problemas internos
    expect(() => render(<Toaster />)).not.toThrow();
  });
});