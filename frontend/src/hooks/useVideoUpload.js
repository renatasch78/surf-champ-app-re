import { useState } from 'react';
import { videoService } from '../services/videoService';
import { toast } from 'react-toastify';

export const useVideoUpload = (onSuccess) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const upload = async (file, surferName) => {
    if (!file || !surferName?.trim()) {
      throw new Error('Arquivo e nome do surfista são obrigatórios');
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('surferName', surferName.trim());

    try {
      await videoService.uploadVideo(formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        },
      });
      
      toast.success('✅ Vídeo enviado com sucesso!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      onSuccess?.();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao enviar o vídeo';
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, progress, error };
};
