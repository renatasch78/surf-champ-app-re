import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_ENDPOINTS, setAuthToken } from '../../config';
import axios from 'axios';
import { TextField, Button, Container, Typography, Box, Paper, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    username: 'admin',
    password: 'admin123'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromGoogle = params.get('token');
    const errorFromGoogle = params.get('error');

    if (tokenFromGoogle) {
      setAuthToken(tokenFromGoogle);
      login(tokenFromGoogle);
      navigate(from, { replace: true });
      return;
    }

    if (errorFromGoogle) {
      setError('Falha ao autenticar com Google. Tente novamente.');
    }
  }, [location.search, login, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleLogin = () => {
    const redirectUri = `${window.location.origin}/login`;
    window.location.href = `${API_ENDPOINTS.GOOGLE_LOGIN}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Form data being sent:', formData);

    try {
      const response = await axios.post(API_ENDPOINTS.LOGIN, {
        username: formData.username,
        password: formData.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Login response:', response.data);

      const token = response.data.token || response.data;
      if (!token) {
        throw new Error('No token received');
      }
      
      setAuthToken(token);
      login(token);
      
      // Redireciona para a página de origem ou para a página inicial
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.response?.data?.message || 'Usuário ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Surf Champ - Login
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 2 }}>
            Teste de push na branch vercel - Daniel
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Nome de Usuário"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              onClick={handleGoogleLogin}
            >
              Entrar com Google
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/register')}
            >
              Não tem uma conta? Cadastre-se
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
