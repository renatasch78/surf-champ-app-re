import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuthToken, setAuthToken as setToken } from '../config';
import axios from 'axios';
import { API_ENDPOINTS } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (token) => {
    try {
      // Verifica se o token existe e é válido
      if (!token) {
        console.error('Nenhum token fornecido para buscar dados do usuário');
        return null;
      }
      
      // Decodifica o token para obter as informações básicas
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        console.error('Formato de token inválido');
        return null;
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // Retorna as informações do usuário do token
      return { 
        username: payload.sub || 'usuario',
        role: payload.role || payload.roles || 'SURFER',
        exp: payload.exp * 1000 // Converte para milissegundos
      };
    } catch (error) {
      console.error('Erro ao processar token:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAuthToken();
        console.log('Token encontrado no localStorage:', token ? 'Sim' : 'Não');
        
        if (token) {
          const userData = await fetchUserData(token);
          
          if (userData) {
            // Verifica se o token está expirado
            if (userData.exp && userData.exp < Date.now()) {
              console.log('Token expirado durante a inicialização');
              logout();
            } else {
              console.log('Usuário autenticado:', userData.username);
              setCurrentUser({ token, ...userData });
            }
          } else {
            console.log('Token inválido');
            logout();
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    // Configura o interceptor do axios para adicionar o token
    const setupAxiosInterceptors = () => {
      axios.interceptors.request.use(
        (config) => {
          const token = getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            logout();
          }
          return Promise.reject(error);
        }
      );
    };

    setupAxiosInterceptors();
    initializeAuth();
  }, []);

  const login = async (token) => {
    if (!token) {
      console.error('Nenhum token fornecido para login');
      return false;
    }
    
    try {
      // Valida o token antes de fazer login
      const userData = await fetchUserData(token);
      if (!userData) {
        console.error('Falha ao validar token');
        return false;
      }
      
      // Verifica se o token está expirado
      if (userData.exp && userData.exp < Date.now()) {
        console.error('Token expirado');
        logout();
        return false;
      }
      
      // Se chegou até aqui, o token é válido
      setToken(token);
      setCurrentUser({ token, ...userData });
      return true;
    } catch (error) {
      console.error('Erro durante o login:', error);
      logout();
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
