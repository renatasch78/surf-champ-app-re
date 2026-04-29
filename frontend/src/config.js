// URL base da API, configurável via REACT_APP_API_BASE_URL em desenvolvimento.
// O frontend é agnóstico quanto ao banco de dados; ele apenas consome a API REST definida no backend.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  UPLOAD_VIDEO: `${API_BASE_URL}/api/videos/upload`,
  RECENT_VIDEOS: `${API_BASE_URL}/api/videos/recent`,
  VIDEOS: `${API_BASE_URL}/api/videos`,
  VIDEO_STREAM: `${API_BASE_URL}/api/videos/stream`,
  SURFERS: `${API_BASE_URL}/api/surfers`,
  USER_PROFILE: `${API_BASE_URL}/api/users/me`
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};
