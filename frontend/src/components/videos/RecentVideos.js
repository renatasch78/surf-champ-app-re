import React, { useState, useEffect, useCallback, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import {
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Chip,
  Link,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { toast } from 'react-toastify';
import { videoService } from '../../services/videoService';
import { useAuth } from '../../contexts/AuthContext';
import VideoPlayerModal from './VideoPlayerModal';
import { formatFileSize, formatDate } from '../../utils/format';
import { createVideoThumbnail, createPlaceholderThumbnail } from '../../utils/videoUtils';
import { getOverallScore } from '../../utils/videoAnalysis';

const getStatusColor = (status) => {
  if (!status) return 'default';
  
  switch(status.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'processing':
      return 'info';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
};

const RecentVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingMockData, setUsingMockData] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [thumbnails, setThumbnails] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const stompClient = useRef(null);
  const { currentUser } = useAuth();
  
  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  const handleDeleteClick = (video, event) => {
    event.stopPropagation(); // Impede que o clique no botão dispare o clique na linha
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!videoToDelete || !currentUser) return;
    
    setIsDeleting(true);
    try {
      await videoService.deleteVideo(videoToDelete.id, currentUser.username);
      
      // Atualiza a lista de vídeos localmente primeiro para uma resposta mais rápida
      setVideos(prevVideos => prevVideos.filter(video => video.id !== videoToDelete.id));
      
      // Atualiza o estado das miniaturas
      setThumbnails(prev => {
        const newThumbnails = {...prev};
        delete newThumbnails[videoToDelete.id];
        return newThumbnails;
      });
      
      // Mostra a mensagem de sucesso
      toast.success(`✅ Vídeo ${videoToDelete.filename} excluído com sucesso!`, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Atualiza a lista do servidor em segundo plano
      try {
        await fetchVideos();
      } catch (fetchError) {
        console.error('Erro ao atualizar a lista de vídeos:', fetchError);
      }
      
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      toast.error(`❌ Erro ao excluir o vídeo ${videoToDelete.filename}`, {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Se houver erro, tenta recarregar a lista do servidor
      try {
        await fetchVideos();
      } catch (fetchError) {
        console.error('Erro ao atualizar a lista de vídeos:', fetchError);
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setVideoToDelete(null);
  };

  // Function to generate thumbnails for videos
  const generateThumbnails = useCallback(async (videos) => {
    console.log('[Thumbnail] Iniciando geração de miniaturas para', videos?.length, 'vídeos');
    if (!videos || !Array.isArray(videos)) {
      console.warn('[Thumbnail] Nenhum vídeo fornecido para geração de miniaturas');
      return;
    }
    
    console.log('[Thumbnail] Lista de vídeos recebida:', videos.map(v => ({
      id: v.id,
      filename: v.filename,
      videoUrl: v.videoUrl ? `${v.videoUrl.substring(0, 50)}...` : 'não disponível',
      status: v.status
    })));
    
    const newThumbnails = {};
    
    for (const video of videos) {
      console.log(`[Thumbnail] Processando vídeo ID: ${video.id}, Nome: ${video.filename}`);
      
      // Verifica possíveis nomes de propriedades que podem conter a URL do vídeo
      const possibleUrlKeys = ['videoUrl', 'video_url'];
      console.log(`[Thumbnail] Propriedades do vídeo ${video.id}:`, Object.keys(video));
      let videoUrl = null;
      
      // Encontra a primeira propriedade que existe no objeto do vídeo
      for (const key of possibleUrlKeys) {
        if (video[key]) {
          videoUrl = video[key];
          console.log(`[Thumbnail] URL encontrada na propriedade '${key}': ${videoUrl}`);
          break;
        }
      }
      
      if (videoUrl) {
        console.log(`[Thumbnail] Gerando miniatura para o vídeo ${video.id}...`);
        try {
          const thumbnail = await createVideoThumbnail(videoUrl);
          newThumbnails[video.id] = thumbnail;
          console.log(`[Thumbnail] Miniatura gerada com sucesso para o vídeo ${video.id}`);
          console.log(`[Thumbnail] URL da miniatura: ${thumbnail.substring(0, 100)}...`);
        } catch (error) {
          console.warn(`[Thumbnail] Erro ao gerar miniatura para o vídeo ${video.id}:`, error);
          const placeholder = createPlaceholderThumbnail(video.filename);
          newThumbnails[video.id] = placeholder;
          console.log(`[Thumbnail] Miniatura padrão utilizada para o vídeo ${video.id}`);
          console.log(`[Thumbnail] URL da miniatura padrão: ${placeholder.substring(0, 100)}...`);
        }
      } else {
        console.log(`[Thumbnail] URL do vídeo não disponível para o vídeo ${video.id}`);
        const placeholder = createPlaceholderThumbnail(video.filename);
        newThumbnails[video.id] = placeholder;
        console.log(`[Thumbnail] Miniatura padrão gerada para o vídeo ${video.id} (sem URL)`);
        console.log(`[Thumbnail] URL da miniatura padrão: ${placeholder.substring(0, 100)}...`);
      }
    }
    
    // Atualiza o estado com as novas miniaturas
    setThumbnails(prev => ({
      ...prev,
      ...newThumbnails
    }));
    
    console.log('[Thumbnail] Geração de miniaturas concluída');
    return newThumbnails;
  }, []);

  // WebSocket setup
  const setupWebSocket = useCallback(() => {
    try {
      const socket = new SockJS('http://localhost:8080/ws');
      stompClient.current = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        debug: function(str) {
          console.log('WebSocket:', str);
        },
        onConnect: () => {
          console.log('Conectado ao WebSocket');
          stompClient.current.subscribe('/topic/videos', (message) => {
            const videoAtualizado = JSON.parse(message.body).dados;
            console.log('Vídeo atualizado recebido:', videoAtualizado);
            
            setVideos(prevVideos => {
              const videoIndex = prevVideos.findIndex(v => v.id === videoAtualizado.id);
              
              if (videoIndex >= 0) {
                // Atualiza o vídeo existente
                const novosVideos = [...prevVideos];
                novosVideos[videoIndex] = {
                  ...novosVideos[videoIndex],
                  ...videoAtualizado,
                  status: videoAtualizado.status || 'PENDING'
                };
                return novosVideos;
              } else {
                // Adiciona um novo vídeo se não existir
                return [videoAtualizado, ...prevVideos];
              }
            });
          });
        },
        onStompError: (frame) => {
          console.error('Erro na conexão WebSocket:', frame);
        }
      });
      
      stompClient.current.activate();
    } catch (error) {
      console.error('Erro ao configurar WebSocket:', error);
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Buscando vídeos recentes para o usuário autenticado');
      
      const data = await videoService.getRecentVideos();
      console.log('Dados recebidos da API:', data);
      
      // Log detalhado para o vídeo 11
      const video11 = data?.find(v => v.id === 11 || v.filename === 'Recreio1.mp4');
      if (video11) {
        console.log('Detalhes do vídeo 11 (Recreio1.mp4):', {
          ...video11,
          hasVideoUrl: !!video11.videoUrl,
          keys: Object.keys(video11)
        });
      }
      
      if (data && data.length > 0) {
        console.log('Vídeos carregados com sucesso:', data.length);
        setUsingMockData(false);
        setVideos(data);
        generateThumbnails(data);
      } else {
        console.log('Nenhum vídeo encontrado para o usuário:', currentUser?.username);
        setVideos([]);
        setUsingMockData(false);
      }
    } catch (err) {
      console.error('Erro ao carregar vídeos recentes:', err);
      setError('Não foi possível carregar os vídeos recentes. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, generateThumbnails]);

  useEffect(() => {
    fetchVideos();
    setupWebSocket();
    
    // Cleanup function
    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [fetchVideos, setupWebSocket]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (videos.length === 0) {
    return (
      <Box p={2}>
        <Typography>Nenhum vídeo encontrado.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Últimos Vídeos Enviados
        </Typography>
        {usingMockData && (
          <Chip 
            label="Dados de Exemplo" 
            color="warning" 
            size="small" 
            variant="outlined"
          />
        )}
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome do Arquivo</TableCell>
              <TableCell align="center">Tamanho</TableCell>
              <TableCell align="center">Data de Envio</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Nota</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                      sx={{
                        position: 'relative',
                        width: 80,
                        height: 45,
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'rgba(0, 0, 0, 0.08)',
                        '&:hover .play-icon': {
                          opacity: 1,
                          transform: 'scale(1.1)'
                        }
                      }}
                      onClick={() => handleVideoClick(video)}
                    >
                      {thumbnails[video.id] ? (
                        <>
                          <img 
                            src={thumbnails[video.id]} 
                            alt="Thumbnail" 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              cursor: 'pointer'
                            }} 
                          />
                          <Box
                            className="play-icon"
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: 'white',
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              borderRadius: '50%',
                              width: 36,
                              height: 36,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              opacity: 0.8,
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                opacity: 1,
                                transform: 'translate(-50%, -50%) scale(1.1)'
                              }
                            }}
                          >
                            <PlayCircleOutlineIcon />
                          </Box>
                        </>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            color: 'text.secondary',
                            fontSize: 12
                          }}
                        >
                          {video.filename?.charAt(0)?.toUpperCase() || 'V'}
                        </Box>
                      )}
                    </Box>
                    <Link 
                      component="button" 
                      variant="body1" 
                      onClick={() => handleVideoClick(video)}
                      sx={{ 
                        textAlign: 'left', 
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 200,
                        display: 'inline-block',
                        verticalAlign: 'middle'
                      }}
                    >
                      {video.filename || 'Vídeo sem nome'}
                    </Link>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {formatFileSize(video.fileSize)}
                </TableCell>
                <TableCell align="center">
                  {formatDate(video.createdAt)}
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={video.status || 'PENDENTE'} 
                    color={getStatusColor(video.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {video.status === 'COMPLETED' ? 
                    (video.score !== undefined && video.score !== null ? 
                      getOverallScore(video) : '-') : 
                    <Chip 
                      label={video.status === 'PROCESSING' ? 'Processando...' : 'Pendente'} 
                      color="info"
                      size="small"
                      variant="outlined"
                    />
                  }
                </TableCell>
                <TableCell align="center">
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={(e) => handleDeleteClick(video, e)}
                    disabled={isDeleting}
                    title="Excluir vídeo"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Modal do Player de Vídeo */}
      <VideoPlayerModal 
        open={isPlayerOpen} 
        onClose={() => {
          setIsPlayerOpen(false);
          setSelectedVideo(null);
        }} 
        video={selectedVideo}
        allVideos={videos}
      />

      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tem certeza que deseja excluir o vídeo <strong>{videoToDelete?.filename}</strong>? 
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            autoFocus
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : null}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecentVideos;
