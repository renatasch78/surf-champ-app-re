/**
 * Creates a video thumbnail from a video URL
 * @param {string} videoUrl - URL of the video
 * @param {number} [timeInSeconds=1] - Time in seconds to capture the thumbnail from
 * @returns {Promise<string>} - Data URL of the thumbnail
 */
export const createVideoThumbnail = (videoUrl, timeInSeconds = 1) => {
  return new Promise((resolve) => {
    console.log('[Thumbnail] Iniciando geração de miniatura para URL:', videoUrl);
    
    // Verifica se a URL do vídeo é válida
    if (!videoUrl) {
      console.warn('[Thumbnail] URL do vídeo não fornecida');
      return resolve(createPlaceholderThumbnail('URL não fornecida'));
    }
    
    // Tenta criar uma URL absoluta se for um caminho relativo
    let finalUrl = videoUrl;
    if (videoUrl.startsWith('/')) {
      finalUrl = `${window.location.origin}${videoUrl}`;
      console.log(`[Thumbnail] Convertendo URL relativa para absoluta: ${finalUrl}`);
    }
    
    const video = document.createElement('video');
    video.setAttribute('crossorigin', 'anonymous');
    video.preload = 'metadata';
    
    const cleanup = () => {
      console.log('[Thumbnail] Limpando recursos do vídeo');
      video.pause();
      video.removeAttribute('src');
      video.load(); // Limpa o buffer
    };
    
    const onError = (error) => {
      console.error('[Thumbnail] Erro ao carregar vídeo:', {
        error,
        videoUrl: finalUrl,
        readyState: video.readyState,
        errorState: video.error
      });
      cleanup();
      resolve(createPlaceholderThumbnail('Erro ao carregar vídeo'));
    };
    
    const onLoadedMetadata = () => {
      try {
        console.log('Metadados do vídeo carregados:', {
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState
        });
        
        if (video.duration === Infinity || isNaN(video.duration)) {
          console.warn('Duração do vídeo inválida, usando tempo padrão');
          video.currentTime = Math.min(timeInSeconds, 10);
        } else {
          video.currentTime = Math.min(timeInSeconds, video.duration);
        }
      } catch (err) {
        console.error('Erro ao definir currentTime:', err);
        onError(err);
      }
    };
    
    const onSeeked = () => {
      try {
        console.log('Vídeo buscado, capturando frame...');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Define um tamanho máximo para a miniatura
        const maxWidth = 320;
        const maxHeight = 180;
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        // Mantém a proporção
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenha o frame do vídeo no canvas
        ctx.drawImage(video, 0, 0, width, height);
        
        // Converte para data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        console.log('Miniatura gerada com sucesso');
        cleanup();
        resolve(dataUrl);
      } catch (error) {
        console.error('Erro ao criar miniatura:', error);
        onError(error);
      }
    };
    
    // Configura os event listeners
    video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });
    
    // Define um timeout para evitar que a promessa fique pendente
    const timeout = setTimeout(() => {
      console.warn('Timeout ao carregar vídeo para miniatura');
      cleanup();
      resolve(createPlaceholderThumbnail());
    }, 10000); // 10 segundos de timeout

    // Configura a fonte do vídeo
    try {
      // Adiciona um parâmetro de cache para evitar problemas com cache do navegador
      const urlWithCache = videoUrl.includes('?') 
        ? `${videoUrl}&t=${Date.now()}` 
        : `${videoUrl}?t=${Date.now()}`;
      
      video.src = urlWithCache;
      video.load();
    } catch (error) {
      console.error('Erro ao configurar a fonte do vídeo:', error);
      clearTimeout(timeout);
      onError(error);
    }
  });
};
/**
 * Creates a placeholder thumbnail with a play icon
 * @returns {string} - Data URL of the placeholder thumbnail
 */
export const createPlaceholderThumbnail = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw play icon
  const size = Math.min(canvas.width, canvas.height) * 0.3;
  const x = (canvas.width - size) / 2;
  const y = (canvas.height - size) / 2;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw play triangle
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(x + size * 0.35, y + size * 0.25);
  ctx.lineTo(x + size * 0.35, y + size * 0.75);
  ctx.lineTo(x + size * 0.8, y + size * 0.5);
  ctx.closePath();
  ctx.fill();
  
  return canvas.toDataURL('image/png');
};
