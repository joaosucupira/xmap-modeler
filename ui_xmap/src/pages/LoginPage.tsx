import React, { useState } from 'react';
import { useAuth } from '../services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ nome: '', email: '', password: '', confirmPassword: '' });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const { login, register } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const result = await login(loginData.email, loginData.password);
      if (!result.success) {
        setLoginError(result.error || 'Erro no login');
      }
    } catch (error) {
      setLoginError('Erro inesperado. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };
// ...existing code...

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);
    setRegisterSuccess(false);

    // Validações
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('As senhas não coincidem');
      setRegisterLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setRegisterError('A senha deve ter pelo menos 6 caracteres');
      setRegisterLoading(false);
      return;
    }

    try {
      const result = await register(registerData.nome, registerData.email, registerData.password);
      if (result.success) {
        // Após cadastro bem-sucedido, faz login automaticamente
        const loginResult = await login(registerData.email, registerData.password);
        if (!loginResult.success) {
          // Se o login automático falhar, mostra mensagem de sucesso do cadastro
          setRegisterSuccess(true);
          setRegisterData({ nome: '', email: '', password: '', confirmPassword: '' });
        }
        // Se login bem-sucedido, o useAuth vai redirecionar automaticamente
      } else {
        setRegisterError(result.error || 'Erro no cadastro');
      }
    } catch (error) {
      setRegisterError('Erro inesperado. Tente novamente.');
    } finally {
      setRegisterLoading(false);
    }
  };

// ...existing code...

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-gray-900">
            xMap Modeler
          </CardTitle>
          <p className="text-gray-600">Sistema de Modelagem de Processos</p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Cadastro
              </TabsTrigger>
            </TabsList>

            {/* Aba de Login */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Digite seu email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium">
                    Senha
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>

                {loginError && (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Aba de Cadastro */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="register-nome" className="text-sm font-medium">
                    Nome Completo
                  </label>
                  <Input
                    id="register-nome"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={registerData.nome}
                    onChange={(e) => setRegisterData({ ...registerData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Digite seu email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-password" className="text-sm font-medium">
                    Senha
                  </label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Digite sua senha (mín. 6 caracteres)"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-confirm" className="text-sm font-medium">
                    Confirmar Senha
                  </label>
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="Digite sua senha novamente"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                {registerError && (
                  <Alert variant="destructive">
                    <AlertDescription>{registerError}</AlertDescription>
                  </Alert>
                )}

                {registerSuccess && (
                  <Alert>
                    <AlertDescription>
                      Cadastro realizado com sucesso! Agora você pode fazer login.
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={registerLoading}>
                  {registerLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Cadastrar
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;