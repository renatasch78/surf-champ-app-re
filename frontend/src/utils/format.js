export const formatFileSize = (bytes) => {
  // Handle undefined, null, or non-numeric values
  if (bytes === undefined || bytes === null || isNaN(Number(bytes))) {
    return '-';  // or return '0 Bytes' if you prefer
  }
  
  bytes = Number(bytes);
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[Math.min(i, sizes.length - 1)];
};

export const formatDate = (dateValue) => {
  // Se for um objeto com a propriedade 'epochSecond' (Instant do Java)
  if (dateValue && typeof dateValue === 'object' && 'epochSecond' in dateValue) {
    // Converte segundos para milissegundos
    const date = new Date(dateValue.epochSecond * 1000);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Se for uma string de data ISO
  if (typeof dateValue === 'string' || dateValue instanceof String) {
    return new Date(dateValue).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Se for um timestamp numérico
  if (typeof dateValue === 'number') {
    return new Date(dateValue).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return 'Data inválida';
};
