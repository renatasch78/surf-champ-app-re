// Função para gerar um hash estável baseado em uma string
const stringToHash = (str) => {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converte para inteiro de 32 bits
  }
  return Math.abs(hash);
};

// Gera uma análise consistente baseada no ID do vídeo
export const getWaveAnalysis = (videoId) => {
  if (!videoId) {
    return {
      velocidade: 0,
      altura: 0,
      potência: 0,
      fluidez: 0,
      técnica: 0,
    };
  }

  // Usa partes diferentes do hash para cada métrica para garantir consistência
  const metrics = ['velocidade', 'altura', 'potência', 'fluidez', 'técnica'];
  const analysis = {};
  
  metrics.forEach((metric) => {
    // Usa uma parte diferente do hash para cada métrica
    const metricHash = stringToHash(videoId.toString() + metric);
    // Gera um valor entre 4.0 e 10.0 para cada métrica
    analysis[metric] = 4 + (metricHash % 61) / 10; // Valores entre 4.0 e 10.0
  });
  
  return analysis;
};

// Calcula a pontuação geral baseada na análise
export const getOverallScore = (video) => {
  if (!video) return 0;
  
  // Se o vídeo já tiver uma pontuação calculada, use-a
  if (video.score !== undefined && video.score !== null) {
    return parseFloat(video.score.toFixed(1));
  }
  
  // Caso contrário, calcule com base na análise
  const analysis = getWaveAnalysis(video.id);
  const score = Object.values(analysis).reduce((a, b) => a + b, 0) / Object.keys(analysis).length;
  return parseFloat(score.toFixed(1));
};
