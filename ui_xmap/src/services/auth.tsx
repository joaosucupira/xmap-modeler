import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  nome: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthEnabled: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (nome: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Serviços de autenticação
const authService = {
  async checkAuthStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/status`);
      if (response.ok) {
        const data = await response.json();
        return data.auth_enabled;
      }
      return true;
    } catch (error) {
      console.log('Auth check failed, assumindo auth habilitado:', error);
      return true;
    }
  },

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha: password }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.access_token;
        localStorage.setItem('authToken', token);
        
        // Simular dados do usuário (já que não temos endpoint /auth/me)
        const user = {
          id: 1,
          nome: email.split('@')[0],
          email: email
        };
        localStorage.setItem('user', JSON.stringify(user));
        
        return { success: true, user, token };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Credenciais inválidas' };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  },

  async register(nome, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, email, senha: password }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Erro no cadastro' };
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getStoredUser() {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthEnabled, setIsAuthEnabled] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔄 Inicializando autenticação...');
      
      // Verificar se autenticação está habilitada
      const authEnabled = await authService.checkAuthStatus();
      setIsAuthEnabled(authEnabled);
      console.log('✅ Auth enabled:', authEnabled);

      if (!authEnabled) {
        // Modo desenvolvimento
        setIsAuthenticated(true);
        setUser({ id: 1, nome: 'Usuário Padrão', email: 'admin@xmap.com' });
        console.log('🔧 Modo desenvolvimento ativo');
      } else {
        // Verificar token existente
        const token = authService.getToken();
        const storedUser = authService.getStoredUser();
        
        if (token && storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
          console.log('✅ Usuário logado:', storedUser.nome);
        } else {
          console.log('❌ Nenhum token válido encontrado');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar autenticação:', error);
    } finally {
      setLoading(false);
      console.log('✅ Autenticação inicializada');
    }
  };

  const login = async (email, password) => {
    console.log('🔐 Tentando fazer login...');
    const result = await authService.login(email, password);
    
    if (result.success) {
      setUser(result.user);
      setIsAuthenticated(true);
      console.log('✅ Login bem-sucedido');
    } else {
      console.log('❌ Erro no login:', result.error);
    }
    
    return result;
  };

  const register = async (nome, email, password) => {
    console.log('📝 Tentando registrar usuário...');
    const result = await authService.register(nome, email, password);
    console.log('📝 Resultado do registro:', result);
    return result;
  };

  const logout = () => {
    console.log('🚪 Fazendo logout...');
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider 
      value={{
        isAuthenticated,
        isAuthEnabled,
        user,
        login,
        register,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};