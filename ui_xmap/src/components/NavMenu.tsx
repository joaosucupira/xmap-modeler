import React from 'react';
import { useAuth } from '../services/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';

const UserHeader: React.FC = () => {
  const { user, logout, isAuthEnabled } = useAuth();

  if (!user) return null;

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-gray-900">xMap Modeler</h1>
        {!isAuthEnabled && (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
            Modo Desenvolvimento
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">
          Olá, {user.nome}
        </span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white">
                  {getInitials(user.nome)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.nome}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
         
            <DropdownMenuSeparator />
            {isAuthEnabled && (
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default UserHeader;