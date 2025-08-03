import * as React from 'react';
import { CssVarsProvider, useColorScheme } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import CssBaseline from '@mui/joy/CssBaseline';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import Link from '@mui/joy/Link';
import Box from '@mui/joy/Box'; // Importado para a divisão em colunas
import FormHelperText from '@mui/joy/FormHelperText'; // Importado para o texto de erro
import ModeToggle from './ModeToggle';

export default function SignUp(props) {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleCheckPassword = () => {
    if (password !== confirmPassword && password !== '' && confirmPassword !== '') {
      setError('As senhas não coincidem!');
    } else {
      setError('');
    }
  };

  return (
    <main>
      <CssVarsProvider {...props}>
        <CssBaseline />
        <Sheet
          sx={{
            width: 500,
            mx: 'auto', // margin left & right
            my: 4, // margin top & bottom
            py: 3, // padding top & bottom
            px: 4, // padding left & right
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            borderRadius: 'sm',
            boxShadow: 'md',
          }}
          variant="outlined"
        >
          <div>
            <Typography level="h4" component="h1">
              <b>Cadastro</b>
            </Typography>
            <Typography level="body-sm">Suas informações pessoais não serão compartilhadas indevidamente.</Typography>
          </div>
          <FormControl>
            <FormLabel>Nome completo</FormLabel>
            <Input
              name="nome"
              type="text"
              placeholder="Rodrigo Czelusniak"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input
              name="email"
              type="email"
              placeholder="johndoe@email.com"
            />
          </FormControl>

          {/* Divisão em duas colunas para as senhas */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ flex: 1 }} error={!!error}>
              <FormLabel>Senha</FormLabel>
              <Input
                name="password"
                type="password"
                placeholder="senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={handleCheckPassword}
              />
            </FormControl>
            <FormControl sx={{ flex: 1 }} error={!!error}>
              <FormLabel>Confirmar Senha</FormLabel>
              <Input
                name="confirm-password"
                type="password"
                placeholder="confirmar senha"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onBlur={handleCheckPassword}
              />
              {error && <FormHelperText>{error}</FormHelperText>}
            </FormControl>
          </Box>

          <Button sx={{ mt: 1 }}>Log in</Button>
          <Typography
            endDecorator={<Link href="/login">Login</Link>}
            sx={{ fontSize: 'sm', alignSelf: 'center' }}
          >
            Já possui uma conta?
          </Typography>
        </Sheet>
      </CssVarsProvider>
    </main>
  );
}