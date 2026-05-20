import axios from 'axios';

const API_URL = 'http://localhost:5000/api/landing';

export const landingService = {
  getLandingConfig: async () => {
    return await axios.get(API_URL);
  },
  updateLandingConfig: async (data) => {
    // Requires admin token
    const token = localStorage.getItem('token');
    return await axios.put(API_URL, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
};
