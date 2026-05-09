import api from './api';

export const serviceService = {
  getServicesList: async () => {
    try {
      const response = await api.get('/services');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  addService: async (service) => {
    try {
      const response = await api.post('/services', service);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateService: async (id, data) => {
    try {
      const response = await api.put(`/services/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteService: async (id) => {
    try {
      const response = await api.delete(`/services/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
