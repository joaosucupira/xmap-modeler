import React, { useState } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import CssBaseline from '@mui/joy/CssBaseline';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import Link from '@mui/joy/Link';
import api from '../_service/api.js';
import { useNavigate } from 'react-router-dom';

export default function Login(props) {
  let navigate = useNavigate()
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function submitForm(event) {
    event.preventDefault();
    try {
      const loginResponse = await api.post("/login", { email, senha });
      const token = loginResponse.data.access_token;
      localStorage.setItem('token', token);

      // Fetch user info (if needed)
      const userResponse = await api.get("/me", { //Aqui precisa ter o id do usuario para que sejam informações apenas do usuario autenticado
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = userResponse.data;
      localStorage.setItem('username', userData.name);
      localStorage.setItem('useremail', userData.email);
      console.log(userData)
      console.log(loginResponse.data)

      alert("Successfully logged in.");
      navigate('/home')
    } catch (error) {
      alert("Wrong username or password.");
      console.log(error);
    }
  }

  return (
    <main>
      <CssVarsProvider {...props}>
        <CssBaseline />
        <Sheet
          sx={{
            width: 500,
            mx: 'auto',
            my: 4,
            py: 3,
            px: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            borderRadius: 'sm',
            boxShadow: 'md',
          }}
          variant="outlined"
        >
          <Typography level="h4" component="h1">
            <b>Bem vindo ao XMAP!</b>
          </Typography>
          <Typography level="body-sm">Insira suas credenciais para continuar.</Typography>
          <form onSubmit={submitForm}>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                name="email"
                type="email"
                placeholder="johndoe@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Senha</FormLabel>
              <Input
                name="senha"
                type="password"
                placeholder="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
              />
            </FormControl>
            <Typography
              endDecorator={<Link href="/recuperar">Recuperar</Link>}
              sx={{ fontSize: 'sm', alignSelf: 'center' }}
            >
              Esqueceu a senha?
            </Typography>
            <Button type="submit" sx={{ mt: 1 }}>
              Log in
            </Button>
            <Typography
              endDecorator={<Link href="/cadastro">Cadastre-se</Link>}
              sx={{ fontSize: 'sm', alignSelf: 'center' }}
            >
              Não possui uma conta?
            </Typography>
          </form>
        </Sheet>
      </CssVarsProvider>
    </main>
  );
}