import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 ErrorBoundary caught an error:', error);
    console.error('🔴 Component Stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Algo deu errado</AlertTitle>
              <AlertDescription>
                Um erro inesperado ocorreu no componente. Por favor, tente recarregar a página.
              </AlertDescription>
            </Alert>

            <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Detalhes do Erro:</h3>
              
              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <p className="font-mono text-sm text-red-800">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              {this.state.errorInfo && (
                <details className="cursor-pointer">
                  <summary className="font-semibold text-sm text-gray-600 hover:text-gray-800">
                    Ver stack trace completo
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recarregar Página
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  className="flex-1"
                >
                  Voltar
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;