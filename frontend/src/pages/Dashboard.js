import React from 'react';
import { Container, Typography, Box, Paper, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RecentVideos from '../components/videos/RecentVideos';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Painel de Controle
      </Typography>
      
      <Grid container spacing={3}>
        {/* Seção de boas-vindas */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Bem-vindo ao Surf Champ
            </Typography>
            <Typography paragraph>
              Aqui você pode gerenciar seus vídeos, acompanhar suas análises e melhorar suas habilidades no surf.
            </Typography>
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/')}
              >
                Enviar Novo Vídeo
              </Button>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => navigate('/surfers')}
              >
                Ver Surfistas
              </Button>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => navigate('/competitions')}
              >
                Competições
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Seção de estatísticas rápidas */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Estatísticas
            </Typography>
            <Typography color="text.secondary" paragraph>
              Em breve você verá suas estatísticas detalhadas aqui.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Box textAlign="center">
                <Typography variant="h6">0</Typography>
                <Typography variant="body2" color="text.secondary">Vídeos</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6">-</Typography>
                <Typography variant="body2" color="text.secondary">Média</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6">-</Typography>
                <Typography variant="body2" color="text.secondary">Melhor</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Seção de vídeos recentes */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <RecentVideos />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
