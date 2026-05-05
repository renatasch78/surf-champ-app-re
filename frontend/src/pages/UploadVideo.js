import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  LinearProgress, 
  TextField, 
  CircularProgress, 
  Autocomplete,
  InputAdornment,
  IconButton
} from '@mui/material';
import { CloudUpload, Clear } from '@mui/icons-material';
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
  const { currentUser, isAuthenticated } = useAuth();
  const token = currentUser?.token; // Obtém o token do usuário atual

  // Carrega a lista de surfistas ao montar o componente
  useEffect(() => {
    const loadSurfers = async () => {
      try {
        setIsLoadingSurfers(true);
        const data = await surferService.getAll();
        setSurfers(data);
      } catch (error) {
        console.error('Erro ao carregar surfistas:', error);
        setError('Não foi possível carregar a lista de surfistas.');
      } finally {
        setIsLoadingSurfers(false);
      }
    };

    loadSurfers();
  }, []);

  // Função para validar se o surfista selecionado é válido
  const isValidSurfer = () => {
    if (!surferName || surferName.trim() === '') {
      return false;
    }

    const trimmedSurferName = surferName.trim();

    // Verifica tamanho mínimo
    if (trimmedSurferName.length < 3) {
      return false;
    }

    // Verifica se existe na lista de surfistas
    const existingSurfer = surfers.find(surfer =>
      surfer.name.toLowerCase() === trimmedSurferName.toLowerCase()
    );

    return !!existingSurfer;
  };

  // Filtra os surfistas com base na entrada do usuário
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
    if (!isAuthenticated) {
      setError('Você precisa estar logado para enviar vídeos.');
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

      // Verifica se o arquivo é um vídeo
      if (!file.type.startsWith('video/')) {
        setError('Por favor, selecione um arquivo de vídeo válido.');
        setSelectedFile(null);
        return;
      }

      // Verifica extensões suportadas
      const supportedExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !supportedExtensions.includes(fileExtension)) {
        setError(`Formato de vídeo não suportado. Use: ${supportedExtensions.join(', ')}`);
        setSelectedFile(null);
        return;
      }

      // Verifica tamanho máximo (100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB em bytes
      if (file.size > maxSize) {
        setError('O arquivo é muito grande. O tamanho máximo permitido é 100MB.');
        setSelectedFile(null);
        return;
      }

      // Verifica tamanho mínimo (1KB)
      if (file.size < 1024) {
        setError('O arquivo é muito pequeno. Verifique se o arquivo está corrompido.');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = useCallback(async () => {
    console.log('=== INÍCIO DO UPLOAD ===');
    console.log('Usuário autenticado:', isAuthenticated);
    console.log('Token do usuário:', token ? 'Presente' : 'Ausente');
    
    // Validação do arquivo
    if (!selectedFile) {
      const errorMsg = 'Por favor, selecione um arquivo de vídeo para enviar.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Verifica o tamanho do arquivo (máximo 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB em bytes
    if (selectedFile.size > maxSize) {
      const errorMsg = 'O arquivo é muito grande. O tamanho máximo permitido é 100MB.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    // Validação do nome do surfista
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

    // Verifica se o surfista é válido (existe na lista ou é um novo surfista válido)
    const trimmedSurferName = surferName.trim();
    const existingSurfer = surfers.find(surfer =>
      surfer.name.toLowerCase() === trimmedSurferName.toLowerCase()
    );

    // Se não encontrou na lista, valida como novo surfista
    if (!existingSurfer) {
      // Verifica se o nome contém apenas letras, espaços e caracteres acentuados
      const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
      if (!nameRegex.test(trimmedSurferName)) {
        const errorMsg = 'O nome do surfista deve conter apenas letras e espaços.';
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }

      // Verifica se não é apenas espaços
      if (trimmedSurferName.replace(/\s/g, '').length < 3) {
        const errorMsg = 'O nome do surfista deve ter pelo menos 3 letras (ignorando espaços).';
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }

      console.log('Novo surfista será criado:', trimmedSurferName);
    } else {
      console.log('Surfista existente selecionado:', existingSurfer.name);
    }

    // Verifica se o usuário está autenticado e se o token é válido
    if (!isAuthenticated || !token) {
      console.error('Usuário não autenticado. Redirecionando para login...');
      setError('Sessão expirada. Por favor, faça login novamente.');
      
      // Remove o token inválido e redireciona para o login após um curto atraso
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2000);
      
      return;
    }

    // Verifica se o token não expirou (JWT expira em 8 horas)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const expirationTime = new Date(payload.exp * 1000);
      const currentDateTime = new Date(currentTime * 1000);
      
      console.log('Verificação do token JWT:', {
        expirationTime: expirationTime.toISOString(),
        currentTime: currentDateTime.toISOString(),
        isExpired: payload.exp < currentTime,
        timeUntilExpiration: Math.floor((payload.exp - currentTime) / 60), // minutos
        subject: payload.sub
      });
      
      if (payload.exp < currentTime) {
        console.error('Token expirado. Redirecionando para login...');
        setError('Sessão expirada. Por favor, faça login novamente.');
        
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
        
        return;
      }
    } catch (e) {
      console.error('Erro ao verificar token:', e);
      setError('Token inválido. Por favor, faça login novamente.');
      
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2000);
      
      return;
    }

    console.log('Token JWT sendo usado:', token); // Log para depuração
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
    console.log('Conteúdo do FormData:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    const url = API_ENDPOINTS.UPLOAD_VIDEO;

    try {
      setError('');
      setSuccess('');
      
      console.log('Enviando requisição para /api/videos/upload'); // Log para depuração
      
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

      setSuccess('Vídeo enviado com sucesso!');
      setSelectedFile(null);
      setSurferName('');
      setUploadProgress(0);
    } catch (err) {
      console.error('=== ERRO AO ENVIAR VÍDEO ===');
      const errorData = err?.response?.data;
      console.error('Response data:', JSON.stringify(errorData, null, 2));
      console.error('Network error details:', {
        code: err?.code,
        message: err?.message,
        hasRequest: !!err?.request,
        hasResponse: !!err?.response
      });
      
      if (err?.response?.status === 403) {
        // Se for erro de autenticação, remove o token e força novo login
        localStorage.removeItem('token');
        setError('Sessão expirada. Por favor, faça login novamente.');
        window.location.href = '/login';
      } else if (
        err?.code === 'ERR_NETWORK' ||
        err?.code === 'ECONNRESET' ||
        String(err?.message || '').includes('ERR_CONNECTION_RESET') ||
        !err?.response
      ) {
        setError('Não foi possível conectar ao servidor de upload (http://localhost:8080). Verifique se o backend está rodando e acessível.');
      } else if (errorData?.message) {
        setError(`Erro: ${errorData.message}`);
      } else if (errorData) {
        setError(`Erro do servidor: ${JSON.stringify(errorData)}`);
      } else {
        setError('Ocorreu um erro ao enviar o vídeo. Tente novamente.');
      }
      
      setUploadProgress(0);
    }
  }, [selectedFile, token, surferName, isAuthenticated, surfers, currentUser?.username]);

  // Se chegou até aqui, o usuário está autenticado e pode ver o formulário
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Enviar Novo Vídeo
        </Typography>
        
        <Typography variant="body1" paragraph>
          Faça upload de seus melhores momentos no surf para análise e compartilhamento.
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {success && (
          <Typography color="success.main" sx={{ mb: 2 }}>
            {success}
          </Typography>
        )}
        
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
                    {option.email} • {option.cpf}
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
            fullWidth
            sx={{ mt: 2 }}
          >
            Selecionar Vídeo
            <VisuallyHiddenInput 
              type="file" 
              accept="video/*"
              onChange={handleFileChange}
            />
          </Button>

          {selectedFile && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleUpload}
              disabled={uploadProgress > 0 || !isValidSurfer()}
              fullWidth
            >
              {uploadProgress > 0 ? `Enviando... ${uploadProgress}%` : 'Enviar Vídeo'}
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
                Tipo: {selectedFile.type || 'Não especificado'}
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
