import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  LinearProgress, 
  Alert, 
  TextField, 
  CircularProgress, 
  Autocomplete,
  Chip,
  InputAdornment,
  IconButton
} from '@mui/material';
import { CloudUpload, AddCircleOutline, Clear } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config';
import surferService from '../services/surferService';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const UploadVideo = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [surferName, setSurferName] = useState('');
  const [surfers, setSurfers] = useState([]);
  const [surferInput, setSurferInput] = useState('');
  const [isLoadingSurfers, setIsLoadingSurfers] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUser, isAuthenticated } = useAuth();
  const token = currentUser?.token; // ObtÃ©m o token do usuÃ¡rio atual

  // Carrega a lista de surfistas ao montar o componente
  useEffect(() => {
    const loadSurfers = async () => {
      try {
        setIsLoadingSurfers(true);
        const data = await surferService.getAll();
        setSurfers(data);
      } catch (error) {
        console.error('Erro ao carregar surfistas:', error);
        setError('NÃ£o foi possÃ­vel carregar a lista de surfistas.');
      } finally {
        setIsLoadingSurfers(false);
      }
    };

    loadSurfers();
  }, []);

  // FunÃ§Ã£o para validar se o surfista selecionado Ã© vÃ¡lido
  const isValidSurfer = () => {
    if (!surferName || surferName.trim() === '') {
      return false;
    }

    const trimmedSurferName = surferName.trim();

    // Verifica tamanho mÃ­nimo
    if (trimmedSurferName.length < 3) {
      return false;
    }

    // Verifica se existe na lista de surfistas
    const existingSurfer = surfers.find(surfer =>
      surfer.name.toLowerCase() === trimmedSurferName.toLowerCase()
    );

    return !!existingSurfer;
  };

  // Filtra os surfistas com base na entrada do usuÃ¡rio
  const filteredSurfers = surfers.filter(surfer => 
    surfer.name.toLowerCase().includes(surferInput.toLowerCase()) ||
    surfer.email?.toLowerCase().includes(surferInput.toLowerCase()) ||
    surfer.cpf?.includes(surferInput)
  );

  const handleSurferSelect = (event, value) => {
    if (value && typeof value === 'object' && value.name) {
      setSurferName(value.name);
      setError(''); // Limpa qualquer erro anterior
    } else {
      setSurferName('');
      setError('Por favor, selecione um surfista existente da lista.');
    }
  };

  const handleSurferInputChange = (event, value) => {
    setSurferInput(value);
  };

  const handleFileChange = (event) => {
    if (loading) return;

    if (!isAuthenticated) {
      setError('VocÃª precisa estar logado para enviar vÃ­deos.');
      window.location.href = '/login';
      return;
    }

    const file = event.target.files[0];
    if (file) {
      console.log('Arquivo selecionado:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      });

      // Verifica se o arquivo Ã© um vÃ­deo
      if (!file.type.startsWith('video/')) {
        setError('Por favor, selecione um arquivo de vÃ­deo vÃ¡lido.');
        setSelectedFile(null);
        return;
      }

      // Verifica extensÃµes suportadas
      const supportedExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !supportedExtensions.includes(fileExtension)) {
        setError(`Formato de vÃ­deo nÃ£o suportado. Use: ${supportedExtensions.join(', ')}`);
        setSelectedFile(null);
        return;
      }

      // Verifica tamanho mÃ¡ximo (100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB em bytes
      if (file.size > maxSize) {
        setError('O arquivo Ã© muito grande. O tamanho mÃ¡ximo permitido Ã© 100MB.');
        setSelectedFile(null);
        return;
      }

      // Verifica tamanho mÃ­nimo (1KB)
      if (file.size < 1024) {
        setError('O arquivo Ã© muito pequeno. Verifique se o arquivo estÃ¡ corrompido.');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = useCallback(async () => {
    if (loading) return;
    console.log('=== INÃCIO DO UPLOAD ===');
    console.log('UsuÃ¡rio autenticado:', isAuthenticated);
    console.log('Token do usuÃ¡rio:', token ? 'Presente' : 'Ausente');
    
    // ValidaÃ§Ã£o do arquivo
    if (!selectedFile) {
      const errorMsg = 'Por favor, selecione um arquivo de vÃ­deo para enviar.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Verifica o tamanho do arquivo (mÃ¡ximo 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB em bytes
    if (selectedFile.size > maxSize) {
      const errorMsg = 'O arquivo Ã© muito grande. O tamanho mÃ¡ximo permitido Ã© 100MB.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    // ValidaÃ§Ã£o do nome do surfista
    if (!surferName || surferName.trim() === '') {
      const errorMsg = 'Por favor, selecione um surfista da lista ou adicione um novo.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Verifica se o nome tem pelo menos 3 caracteres
    if (surferName.trim().length < 3) {
      const errorMsg = 'O nome do surfista deve ter pelo menos 3 caracteres.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Verifica se o surfista Ã© vÃ¡lido (existe na lista ou Ã© um novo surfista vÃ¡lido)
    const trimmedSurferName = surferName.trim();
    const existingSurfer = surfers.find(surfer =>
      surfer.name.toLowerCase() === trimmedSurferName.toLowerCase()
    );

    // Se nÃ£o encontrou na lista, valida como novo surfista
    if (!existingSurfer) {
      // Verifica se o nome contÃ©m apenas letras, espaÃ§os e caracteres acentuados
      const nameRegex = /^[A-Za-z\u00C0-\u00FF\s]+$/;
      if (!nameRegex.test(trimmedSurferName)) {
        const errorMsg = 'O nome do surfista deve conter apenas letras e espaÃ§os.';
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }

      // Verifica se nÃ£o Ã© apenas espaÃ§os
      if (trimmedSurferName.replace(/\s/g, '').length < 3) {
        const errorMsg = 'O nome do surfista deve ter pelo menos 3 letras (ignorando espaÃ§os).';
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }

      console.log('Novo surfista serÃ¡ criado:', trimmedSurferName);
    } else {
      console.log('Surfista existente selecionado:', existingSurfer.name);
    }

    // Verifica se o usuÃ¡rio estÃ¡ autenticado e se o token Ã© vÃ¡lido
    if (!isAuthenticated || !token) {
      console.error('UsuÃ¡rio nÃ£o autenticado. Redirecionando para login...');
      setError('SessÃ£o expirada. Por favor, faÃ§a login novamente.');
      
      // Remove o token invÃ¡lido e redireciona para o login apÃ³s um curto atraso
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2000);
      
      return;
    }

    // Verifica se o token nÃ£o expirou (JWT expira em 8 horas)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const expirationTime = new Date(payload.exp * 1000);
      const currentDateTime = new Date(currentTime * 1000);
      
      console.log('VerificaÃ§Ã£o do token JWT:', {
        expirationTime: expirationTime.toISOString(),
        currentTime: currentDateTime.toISOString(),
        isExpired: payload.exp < currentTime,
        timeUntilExpiration: Math.floor((payload.exp - currentTime) / 60), // minutos
        subject: payload.sub
      });
      
      if (payload.exp < currentTime) {
        console.error('Token expirado. Redirecionando para login...');
        setError('SessÃ£o expirada. Por favor, faÃ§a login novamente.');
        
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
        
        return;
      }
    } catch (e) {
      console.error('Erro ao verificar token:', e);
      setError('Token invÃ¡lido. Por favor, faÃ§a login novamente.');
      
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2000);
      
      return;
    }

    console.log('Token JWT sendo usado:', token); // Log para depuraÃ§Ã£o
    console.log('Arquivo selecionado:', {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      lastModified: selectedFile.lastModified
    });

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('username', currentUser.username);
    formData.append('surferName', existingSurfer.name);
    console.log('Usando surfista existente:', existingSurfer.name, 'ID:', existingSurfer.id);

    console.log('FormData preparado com:', {
      file: selectedFile.name,
      username: currentUser.username,
      surferName: existingSurfer.name
    });

    // Log detalhado do FormData
    console.log('ConteÃºdo do FormData:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    const url = API_ENDPOINTS.UPLOAD_VIDEO;

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log('Enviando requisiÃ§Ã£o para /api/videos/upload'); // Log para depuraÃ§Ã£o
      
      const response = await axios.post(url, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });
      
      console.log('Resposta do servidor:', response.data);

      setSuccess('VÃ­deo enviado com sucesso!');
      setSelectedFile(null);
      setSurferName('');
      setUploadProgress(0);
    } catch (err) {
      console.error('=== ERRO AO ENVIAR VÃDEO ===');
      const errorData = err?.response?.data;
      console.error('Response data:', JSON.stringify(errorData, null, 2));
      console.error('Network error details:', {
        code: err?.code,
        message: err?.message,
        hasRequest: !!err?.request,
        hasResponse: !!err?.response
      });
      
      if (err?.response?.status === 403) {
        // Se for erro de autenticaÃ§Ã£o, remove o token e forÃ§a novo login
        localStorage.removeItem('token');
        setError('SessÃ£o expirada. Por favor, faÃ§a login novamente.');
        window.location.href = '/login';
      } else if (
        err?.code === 'ERR_NETWORK' ||
        err?.code === 'ECONNRESET' ||
        String(err?.message || '').includes('ERR_CONNECTION_RESET') ||
        !err?.response
      ) {
        setError('NÃ£o foi possÃ­vel conectar ao servidor de upload (http://localhost:8080). Verifique se o backend estÃ¡ rodando e acessÃ­vel.');
      } else if (errorData?.message) {
        setError(`Erro: ${errorData.message}`);
      } else if (errorData) {
        setError(`Erro do servidor: ${JSON.stringify(errorData)}`);
      } else {
        setError('Ocorreu um erro ao enviar o vÃ­deo. Tente novamente.');
      }
      
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  }, [selectedFile, token, surferName, loading]);

  // Se chegou atÃ© aqui, o usuÃ¡rio estÃ¡ autenticado e pode ver o formulÃ¡rio
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Enviar Novo VÃ­deo
        </Typography>
        
        <Typography variant="body1" paragraph>
          FaÃ§a upload de seus melhores momentos no surf para anÃ¡lise e compartilhamento.
        </Typography>
        
        <Autocomplete
          id="surfer-select"
          options={filteredSurfers}
          getOptionLabel={(option) => option.name}
          inputValue={surferInput}
          onInputChange={handleSurferInputChange}
          onChange={handleSurferSelect}
          loading={isLoadingSurfers}
          noOptionsText="Nenhum surfista encontrado"
          loadingText="Carregando surfistas..."
          renderInput={(params) => (
            <TextField
              {...params}
              label="Pesquisar ou adicionar surfista"
              variant="outlined"
              margin="normal"
              required
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isLoadingSurfers ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {surferInput && (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => {
                            setSurferInput('');
                            setSurferName('');
                          }}
                          edge="end"
                        >
                          <Clear />
                        </IconButton>
                      </InputAdornment>
                    )}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <li key={key} {...otherProps}>
                <Box>
                  <Typography>{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email} â€¢ {option.cpf}
                  </Typography>
                </Box>
              </li>
            );
          }}
        />
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Selecione um surfista existente da lista.
          </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mb: 2 }}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUpload />}
            disabled={loading}
            fullWidth
            sx={{ mt: 2 }}
          >
            Selecionar VÃ­deo
            <VisuallyHiddenInput 
              type="file" 
              accept="video/*"
              disabled={loading}
              onChange={handleFileChange}
            />
          </Button>

          {selectedFile && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleUpload}
              disabled={loading || uploadProgress > 0 || !isValidSurfer()}
              fullWidth
            >
              {loading ? `Enviando... ${uploadProgress}%` : 'Enviar VÃ­deo'}
            </Button>
          )}
        </Box>

        {selectedFile && (
          <Box sx={{ mt: 2, mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight="medium">
                {selectedFile.name}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => {
                  setSelectedFile(null);
                  setUploadProgress(0);
                }}
                title="Remover arquivo"
              >
                <Clear fontSize="small" />
              </IconButton>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Tamanho: {(selectedFile.size / (1024 * 1024).toFixed(2))} MB
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tipo: {selectedFile.type || 'NÃ£o especificado'}
              </Typography>
            </Box>
          </Box>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ height: 10, borderRadius: 5, mb: 2 }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default UploadVideo;

