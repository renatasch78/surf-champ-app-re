import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Modal,
  Typography,
  Paper,
  IconButton,
  Divider,
  Chip,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Button,
  Select,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { formatFileSize } from '../../utils/format';
import { getAuthToken } from '../../utils/auth';
import { getWaveAnalysis, getOverallScore } from '../../utils/videoAnalysis';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const resolveVideoUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  if (
    rawUrl.startsWith('http://') ||
    rawUrl.startsWith('https://') ||
    rawUrl.startsWith('blob:') ||
    rawUrl.startsWith('data:')
  ) {
    return rawUrl;
  }

  if (rawUrl.startsWith('/')) {
    return `${API_BASE_URL}${rawUrl}`;
  }

  return `${API_BASE_URL}/${rawUrl}`;
};

const getMediaErrorMessage = (code) => {
  switch (code) {
    case 1:
      return 'MEDIA_ERR_ABORTED';
    case 2:
      return 'MEDIA_ERR_NETWORK';
    case 3:
      return 'MEDIA_ERR_DECODE';
    case 4:
      return 'MEDIA_ERR_SRC_NOT_SUPPORTED';
    default:
      return 'MEDIA_ERR_UNKNOWN';
  }
};

const isProtectedStreamUrl = (resolvedUrl) => (
  typeof resolvedUrl === 'string' && resolvedUrl.includes('/api/videos/stream/')
);

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: '1200px',
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const AnalysisMetric = ({ label, value, compareValue = null, max = 10, isComparison = false }) => {
  const getBarColor = (val, compareVal = null) => {
    if (!compareVal) return 'primary';
    if (val > compareVal) return 'success';
    if (val < compareVal) return 'error';
    return 'primary';
  };

  const getComparisonText = () => {
    if (!compareValue) return null;
    const diff = value - compareValue;
    if (diff > 0) return `+${diff.toFixed(1)}`;
    if (diff < 0) return diff.toFixed(1);
    return '0.0';
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          {isComparison && compareValue !== null && (
            <Typography 
              variant="caption" 
              color={value > compareValue ? 'success.main' : value < compareValue ? 'error.main' : 'text.secondary'}
              fontWeight="bold"
            >
              {getComparisonText()}
            </Typography>
          )}
          <Typography variant="body2" fontWeight="bold">
            {value.toFixed(1)}/{max}
          </Typography>
        </Box>
      </Box>
      <Box position="relative" width="100%" height={8} mb={1}>
        <LinearProgress 
          variant="determinate" 
          value={(value / max) * 100} 
          color={getBarColor(value, compareValue)}
          sx={{ 
            height: 8, 
            borderRadius: 1,
            position: 'absolute',
            width: '100%',
            opacity: isComparison ? 0.7 : 1
          }}
        />
        {isComparison && compareValue !== null && (
          <LinearProgress 
            variant="determinate" 
            value={(compareValue / max) * 100} 
            color={getBarColor(compareValue, value)}
            sx={{ 
              height: 2, 
              borderRadius: 1,
              position: 'absolute',
              width: '100%',
              top: 8,
              opacity: 0.7
            }}
          />
        )}
      </Box>
    </Box>
  );
};

const VideoPlayerModal = ({ open, onClose, video: propVideo, allVideos = [] }) => {
  // Estados para controle de carregamento, erros e tamanho do vídeo
  const [videoLoading, setVideoLoading] = useState({});
  const [videoError, setVideoError] = useState({});
  const [videoSourceVersion, setVideoSourceVersion] = useState({});
  const [videoBlobUrls, setVideoBlobUrls] = useState({});
  const [videoSize, setVideoSize] = useState({ width: '100%', height: '100%' });
  const [isResizing, setIsResizing] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  
  // Efeito para lidar com o redimensionamento
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      
      const newWidth = Math.max(300, startSize.current.width + dx);
      const newHeight = Math.max(169, startSize.current.height + dy);
      
      setVideoSize({
        width: `${newWidth}px`,
        height: `${newHeight}px`
      });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      startPos.current = { x: e.clientX, y: e.clientY };
      startSize.current = { 
        width: rect.width, 
        height: rect.height 
      };
      setIsResizing(true);
    }
  };
  
  // Função para lidar com o carregamento do vídeo
  const handleVideoLoadStart = (videoId) => {
    setVideoLoading(prev => ({ ...prev, [videoId]: true }));
    setVideoError(prev => ({ ...prev, [videoId]: false }));
  };
  
  // Função para lidar com o carregamento completo do vídeo
  const handleVideoLoaded = (videoId) => {
    setVideoLoading(prev => ({ ...prev, [videoId]: false }));
  };
  
  // Função para lidar com erros no carregamento do vídeo
  const handleVideoError = (videoId) => {
    setVideoLoading(prev => ({ ...prev, [videoId]: false }));
    setVideoError(prev => ({ ...prev, [videoId]: true }));
  };

  const getVideoSource = (videoItem) => {
    const resolvedUrl = resolveVideoUrl(videoItem?.videoUrl);
    if (!resolvedUrl) return '';

    const blobUrl = videoBlobUrls[videoItem.id];
    if (blobUrl) {
      return blobUrl;
    }

    if (isProtectedStreamUrl(resolvedUrl)) {
      return '';
    }

    const version = videoSourceVersion[videoItem.id] || 0;
    return resolvedUrl.includes('?')
      ? `${resolvedUrl}&v=${version}`
      : `${resolvedUrl}?v=${version}`;
  };

  const handleVideoElementError = (event, videoItem) => {
    const mediaErrorCode = event?.currentTarget?.error?.code;
    console.error('Error loading video:', {
      id: videoItem?.id,
      filename: videoItem?.filename,
      originalUrl: videoItem?.videoUrl,
      resolvedUrl: resolveVideoUrl(videoItem?.videoUrl),
      mediaErrorCode,
      mediaError: getMediaErrorMessage(mediaErrorCode),
      networkState: event?.currentTarget?.networkState,
      readyState: event?.currentTarget?.readyState
    });

    handleVideoError(videoItem.id);
  };
  // Estados para gerenciar os vídeos selecionados e a interface
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [compareVideoId, setCompareVideoId] = useState('');
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Efeito para sincronizar o vídeo selecionado quando o prop 'video' mudar
  useEffect(() => {
    if (propVideo?.id) {
      setSelectedVideos([propVideo]);
      setTabValue(0);
      setVideoLoading(prev => ({ ...prev, [propVideo.id]: true }));
      setVideoError(prev => ({ ...prev, [propVideo.id]: false }));
    } else {
      setSelectedVideos([]);
      setVideoLoading({});
      setVideoError({});
    }
  }, [propVideo]);

  // Filtra vídeos disponíveis para comparação (exclui os já selecionados)
  useEffect(() => {
    let isCancelled = false;

    const loadProtectedVideos = async () => {
      const token = getAuthToken();
      if (!token || !Array.isArray(selectedVideos) || selectedVideos.length === 0) return;

      for (const videoItem of selectedVideos) {
        if (!videoItem?.id) continue;

        const resolvedUrl = resolveVideoUrl(videoItem.videoUrl);
        if (!isProtectedStreamUrl(resolvedUrl)) continue;

        const version = videoSourceVersion[videoItem.id] || 0;
        const requestUrl = resolvedUrl.includes('?')
          ? `${resolvedUrl}&v=${version}`
          : `${resolvedUrl}?v=${version}`;

        try {
          const response = await axios.get(requestUrl, {
            responseType: 'blob',
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (isCancelled) return;

          const blobUrl = URL.createObjectURL(response.data);
          setVideoBlobUrls(prev => {
            if (prev[videoItem.id]) {
              URL.revokeObjectURL(prev[videoItem.id]);
            }

            return {
              ...prev,
              [videoItem.id]: blobUrl
            };
          });
        } catch (error) {
          if (!isCancelled) {
            console.error('Error fetching protected video stream:', {
              id: videoItem.id,
              url: requestUrl,
              status: error?.response?.status,
              message: error?.message
            });
            handleVideoError(videoItem.id);
          }
        }
      }
    };

    loadProtectedVideos();

    return () => {
      isCancelled = true;
    };
  }, [selectedVideos, videoSourceVersion]);

  useEffect(() => () => {
    Object.values(videoBlobUrls).forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        // no-op
      }
    });
  }, [videoBlobUrls]);

  const availableVideos = Array.isArray(allVideos) 
    ? allVideos.filter(v => v && v.id && !selectedVideos.some(sv => sv && sv.id === v.id))
    : [];

  // Renderiza a análise detalhada para um vídeo
  const renderAnalysis = (video, compareVideo = null) => {
    const analysis = getWaveAnalysis(video.id);
    const compareAnalysis = compareVideo ? getWaveAnalysis(compareVideo.id) : null;
    const overallScore = getOverallScore(video);
    const compareScore = compareVideo ? getOverallScore(compareVideo) : null;
    
    return (
      <Box>
        
        {/* Métricas detalhadas */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: compareVideo ? '1fr 1fr' : '1fr' }, 
          gap: 2 
        }}>
          {Object.entries(analysis).map(([key, value]) => (
            <AnalysisMetric
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              value={value}
              compareValue={compareAnalysis ? compareAnalysis[key] : null}
              isComparison={!!compareAnalysis}
            />
          ))}
        </Box>
        
        <Box mt={3}>
          <Typography variant="subtitle1" gutterBottom>
            Pontuação Geral: <strong>{(getOverallScore(video)).toFixed(1)}/10</strong>
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={getOverallScore(video) * 10} 
            color="primary"
            sx={{ height: 10, borderRadius: 5, mb: 2 }}
          />
        </Box>
        
        <Box mt={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Dicas de Melhoria:
          </Typography>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            {getImprovementTips(video.id).map((tip, index) => (
              <li key={index}>
                <Typography variant="body2">{tip}</Typography>
              </li>
            ))}
          </ul>
        </Box>
      </Box>
    );
  };

  const handleAddComparison = () => {
    if (compareVideoId) {
      const videoToAdd = allVideos.find(v => v.id === compareVideoId);
      if (videoToAdd) {
        setSelectedVideos([...selectedVideos, videoToAdd]);
        setCompareVideoId('');
        setShowCompareDialog(false);
        setTabValue(selectedVideos.length); // Muda para a nova aba
      }
    }
  };

  const handleRemoveVideo = (videoId) => {
    if (selectedVideos.length > 1) {
      setSelectedVideos(selectedVideos.filter(v => v.id !== videoId));
      if (tabValue >= selectedVideos.length - 1) {
        setTabValue(selectedVideos.length - 2);
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };



  // Efeito para fechar o modal ao pressionar a tecla ESC
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Se não estiver aberto, não renderiza nada
  if (!open) {
    return null;
  }

  // Se não houver vídeos selecionados, não renderiza o conteúdo
  if (selectedVideos.length === 0) {
    return null;
  }

  // Estilo para o backdrop do modal
  const backdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1300,
    backdropFilter: 'blur(4px)',
    opacity: 0,
    transition: 'opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    ...(open && {
      opacity: 1,
    })
  };

  // Estilo para o container do modal
  const containerStyle = {
    position: 'relative',
    outline: 0,
    width: '90%',
    maxWidth: '1200px',
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: 'background.paper',
    borderRadius: '12px',
    boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.3), 0px 24px 38px 3px rgba(0,0,0,0.24), 0px 9px 46px 8px rgba(0,0,0,0.22)',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      boxShadow: '0px 11px 20px -7px rgba(0,0,0,0.4)',
    },
    // Usando o sistema de breakpoints do Material-UI
    '@media (maxWidth: 900px)': {
      width: '95%',
      maxHeight: '95vh',
    },
  };

  // Se o modal não estiver aberto, não renderiza nada
  if (!open) return null;

  return (
    <>
      <div style={backdropStyle}>
        <div style={containerStyle}>
          <Paper 
            onClick={(e) => e.stopPropagation()}
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              borderRadius: '8px',
            }}
          >
          <Box 
            sx={{ 
              p: 2, 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'background.default',
              width: '100%'
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <CompareArrowsIcon color="primary" />
              <Typography variant="h6" component="h2">
                Análise de Vídeos
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              {console.log('Debug - allVideos:', allVideos, 'selectedVideos:', selectedVideos)}
              {Array.isArray(allVideos) && allVideos.length > 1 && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<AddIcon />}
                  onClick={() => setShowCompareDialog(true)}
                  disabled={selectedVideos.length >= 2}
                >
                  {selectedVideos.length >= 2 ? 'Máximo de 2 vídeos' : 'Comparar'}
                </Button>
              )}
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {selectedVideos.map((v, index) => (
              <Tab 
                key={v.id}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box display="flex" flexDirection="column" alignItems="flex-start">
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{v.filename}</span>
                        <Chip 
                          label={getOverallScore(v).toFixed(1)}
                          size="small"
                          color={index === 0 ? 'primary' : 'secondary'}
                          sx={{ cursor: 'default' }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
                        {new Date(v.createdAt).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Box>
                    {selectedVideos.length > 1 && (
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveVideo(v.id);
                        }}
                        sx={{ ml: 'auto' }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                }
                sx={{ 
                  minHeight: '48px',
                  textTransform: 'none',
                  textAlign: 'left',
                  alignItems: 'flex-start',
                  py: 1,
                  px: 2
                }}
              />
            ))}
          </Tabs>
        
        <Box sx={{ 
          p: 2, 
          overflowY: 'auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {selectedVideos.map((videoItem, index) => (
            <div key={videoItem.id} style={{ display: tabValue === index ? 'block' : 'none' }}>
              <Grid container spacing={2}>
                {/* Seção de Análise - Agora à esquerda */}
                <Grid item xs={12} md={4} sx={{ order: { xs: 2, md: 1 } }}>
                  <Card>
                    <CardContent sx={{ pt: 1 }}>
                      {selectedVideos.length > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                          <Chip 
                            label={index === 0 ? 'Vídeo 1' : 'Vídeo 2'} 
                            color={index === 0 ? 'primary' : 'secondary'} 
                            size="small"
                          />
                        </Box>
                      )}
                      <Box sx={{ mt: 1 }}>
                        {renderAnalysis(videoItem)}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Seção do Vídeo - Agora à direita */}
                <Grid item xs={12} md={8} sx={{ order: { xs: 1, md: 2 } }}>
                  <Card>
                    <Box 
                      ref={containerRef}
                      sx={{ 
                        position: 'relative', 
                        width: videoSize.width, 
                        height: videoSize.height,
                        minWidth: '300px',
                        minHeight: '169px',
                        maxWidth: '100%',
                        maxHeight: '80vh',
                        margin: '0 auto',
                        cursor: isResizing ? 'nwse-resize' : 'default',
                        transition: isResizing ? 'none' : 'width 0.2s, height 0.2s'
                      }}
                    >
                      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                        {/* Indicador de carregamento */}
                        {videoLoading[videoItem.id] && (
                          <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1
                          }}>
                            <CircularProgress color="primary" />
                          </Box>
                        )}
                        
                        {/* Mensagem de erro */}
                        {videoError[videoItem.id] && (
                          <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            color: 'error.main',
                            zIndex: 1,
                            p: 2,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            borderRadius: 1
                          }}>
                            <Typography variant="body2">
                              Não foi possível carregar o vídeo.
                            </Typography>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              color="inherit"
                              onClick={() => {
                                setVideoError(prev => ({ ...prev, [videoItem.id]: false }));
                                setVideoLoading(prev => ({ ...prev, [videoItem.id]: true }));
                                setVideoSourceVersion(prev => ({
                                  ...prev,
                                  [videoItem.id]: (prev[videoItem.id] || 0) + 1
                                }));
                                setVideoBlobUrls(prev => {
                                  if (prev[videoItem.id]) {
                                    URL.revokeObjectURL(prev[videoItem.id]);
                                  }
                                  const next = { ...prev };
                                  delete next[videoItem.id];
                                  return next;
                                });
                              }}
                              sx={{ mt: 1 }}
                            >
                              Tentar novamente
                            </Button>
                          </Box>
                        )}
                        
                        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                          <Box
                            component="video"
                            ref={videoRef}
                            controls
                            controlsList="nodownload"
                            src={getVideoSource(videoItem)}
                            onLoadStart={() => handleVideoLoadStart(videoItem.id)}
                            onLoadedData={() => handleVideoLoaded(videoItem.id)}
                            onError={(e) => {
                              handleVideoElementError(e, videoItem);
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: '#000',
                              opacity: videoLoading[videoItem.id] ? 0.5 : 1,
                              transition: 'opacity 0.3s ease-in-out',
                              display: videoError[videoItem.id] ? 'none' : 'block',
                              objectFit: 'contain'
                            }}
                          />
                          
                          {/* Indicador de redimensionamento */}
                          <Box 
                            onMouseDown={handleResizeStart}
                            sx={{
                              position: 'absolute',
                              right: 0,
                              bottom: 0,
                              width: '20px',
                              height: '20px',
                              cursor: 'nwse-resize',
                              background: 'linear-gradient(135deg, transparent 50%, #1976d2 50%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, transparent 50%, #1565c0 50%)',
                              }
                            }}
                          />
                        </Box>
                        
                        <Box sx={{
                            '& video': {
                              width: '100%',
                              height: '100%',
                              '&::-webkit-media-controls': {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px',
                                backgroundColor: 'rgba(0,0,0,0.7)'
                              },
                              '&::-webkit-media-controls-panel': {
                                backgroundColor: 'rgba(0,0,0,0.5)'
                              },
                              '&::-webkit-media-controls-play-button': {
                                display: 'flex',
                                flex: 'none',
                                width: '32px',
                                height: '32px',
                                marginRight: '10px'
                              },
                              '&::-webkit-media-controls-timeline': {
                                flex: 1,
                                margin: '0 10px'
                              },
                              '&::-webkit-media-controls-current-time-display, &::-webkit-media-controls-time-remaining-display': {
                                margin: '0 10px',
                                color: '#fff'
                              },
                              '&::-webkit-media-controls-mute-button': {
                                margin: '0 5px'
                              },
                              '&::-webkit-media-controls-volume-slider': {
                                width: '80px',
                                margin: '0 5px'
                              },
                              '&::-webkit-media-controls-fullscreen-button': {
                                marginLeft: '10px'
                              }
                            }
                          }}
                        />
                      </Box>
                    </Box>
                    <CardContent sx={{ pt: 1, pb: '8px !important' }}>
                    </CardContent>
                  </Card>
                </Grid>
                
              </Grid>
            </div>
          ))}
        
          {selectedVideos.length > 1 && (
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Comparação Lado a Lado
              </Typography>
              <Box mb={4}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  justifyContent: 'space-between'
                }}>
                  <Typography variant="h6" component="div">
                    Análise Comparativa
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label="Vídeo 1" 
                      color="primary" 
                      size="small"
                      variant={tabValue === 0 ? 'filled' : 'outlined'}
                      onClick={() => setTabValue(0)}
                      sx={{ cursor: 'pointer' }}
                    />
                    <Chip 
                      label="Vídeo 2" 
                      color="secondary" 
                      size="small"
                      variant={tabValue === 1 ? 'filled' : 'outlined'}
                      onClick={() => setTabValue(1)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>
                </Box>
                {selectedVideos.length >= 2 && renderAnalysis(selectedVideos[0], selectedVideos[1])}
              </Box>
              <Grid container spacing={3}>
                {selectedVideos.map((videoItem, index) => (
                  <Grid item xs={6} key={`compare-${videoItem.id}`}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {videoItem.filename}
                        </Typography>
                        <Box sx={{ position: 'relative', paddingTop: '56.25%', mb: 2 }}>
                          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                            {/* Indicador de carregamento */}
                            {videoLoading[videoItem.id] && (
                              <Box sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 1
                              }}>
                                <CircularProgress color="primary" size={24} />
                              </Box>
                            )}
                            
                            {/* Mensagem de erro */}
                            {videoError[videoItem.id] && (
                              <Box sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center',
                                color: 'error.main',
                                zIndex: 1,
                                p: 2,
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                borderRadius: 1,
                                width: '90%'
                              }}>
                                <Typography variant="caption" display="block" gutterBottom>
                                  Não foi possível carregar o vídeo.
                                </Typography>
                                <Button 
                                  variant="outlined" 
                                  size="small" 
                                  color="inherit"
                                  onClick={() => {
                                    setVideoError(prev => ({ ...prev, [videoItem.id]: false }));
                                    setVideoLoading(prev => ({ ...prev, [videoItem.id]: true }));
                                    setVideoSourceVersion(prev => ({
                                      ...prev,
                                      [videoItem.id]: (prev[videoItem.id] || 0) + 1
                                    }));
                                    setVideoBlobUrls(prev => {
                                      if (prev[videoItem.id]) {
                                        URL.revokeObjectURL(prev[videoItem.id]);
                                      }
                                      const next = { ...prev };
                                      delete next[videoItem.id];
                                      return next;
                                    });
                                  }}
                                  sx={{ mt: 1 }}
                                >
                                  Tentar novamente
                                </Button>
                              </Box>
                            )}
                            
                            <Box
                              component="video"
                              controls
                              src={getVideoSource(videoItem)}
                              onLoadStart={() => handleVideoLoadStart(videoItem.id)}
                              onLoadedData={() => handleVideoLoaded(videoItem.id)}
                              onError={(e) => handleVideoElementError(e, videoItem)}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#000',
                                opacity: videoLoading[videoItem.id] || videoError[videoItem.id] ? 0.5 : 1,
                                transition: 'opacity 0.3s ease-in-out'
                              }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" align="center">
                          {videoItem.filename}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          </Box>
          </Paper>
        </div>
      </div>

      <Dialog open={showCompareDialog} onClose={() => setShowCompareDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Vídeo para Comparação</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="compare-video-label">Selecione um vídeo</InputLabel>
            <Select
              labelId="compare-video-label"
              value={compareVideoId}
              label="Selecione um vídeo"
              onChange={(e) => setCompareVideoId(e.target.value)}
              fullWidth
            >
              {availableVideos.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.filename} ({formatFileSize(v.fileSize)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompareDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleAddComparison}
            variant="contained"
            color="primary"
            disabled={!compareVideoId}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Função auxiliar para gerar dicas de melhoria baseadas no ID do vídeo
const getImprovementTips = (videoId) => {
  const tips = [
    'Mantenha o equilíbrio durante as manobras',
    'Tente pegar ondas mais potentes',
    'Melhore o posicionamento na prancha',
    'Ajuste o timing das suas remadas',
    'Mantenha o olhar na direção que deseja ir',
    'Flexione mais os joelhos para melhor estabilidade',
    'Tente iniciar as manobras mais cedo',
    'Mantenha os braços alinhados com o corpo',
  ];
  
  // Usa o ID do vídeo para gerar dicas consistentes
  const seed = videoId % tips.length;
  const selectedTips = [];
  
  // Seleciona 3 dicas únicas baseadas no ID do vídeo
  for (let i = 0; i < 3; i++) {
    const tipIndex = (seed + i) % tips.length;
    selectedTips.push(tips[tipIndex]);
  }
  
  return selectedTips;
};

export default VideoPlayerModal;
