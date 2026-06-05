import api from './api';

export const userService = {
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateProfile: async (data) => {
    try {
      const response = await api.put('/users/profile', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updatePassword: async (data) => {
    try {
      const response = await api.put('/users/password', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
