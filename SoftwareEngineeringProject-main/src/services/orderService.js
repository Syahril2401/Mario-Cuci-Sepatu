// Removed dbHelper import

export const DAILY_LIMIT = 20;

export const STATUS_LABELS = {
  // --- Common ---
  "MENUNGGU_VERIFIKASI": "Menunggu Verifikasi Pembayaran",
  "PROCESSING":          "Sedang Diproses",
  "FINISHED":            "Selesai",
  "CANCELLED":           "Dibatalkan",

  // --- Self Drop ---
  "MENUNGGU_PENGANTARAN": "Menunggu Pengantaran Barang",
  "BARANG_DITERIMA":      "Barang Sudah Diterima",

  // --- Pickup by Admin ---
  "WAITING_PICKUP":   "Menunggu Pickup",
  "BARANG_DIAMBIL":   "Barang Sudah Diambil Admin",

  // --- Return: Self Pickup ---
  "READY_PICKUP":  "Siap Diambil",
  "SUDAH_DIAMBIL": "Sudah Diambil",

  // --- Return: Delivery ---
  "READY_DELIVERY": "Siap Dikirim",
  "ON_DELIVERY":    "Dalam Perjalanan",
  "RECEIVED":       "Sudah Diterima",

  // --- Legacy compatibility ---
  "ANTRI":    "Menunggu Pengantaran Barang",
  "PENDING":  "Belum Bayar",
  "READY":    "Siap",
  "DELIVERED": "Sudah Diterima",
};

export const STATUS_DESCRIPTIONS = {
  "MENUNGGU_VERIFIKASI":  "Pesanan dibuat. Menunggu verifikasi pembayaran oleh admin.",
  "MENUNGGU_PENGANTARAN": "Silakan antar sepatu Anda ke toko kami di Northwest Lake, Babat Jerawat.",
  "BARANG_DITERIMA":      "Sepatu Anda sudah diterima di toko dan akan segera diproses.",
  "WAITING_PICKUP":       "Admin akan segera menjemput sepatu Anda di lokasi yang ditentukan.",
  "BARANG_DIAMBIL":       "Admin sudah menjemput sepatu Anda. Sedang dalam perjalanan ke toko.",
  "PROCESSING":           "Sepatu sedang dibersihkan dan dirawat oleh tim profesional kami.",
  "READY_PICKUP":         "Sepatu Anda sudah bersih! Silakan datang ke toko untuk mengambilnya.",
  "SUDAH_DIAMBIL":        "Sepatu sudah diambil. Pesanan selesai!",
  "READY_DELIVERY":       "Pesanan sudah selesai dan siap dikirim ke alamat Anda.",
  "ON_DELIVERY":          "Kurir sedang menuju lokasi Anda. Harap siap menerima paket.",
  "RECEIVED":             "Sepatu telah diterima. Terima kasih sudah menggunakan Mario Cuci Sepatu!",
  "FINISHED":             "Pesanan selesai. Terima kasih! Semoga sepatu Anda tampil kinclong! 👟",
  "CANCELLED":            "Pesanan ini telah dibatalkan.",
  // legacy
  "ANTRI":    "Silakan antar sepatu Anda ke toko kami.",
  "PENDING":  "Pesanan dibuat. Menunggu verifikasi pembayaran.",
  "READY":    "Pesanan siap.",
};

/**
 * Returns the correct status flow array based on pickup & return method.
 *
 * Case A — Self Drop + Self Pickup
 * Case B — Self Drop + Delivery
 * Case C — Pickup   + Self Pickup
 * Case D — Pickup   + Delivery
 */
export const getStatusFlow = (order) => {
  const isSelfDrop    = order?.pickupMethod === 'SELF_DROP';
  const isSelfPickup  = order?.returnMethod === 'SELF_PICKUP';

  if (isSelfDrop && isSelfPickup) {
    // Case A
    return [
      'MENUNGGU_VERIFIKASI',
      'MENUNGGU_PENGANTARAN',
      'BARANG_DITERIMA',
      'PROCESSING',
      'READY_PICKUP',
      'SUDAH_DIAMBIL',
      'FINISHED',
    ];
  }

  if (isSelfDrop && !isSelfPickup) {
    // Case B
    return [
      'MENUNGGU_VERIFIKASI',
      'MENUNGGU_PENGANTARAN',
      'BARANG_DITERIMA',
      'PROCESSING',
      'READY_DELIVERY',
      'ON_DELIVERY',
      'RECEIVED',
      'FINISHED',
    ];
  }

  if (!isSelfDrop && isSelfPickup) {
    // Case C
    return [
      'MENUNGGU_VERIFIKASI',
      'WAITING_PICKUP',
      'BARANG_DIAMBIL',
      'PROCESSING',
      'READY_PICKUP',
      'SUDAH_DIAMBIL',
      'FINISHED',
    ];
  }

  // Case D — Pickup + Delivery (default)
  return [
    'MENUNGGU_VERIFIKASI',
    'WAITING_PICKUP',
    'BARANG_DIAMBIL',
    'PROCESSING',
    'READY_DELIVERY',
    'ON_DELIVERY',
    'RECEIVED',
    'FINISHED',
  ];
};

export const canUpdateStatus = (order, nextStatus) => {
  if (!order) return false;

  const flow = getStatusFlow(order);
  const currentStatus = order.status.toUpperCase();
  const targetStatus = nextStatus.toUpperCase();

  // Normalize legacy PENDING to MENUNGGU_VERIFIKASI
  const normalizedCurrent = currentStatus === 'PENDING' ? 'MENUNGGU_VERIFIKASI' : currentStatus;

  const currentIndex = flow.indexOf(normalizedCurrent);
  const nextIndex    = flow.indexOf(targetStatus);

  // Legacy compatibility
  if (currentStatus === 'PENDING PAYMENT' && targetStatus === 'MENUNGGU_PENGANTARAN') return true;
  if (currentStatus === 'COMPLETED' && targetStatus === 'FINISHED') return false;

  // Allow transitions only to the next step in the flow
  return nextIndex === currentIndex + 1;
};

export const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' }; // Slate

    case 'MENUNGGU_VERIFIKASI':
      return { bg: '#FFF7ED', text: '#EA580C', border: '#FFEDD5' }; // Orange

    case 'MENUNGGU_PENGANTARAN':
    case 'ANTRI':
      return { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' }; // Slate

    case 'BARANG_DITERIMA':
      return { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' }; // Blue light

    case 'WAITING_PICKUP':
      return { bg: '#FFFBEB', text: '#D97706', border: '#FEF3C7' }; // Amber

    case 'BARANG_DIAMBIL':
      return { bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5' }; // Orange dark

    case 'PROCESSING':
      return { bg: '#EFF6FF', text: '#2563EB', border: '#DBEAFE' }; // Blue

    case 'READY_PICKUP':
    case 'READY':
    case 'DELIVERED':
      return { bg: '#FAF5FF', text: '#7C3AED', border: '#F3E8FF' }; // Purple

    case 'READY_DELIVERY':
      return { bg: '#F5F3FF', text: '#6D28D9', border: '#EDE9FE' }; // Violet

    case 'SUDAH_DIAMBIL':
      return { bg: '#F0FDF4', text: '#15803D', border: '#DCFCE7' }; // Green light

    case 'ON_DELIVERY':
      return { bg: '#EEF2FF', text: '#4F46E5', border: '#E0E7FF' }; // Indigo

    case 'RECEIVED':
      return { bg: '#F0FDF4', text: '#16A34A', border: '#DCFCE7' }; // Green

    case 'FINISHED':
    case 'COMPLETED':
      return { bg: '#ECFDF5', text: '#065F46', border: '#D1FAE5' }; // Dark Green

    case 'CANCELLED':
      return { bg: '#FEF2F2', text: '#EF4444', border: '#FEE2E2' }; // Red

    default:
      return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
  }
};


import api from './api';

export const orderService = {
  getHistory: async () => {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      return { data: [] };
    }
  },
  getActiveStatus: async () => {
    try {
      const response = await api.get('/orders/active');
      return response.data;
    } catch (error) {
      return { data: [] };
    }
  },
  getServiceTypes: async (serviceId) => {
    try {
      const response = await api.get('/services');
      return response.data;
    } catch (error) {
      return { data: [] };
    }
  },
  getOrderById: async (order_id) => {
    try {
      const response = await api.get(`/orders/${order_id}`);
      return response.data;
    } catch (error) {
      return { data: null };
    }
  },
  updateOrder: async (updatedOrder) => {
    try {
      const response = await api.put(`/orders/${updatedOrder.order_id}`, updatedOrder);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getDailyStats: async (date) => {
    try {
      const response = await api.get(`/orders/stats?date=${date}`);
      return response.data.data;
    } catch (error) {
      return { count: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT, isFull: false };
    }
  },
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteOrder: async (order_id) => {
    try {
      const response = await api.delete(`/orders/${order_id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
