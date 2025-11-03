"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { errorHandler } from '@/services/ErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export interface ErrorBoundaryFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  showDetails?: boolean;
  context?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 [Error Boundary] Caught error:', error, errorInfo);

    // Registrar error en el sistema global
    const errorId = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    errorHandler.handleUnknownError(error, {
      component: this.props.context || 'ErrorBoundary',
      action: 'component_render',
      additionalData: {
        errorInfo: errorInfo.componentStack,
        errorBoundaryId: errorId
      }
    });

    this.setState({
      errorInfo,
      errorId
    });

    // Llamar callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Si hay un componente fallback personalizado, usarlo
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
            showDetails={this.props.showDetails}
            context={this.props.context}
          />
        );
      }

      // Fallback por defecto
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          showDetails={this.props.showDetails}
          context={this.props.context}
        />
      );
    }

    return this.props.children;
  }
}

// Componente fallback por defecto
const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  showDetails = false,
  context
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">¡Oops! Algo salió mal</CardTitle>
          <CardDescription>
            {context 
              ? `Ha ocurrido un error en ${context}. No te preocupes, puedes intentar nuevamente.`
              : 'Ha ocurrido un error inesperado. No te preocupes, puedes intentar nuevamente.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Intentar Nuevamente
            </Button>
            <Button variant="outline" onClick={handleReload} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recargar Página
            </Button>
          </div>
          
          <Button variant="ghost" onClick={handleGoHome} className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Ir al Inicio
          </Button>

          {(showDetails || process.env.NODE_ENV === 'development') && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="w-full text-xs"
              >
                <Bug className="w-3 h-3 mr-2" />
                {showErrorDetails ? 'Ocultar' : 'Mostrar'} Detalles Técnicos
              </Button>
              
              {showErrorDetails && (
                <div className="bg-muted p-3 rounded-md text-xs font-mono space-y-2 max-h-40 overflow-y-auto">
                  {error && (
                    <div>
                      <strong>Error:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{error.message}</pre>
                    </div>
                  )}
                  {error?.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap mt-1 text-xs">{error.stack}</pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1 text-xs">{errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Componente fallback minimalista para errores en componentes pequeños
export const MinimalErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  resetError,
  context
}) => {
  return (
    <div className="flex items-center justify-center p-4 bg-destructive/5 rounded-md border border-destructive/20">
      <div className="text-center space-y-2">
        <AlertTriangle className="w-5 h-5 text-destructive mx-auto" />
        <p className="text-sm text-destructive">
          Error en {context || 'componente'}
        </p>
        <Button size="sm" variant="outline" onClick={resetError}>
          <RefreshCw className="w-3 h-3 mr-1" />
          Reintentar
        </Button>
      </div>
    </div>
  );
};

// Componente fallback para páginas completas
export const PageErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  resetError,
  context
}) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Página no disponible</h1>
            <p className="text-muted-foreground">
              {context 
                ? `Ha ocurrido un error en ${context}`
                : 'Ha ocurrido un error inesperado'
              }. Por favor, intenta nuevamente.
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Intentar Nuevamente
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReload} className="flex-1">
              Recargar
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Inicio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook para usar Error Boundary programáticamente
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};