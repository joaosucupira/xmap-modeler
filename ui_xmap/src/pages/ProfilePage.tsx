import { useState, useEffect, useRef } from "react";
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  Loader2, 
  Eye, 
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface UserProfile {
  id: number;
  nome: string;
  email: string;
  avatar_url?: string;
}

export const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  
  // Form states
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  
  // UI states
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  
  // Messages
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const getToken = () => localStorage.getItem("authToken");

  // Carregar perfil
  useEffect(() => {
    const fetchProfile = async () => {
      const authToken = getToken();
      
      // Tentar buscar da API
      if (authToken) {
        try {
          const response = await fetch(`${API_URL}/perfil/me`, {
            headers: { 
              "Authorization": `Bearer ${authToken}`,
              "Content-Type": "application/json"
            }
          });

          if (response.ok) {
            const data: UserProfile = await response.json();
            setProfile(data);
            setNome(data.nome || "");
            setEmail(data.email || "");
            setIsOnline(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("API não disponível:", err);
        }
      }

      // Fallback: modo demonstração
      setProfile({
        id: 1,
        nome: "Usuário Demo",
        email: "demo@exemplo.com",
      });
      setNome("Usuário Demo");
      setEmail("demo@exemplo.com");
      setIsOnline(false);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  // Salvar alterações
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    // Validações
    if (novaSenha && novaSenha !== confirmarSenha) {
      setErrorMessage("As senhas não conferem");
      return;
    }

    if (novaSenha && novaSenha.length < 6) {
      setErrorMessage("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (novaSenha && !senhaAtual) {
      setErrorMessage("Informe a senha atual para alterar a senha");
      return;
    }

    // Montar payload
    const payload: Record<string, string> = {};
    if (nome !== profile?.nome) payload.nome = nome;
    if (email !== profile?.email) payload.email = email;
    if (novaSenha) {
      payload.senha_atual = senhaAtual;
      payload.nova_senha = novaSenha;
    }

    if (Object.keys(payload).length === 0) {
      setSuccessMessage("Nenhuma alteração para salvar");
      return;
    }

    setSaving(true);

    try {
      const authToken = getToken();
      
      if (authToken && isOnline) {
        const response = await fetch(`${API_URL}/perfil/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(prev => prev ? { ...prev, ...data.usuario } : data.usuario);
          setSuccessMessage("Perfil atualizado com sucesso!");
          setSenhaAtual("");
          setNovaSenha("");
          setConfirmarSenha("");
          setSaving(false);
          return;
        } else {
          const errorData = await response.json();
          setErrorMessage(errorData.detail || "Erro ao atualizar perfil");
          setSaving(false);
          return;
        }
      }

      // Fallback local
      setProfile(prev => prev ? { ...prev, nome, email } : null);
      setSuccessMessage("Perfil atualizado localmente!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao atualizar perfil";
      setErrorMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  // Upload de avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("A imagem deve ter no máximo 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Tipo de arquivo não permitido. Use: JPG, PNG, GIF ou WEBP");
      return;
    }

    setUploadingAvatar(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const authToken = getToken();
      
      if (authToken && isOnline) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_URL}/perfil/avatar`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${authToken}` },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          const avatarUrl = data.avatar_url.startsWith("http") 
            ? data.avatar_url 
            : `${API_URL}${data.avatar_url}`;
          setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
          setSuccessMessage("Avatar atualizado com sucesso!");
          setUploadingAvatar(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      }

      // Fallback local
      const localUrl = URL.createObjectURL(file);
      setProfile(prev => prev ? { ...prev, avatar_url: localUrl } : null);
      setSuccessMessage("Avatar atualizado localmente!");
      
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao atualizar avatar";
      setErrorMessage(errorMsg);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Remover avatar
  const handleRemoveAvatar = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const authToken = getToken();
      
      if (authToken && isOnline) {
        const response = await fetch(`${API_URL}/perfil/avatar`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${authToken}` }
        });

        if (response.ok) {
          setProfile(prev => prev ? { ...prev, avatar_url: undefined } : null);
          setSuccessMessage("Avatar removido com sucesso!");
          return;
        }
      }

      // Fallback local
      setProfile(prev => prev ? { ...prev, avatar_url: undefined } : null);
      setSuccessMessage("Avatar removido!");

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao remover avatar";
      setErrorMessage(errorMsg);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const getAvatarUrl = () => {
    if (!profile?.avatar_url) return undefined;
    if (profile.avatar_url.startsWith("http") || profile.avatar_url.startsWith("blob:")) {
      return profile.avatar_url;
    }
    return `${API_URL}${profile.avatar_url}`;
  };

  // Limpar mensagens após 5 segundos
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-500">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Meu Perfil</h1>
            <p className="text-gray-500 text-sm">Gerencie suas informações pessoais</p>
          </div>
        </div>

        {/* Aviso modo offline */}
        {!isOnline && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Modo demonstração - As alterações não serão salvas no servidor
            </AlertDescription>
          </Alert>
        )}

        {/* Mensagens */}
        {successMessage && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Foto de Perfil
              </CardTitle>
              <CardDescription>Clique na imagem para alterar sua foto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <Avatar 
                    className="h-28 w-28 cursor-pointer ring-4 ring-white shadow-xl transition-transform group-hover:scale-105"
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage src={getAvatarUrl()} alt={profile?.nome} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getInitials(profile?.nome || "")}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div 
                    className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                      <Camera className="h-8 w-8 text-white" />
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                
                <div className="text-center sm:text-left space-y-2">
                  <p className="font-semibold text-lg">{profile?.nome}</p>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                  
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleAvatarClick} disabled={uploadingAvatar}>
                      <Camera className="h-4 w-4 mr-2" />
                      Alterar
                    </Button>
                    {profile?.avatar_url && (
                      <Button type="button" variant="outline" size="sm" onClick={handleRemoveAvatar} disabled={uploadingAvatar} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">JPG, PNG, GIF ou WEBP. Máx. 5MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Pessoais */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>Atualize suas informações básicas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alterar Senha */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>Deixe em branco para manter a senha atual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senhaAtual">Senha Atual</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="senhaAtual" type={showSenhaAtual ? "text" : "password"} value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="••••••••" className="pl-10 pr-10" />
                  <button type="button" onClick={() => setShowSenhaAtual(!showSenhaAtual)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="novaSenha" type={showNovaSenha ? "text" : "password"} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="••••••••" className="pl-10 pr-10" />
                    <button type="button" onClick={() => setShowNovaSenha(!showNovaSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="confirmarSenha" type={showConfirmarSenha ? "text" : "password"} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="••••••••" className="pl-10 pr-10" />
                    <button type="button" onClick={() => setShowConfirmarSenha(!showConfirmarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {novaSenha && (
                <div className="space-y-1">
                  <div className={`flex items-center gap-2 text-xs ${novaSenha.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle2 className={`h-3 w-3 ${novaSenha.length >= 6 ? 'opacity-100' : 'opacity-30'}`} />
                    Mínimo de 6 caracteres
                  </div>
                  {confirmarSenha && (
                    <div className={`flex items-center gap-2 text-xs ${novaSenha === confirmarSenha ? 'text-green-600' : 'text-red-600'}`}>
                      {novaSenha === confirmarSenha ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {novaSenha === confirmarSenha ? 'Senhas conferem' : 'As senhas não conferem'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/")} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : <><Save className="h-4 w-4 mr-2" />Salvar Alterações</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;