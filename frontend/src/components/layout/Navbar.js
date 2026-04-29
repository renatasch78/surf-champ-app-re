import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              flexGrow: 1
            }}
          >
            Surf Champ
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/"
                  sx={{ fontWeight: 'bold' }}
                >
                  Enviar Vídeo
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/dashboard"
                  startIcon={<DashboardIcon />}
                >
                  Dashboard
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/surfers"
                  startIcon={<PersonIcon />}
                >
                  Surfistas
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/profile"
                >
                  Perfil{currentUser?.role ? ` (${currentUser.role})` : ''}
                </Button>
                <Button
                  color="inherit"
                  onClick={handleLogout}
                >
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/login"
                >
                  Entrar
                </Button>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/register"
                >
                  Cadastrar
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
