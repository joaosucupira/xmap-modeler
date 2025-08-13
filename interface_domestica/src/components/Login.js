import * as React from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import CssBaseline from '@mui/joy/CssBaseline';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import Link from '@mui/joy/Link';
import ModeToggle from './ModeToggle';


export default function Login(props) {
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
              <b>Bem vindo ao XMAP!</b>
            </Typography>
            <Typography level="body-sm">Insira suas credenciais para continuar.</Typography>
          </div>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input
              // html input attribute
              name="email"
              type="email"
              placeholder="johndoe@email.com"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Senha</FormLabel>
            <Input
              // html input attribute
              name="password"
              type="password"
              placeholder="password"
            />
          </FormControl>
          <Typography
            endDecorator={<Link href="/recuperar">Recuperar</Link>}
            sx={{ fontSize: 'sm', alignSelf: 'center' }}
          >
            Esqueceu a senha?
          </Typography>
          <Button sx={{ mt: 1 /* margin top */ }}>Log in</Button>
          <Typography
            endDecorator={<Link href="/cadastro">Cadastre-se</Link>}
            sx={{ fontSize: 'sm', alignSelf: 'center' }}
          >
            Não possui uma conta?
          </Typography>
        </Sheet>
      </CssVarsProvider>
    </main>
  );
}
