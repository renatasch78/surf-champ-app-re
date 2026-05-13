import axios from 'axios';
import { API_ENDPOINTS } from '../config';
import { getAuthToken } from '../utils/auth';

const getAuthHeader = () => ({
  headers: {
    'Authorization': `Bearer ${getAuthToken()}`
  }
});

export const videoService = {
  getRecentVideos: async () => {
    try {
      // Tenta buscar os vídeos da API
      console.log('[VideoService] Buscando vídeos recentes para o usuário autenticado');
      const response = await axios.get(API_ENDPOINTS.RECENT_VIDEOS, {
        ...getAuthHeader()
      });
      
      // Verifica se a resposta é um array
      if (!Array.isArray(response.data)) {
        console.error('[VideoService] A resposta da API não é um array:', response.data);
        throw new Error('Resposta da API inválida: esperado um array de vídeos');
      }
      
      // Adiciona a URL do vídeo para cada item retornado
      const videosWithUrl = response.data.map((video, index) => {
        // Log detalhado do vídeo
        console.log(`[VideoService] Processando vídeo ${index + 1}/${response.data.length}:`, {
          id: video.id,
          filename: video.filename,
          filePath: video.filePath,
          videoUrl: video.videoUrl,
          todasAsPropriedades: Object.keys(video).join(', ')
        });
        
        // Constrói a URL do vídeo com base no ID
        // Se tiver videoUrl, usa, senão constrói a URL baseada no ID
        const videoUrl = video.videoUrl || `${API_ENDPOINTS.VIDEO_STREAM}/${video.id}`;
        
        // Log da URL construída
        console.log(`[VideoService] URL final do vídeo ${video.id}:`, videoUrl);
        
        // Cria um novo objeto com a URL do vídeo garantida
        return {
          ...video,
          videoUrl: videoUrl
        };
      });
      
      console.log('[VideoService] Resposta da API:', {
        status: response.status,
        data: videosWithUrl,
        hasVideoUrl: true
      });
      
      return videosWithUrl;
    } catch (error) {
      console.error('Erro ao carregar vídeos recentes da API:', error);
      throw error;
    }
  },

  uploadVideo: async (formData) => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.UPLOAD_VIDEO,
        formData,
        {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  },

  deleteVideo: async (videoId) => {
    try {
      const response = await axios.delete(
        `${API_ENDPOINTS.VIDEOS}/${videoId}`,
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }
};

export default videoService;
