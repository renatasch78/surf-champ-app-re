import React, { useState, useEffect } from 'react';
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
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { formatFileSize } from '../../utils/format';

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
  // Estados para controle de carregamento e erros dos vídeos
  const [videoLoading, setVideoLoading] = useState({});
  const [videoError, setVideoError] = useState({});
  
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
  const availableVideos = Array.isArray(allVideos) 
    ? allVideos.filter(v => v && v.id && !selectedVideos.some(sv => sv && sv.id === v.id))
    : [];

  // Dados de exemplo para análise da onda
  const getWaveAnalysis = (videoId) => {
    // Gera dados consistentes baseados no ID do vídeo para fins de demonstração
    const baseScore = (videoId % 10) + 5; // Entre 5 e 14
    return {
      speed: (baseScore + 0.2) % 10,
      height: (baseScore + 0.4) % 10,
      power: (baseScore + 0.6) % 10,
      flow: (baseScore + 0.8) % 10,
      technique: (baseScore + 1.0) % 10,
    };
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

  const getOverallScore = (video) => {
    const analysis = getWaveAnalysis(video.id);
    return Object.values(analysis).reduce((a, b) => a + b, 0) / Object.keys(analysis).length;
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
    '@media (max-width: 900px)': {
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
              {selectedVideos.length < allVideos.length && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<AddIcon />}
                  onClick={() => setShowCompareDialog(true)}
                >
                  Comparar
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
                    <span>{v.filename}</span>
                    {selectedVideos.length > 1 && (
                      <Chip 
                        label={getOverallScore(v).toFixed(1)}
                        size="small"
                        color={index === 0 ? 'primary' : 'secondary'}
                        onDelete={selectedVideos.length > 1 ? () => handleRemoveVideo(v.id) : undefined}
                      />
                    )}
                  </Box>
                }
                sx={{ minHeight: '48px' }}
              />
            ))}
          </Tabs>
        
        <Box sx={{ 
          p: 3, 
          overflowY: 'auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {selectedVideos.map((videoItem, index) => (
            <div key={videoItem.id} style={{ display: tabValue === index ? 'block' : 'none' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Card>
                    <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
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
                          src={videoItem.videoUrl || '#'}
                          onLoadStart={() => handleVideoLoadStart(videoItem.id)}
                          onLoadedData={() => handleVideoLoaded(videoItem.id)}
                          onError={() => handleVideoError(videoItem.id)}
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
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Enviado em: {new Date(videoItem.createdAt).toLocaleDateString('pt-BR')}
                        </Typography>
                        <Chip 
                          label={`${getOverallScore(videoItem).toFixed(1)}/10`} 
                          color={index === 0 ? 'primary' : 'secondary'} 
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Tamanho: {formatFileSize(videoItem.fileSize)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={5}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" component="div">
                          Análise da Onda
                        </Typography>
                        {selectedVideos.length > 1 && (
                          <Chip 
                            label={index === 0 ? 'Vídeo 1' : 'Vídeo 2'} 
                            color={index === 0 ? 'primary' : 'secondary'} 
                            size="small" 
                            sx={{ ml: 1, mb: 0.5 }}
                          />
                        )}
                      </Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Dicas de Melhoria
                      </Typography>
                      <Box component="ul" sx={{ pl: 2, mt: 1, '& li': { mb: 1 } }}>
                        {getImprovementTips(videoItem.id).map((tip, i) => (
                          <li key={i}>
                            <Typography variant="body2">{tip}</Typography>
                          </li>
                        ))}
                      </Box>
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
              <Grid container spacing={3}>
                {selectedVideos.map((videoItem, index) => (
                  <Grid item xs={6} key={`compare-${videoItem.id}`}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {videoItem.filename}
                          <Chip 
                            label={`${getOverallScore(videoItem).toFixed(1)}/10`} 
                            color={index === 0 ? 'primary' : 'secondary'} 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
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
                                  }}
                                  sx={{ mt: 1 }}
                                >
                                  Tentar novamente
                                </Button>
                              </Box>
                            )}
                            
                            <Box
                              component="video"
                              src={videoItem.videoUrl || '#'}
                              onLoadStart={() => handleVideoLoadStart(videoItem.id)}
                              onLoadedData={() => handleVideoLoaded(videoItem.id)}
                              onError={() => handleVideoError(videoItem.id)}
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

      {/* Diálogo para adicionar vídeo para comparação */}
      <Dialog 
        open={showCompareDialog} 
        onClose={() => setShowCompareDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adicionar Vídeo para Comparação</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="compare-video-select-label">Selecione um vídeo</InputLabel>
            <Select
              labelId="compare-video-select-label"
              id="compare-video-select"
              value={compareVideoId}
              label="Selecione um vídeo"
              onChange={(e) => setCompareVideoId(e.target.value)}
            >
              {availableVideos.map((video) => (
                <MenuItem key={video.id} value={video.id}>
                  {video.filename}
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
  // Dicas de exemplo baseadas no ID do vídeo
  const tips = [
    "Mantenha os joelhos flexionados para melhor equilíbrio",
    "Tente manter o peso mais distribuído sobre os pés",
    "Olhe sempre para frente, não para baixo",
    "Mantenha os braços estendidos para ajudar no equilíbrio",
    "Tente antecipar os movimentos da prancha"
  ];
  
  // Retorna as dicas baseadas no ID do vídeo para consistência
  const tipIndex = videoId % tips.length;
  return [
    tips[tipIndex],
    tips[(tipIndex + 1) % tips.length],
    tips[(tipIndex + 2) % tips.length]
  ];
};

export default VideoPlayerModal;
