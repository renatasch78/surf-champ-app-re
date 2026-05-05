import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, FormControl, InputLabel, Select, MenuItem, Button, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { setAuthToken } from '../config';
import { toast } from 'react-toastify';

const roleOptions = [
  { value: 'SURFER', label: 'Atleta' },
  { value: 'TRAINER', label: 'Treinador' },
  { value: 'ADMIN', label: 'Administrador' }
];

const Profile = () => {
  const { currentUser, login, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [selectedRole, setSelectedRole] = useState('SURFER');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        setProfile(data);
        setSelectedRole(data.role || 'SURFER');
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        setError('Não foi possível carregar seu perfil no momento. Faça login novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError('');

    try {
      const response = await userService.updateProfile({ role: selectedRole });
      if (response?.token) {
        setAuthToken(response.token);
        await login(response.token);
      }
      setProfile(response.user);
      toast.success('Perfil atualizado com sucesso');
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      setError(err.response?.data || 'Não foi possível atualizar seu perfil');
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Meu Perfil
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body1" sx={{ mb: 2 }}>
            Usuário: <strong>{profile?.username || currentUser?.username}</strong>
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Perfil atual: <strong>{profile?.role || currentUser?.role || 'SURFER'}</strong>
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="role-select-label">Tipo de Perfil</InputLabel>
            <Select
              labelId="role-select-label"
              id="role-select"
              value={selectedRole}
              label="Tipo de Perfil"
              onChange={handleRoleChange}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            fullWidth
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Atualizar Perfil'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Profile;
