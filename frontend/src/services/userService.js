import axios from 'axios';
import { API_ENDPOINTS } from '../config';
import { getAuthToken } from '../utils/auth';

const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`
  }
});

export const userService = {
  getProfile: async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.USER_PROFILE, getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw error;
    }
  },

  updateProfile: async (profile) => {
    try {
      const response = await axios.put(API_ENDPOINTS.USER_PROFILE, profile, getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar perfil do usuário:', error);
      throw error;
    }
  }
};

export default userService;
