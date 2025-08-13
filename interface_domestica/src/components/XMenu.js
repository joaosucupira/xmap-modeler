import * as React from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import CssBaseline from '@mui/joy/CssBaseline';
import Typography from '@mui/joy/Typography';
import Link from '@mui/joy/Link';
import ModeToggle from './ModeToggle';
import NavMenu from './NavMenu.js';
import XGrid from './XGrid.js'

import './components.css';

function XMenu(props) {

    return(
        <>
        <main>
            <CssVarsProvider {...props}>
 
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
                <div className='navbar'>
                    <NavMenu/>
                    <Typography level="h4" component="h1">
                    <b>X Menu</b>
                    </Typography>
                </div>
                </Sheet>
            
            </CssVarsProvider>
        </main>

        </>
    );
}

export default XMenu;