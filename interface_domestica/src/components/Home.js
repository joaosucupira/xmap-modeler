import * as React from 'react';
import XMenu from './XMenu.js';
import { Grid, Paper } from '@mui/material';

import './components.css';

function Home(props) {

    return(
        <>
        <Grid container spacing={2} sx={{flexGrow: 1}}>
            <Grid size={4}>
                <XMenu/>
            </Grid>
            <Grid size={8}>
                {/* Inserir aqui a aba "Meus mapas"*/}
            </Grid>
        </Grid>
        <Grid container spacing={2} sx={{flexGrow: 1}}>
        </Grid>
        

        </>
    );
}

export default Home;