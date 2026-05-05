import axios from 'axios';
import { API_ENDPOINTS } from '../config';

const API_ENDPOINT = API_ENDPOINTS.SURFERS;

const surferService = {
  async getAll() {
    try {
      const response = await axios.get(API_ENDPOINT);
      return response.data;
    } catch (error) {
      console.error('Error fetching surfers:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await axios.get(`${API_ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching surfer with id ${id}:`, error);
      throw error;
    }
  },

  async create(surferData) {
    try {
      console.log('[DEBUG] Dados recebidos para criação:', JSON.stringify(surferData, null, 2));
      
      // Criar um objeto limpo com apenas os campos necessários
      const cleanData = {
        name: surferData.name,
        email: surferData.email,
        password: surferData.password,
        phoneNumber: surferData.phoneNumber?.replace(/\D/g, ''),
        cpf: surferData.cpf?.replace(/\D/g, ''),
        level: surferData.level,
        height: surferData.height ? parseInt(surferData.height) : null,
        weight: surferData.weight ? parseFloat(surferData.weight) : null,
        stance: surferData.stance,
        birthDate: surferData.birthDate, // Já está no formato dd/MM/yyyy
        address: surferData.address ? {
          street: surferData.address.street,
          number: surferData.address.number,
          complement: surferData.address.complement,
          neighborhood: surferData.address.neighborhood,
          city: surferData.address.city,
          state: surferData.address.state,
          zipCode: surferData.address.zipCode?.replace(/\D/g, '')
        } : null,
        emergencyContact: surferData.emergencyContact?.name ? {
          name: surferData.emergencyContact.name,
          phone: surferData.emergencyContact.phone?.replace(/\D/g, ''),
          relationship: surferData.emergencyContact.relationship
        } : null,
        sponsors: surferData.sponsors || []
      };
      
      // Remover campos undefined
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
          delete cleanData[key];
        }
      });

      // Remover campos undefined
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
          delete cleanData[key];
        }
      });

      console.log('[DEBUG] Dados formatados para envio:', JSON.stringify(cleanData, null, 2));
      
      const response = await axios.post(API_ENDPOINT, cleanData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating surfer:', error);
      if (error.response) {
        // A requisição foi feita e o servidor respondeu com um status de erro
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        // Adiciona a mensagem de erro da API à exceção, se disponível
        if (error.response.data) {
          error.message = error.response.data.message || error.response.data.error || error.message;
        }
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        console.error('No response received:', error.request);
      } else {
        // Algo aconteceu na configuração da requisição que causou um erro
        console.error('Request setup error:', error.message);
      }
      throw error;
    }
  },

  async update(id, surferData) {
    try {
      const response = await axios.put(`${API_ENDPOINT}/${id}`, surferData);
      return response.data;
    } catch (error) {
      console.error(`Error updating surfer with id ${id}:`, error);
      throw error;
    }
  },

  async delete(id) {
    try {
      await axios.delete(`${API_ENDPOINT}/${id}`);
      return id;
    } catch (error) {
      console.error(`Error deleting surfer with id ${id}:`, error);
      throw error;
    }
  },

  // Métodos adicionais específicos para surfistas
  async getByLevel(level) {
    try {
      const response = await axios.get(`${API_ENDPOINT}/level/${level}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching surfers with level ${level}:`, error);
      throw error;
    }
  },

  async search(query) {
    try {
      const response = await axios.get(`${API_ENDPOINT}/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching surfers:', error);
      throw error;
    }
  }
};

export default surferService;
