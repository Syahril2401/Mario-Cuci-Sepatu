import api from './api';

export const promoService = {
  getPromos: async () => {
    try {
      const response = await api.get('/promos');
      return response.data;
    } catch (error) {
      return { data: [] };
    }
  },
  
  addPromo: async (promo) => {
    try {
      const response = await api.post('/promos', promo);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updatePromo: async (id, data) => {
    try {
      const response = await api.put(`/promos/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  deletePromo: async (id) => {
    try {
      const response = await api.delete(`/promos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Helper to check if a service has an active promo
  getActivePromoForService: (service, promos) => {
    if (!promos) promos = [];
    const now = new Date();

    // Filter active promos that match current date
    const activePromos = promos.filter(p => {
      const start = new Date(p.startDate);
      // Include the entire end day (set to 23:59:59)
      const end   = new Date(p.endDate);
      end.setHours(23, 59, 59, 999);
      return p.status === 'active' && now >= start && now <= end;
    });

    // Normalize service type to lowercase for comparison
    const svcType = (service.type || '').toLowerCase();

    // 1. Check specific service promo first (highest priority)
    const servicePromo = activePromos.find(p =>
      p.targetType === 'service' &&
      String(p.targetId) === String(service.service_id || service.id)
    );
    if (servicePromo) return servicePromo;

    // 2. Check category promo — case-insensitive
    const categoryPromo = activePromos.find(p =>
      p.targetType === 'category' &&
      (p.categories || []).some(cat => cat.toLowerCase() === svcType)
    );
    if (categoryPromo) return categoryPromo;

    // 3. Check "all services" promo (lowest priority)
    const allPromo = activePromos.find(p => p.targetType === 'all');
    return allPromo || null;
  },


  calculateDiscountedPrice: (price, promo) => {
    if (!promo) return price;
    const discount = (price * promo.percentage) / 100;
    return price - discount;
  }
};
