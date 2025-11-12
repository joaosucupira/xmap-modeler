import React from 'react';
import { useAuth } from '../services/auth';
import LoginPage from '../pages/LoginPage';
import { Skeleton } from './ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isAuthEnabled, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <p className="text-gray-600 mt-4">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se autenticação está desabilitada ou usuário está logado, mostra o conteúdo
  if (!isAuthEnabled || isAuthenticated) {
    return <>{children}</>;
  }

  // Caso contrário, mostra tela de login
  return <LoginPage />;
};

export default ProtectedRoute;