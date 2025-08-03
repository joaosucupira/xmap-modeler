import * as React from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import CssBaseline from '@mui/joy/CssBaseline';
import Typography from '@mui/joy/Typography';
import Link from '@mui/joy/Link';
import ModeToggle from './ModeToggle';

export default function Recuperar(props) {
    return(<>
        <main>
            <CssVarsProvider {...props}>
                <ModeToggle/>
                <CssBaseline />
                <Sheet
                    sx={{
                        width: 400,
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
                    variant='outlined'
                >
                <div>
                    <Typography level="h4" component="h1">
                    <b>Enviamos um link de recuperação para seu correio eletrônico cadastrado</b>
                    </Typography>
                    <Typography level="body-sm">Matenha a calma e verifique também sua caixa de spam</Typography>
                    <Link href="/login">Retornar a login</Link>
                </div>
                </Sheet>
            </CssVarsProvider>
        </main>
    </>);
}