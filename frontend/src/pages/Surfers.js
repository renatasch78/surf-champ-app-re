import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import SurferList from '../components/surfers/SurferList';

const Surfers = () => {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 3,
        px: { xs: 2, sm: 3 },
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[900],
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Gerenciar Surfistas
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Cadastre e gerencie os surfistas do sistema. Você pode adicionar novas informações, 
            editar dados existentes ou desativar perfis conforme necessário.
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 3 }}>
          <SurferList />
        </Paper>
      </Container>
    </Box>
  );
};

export default Surfers;
