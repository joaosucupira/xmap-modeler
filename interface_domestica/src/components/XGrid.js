import { Grid, Paper } from '@mui/material';


export default function XGrid() {
    return(<>
        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
            <Grid size={8}>
                <Paper>size=8</Paper>
            </Grid>
            <Grid size={4}>
                <Paper>size=4</Paper>
            </Grid>

            <Grid size={4}>
                <Paper>size=4</Paper>
            </Grid>
            <Grid size={8}>
                <Paper>size=8</Paper>
            </Grid>

            <Grid size={6}>
                <Paper>
                    paragragh <br/>
                    paragragh <br/>
                    paragragh <br/>
                </Paper>
            </Grid>
            <Grid size={6}>
                <Paper>size=8</Paper>
            </Grid>

            <Grid size={4}>
                <Paper>size=4</Paper>
            </Grid>
            <Grid size={4}>
                <Paper>size=4</Paper>
            </Grid>
            <Grid size={4}>
                <Paper>size=4</Paper>
            </Grid>
        </Grid>
    </>);
}

