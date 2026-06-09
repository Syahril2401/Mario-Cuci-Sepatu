// Removed dbHelper import

export const DAILY_LIMIT = 20;

export const formatOrderId = (order) => {
  if (!order || !order.order_id) return 'ORD-UNKNOWN';
  let datePart = 'YYYYMMDD';
  if (order.created_at || order.createdAt) {
    const d = new Date(order.created_at || order.createdAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    datePart = `${year}${month}${day}`;
  } else {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    datePart = `${year}${month}${day}`;
  }
  const idStr = String(order.order_id).padStart(3, '0');
  return `ORD-${datePart}-${idStr}`;
};

export const STATUS_LABELS = {
  // --- Common ---
  "WAITING_VERIFICATION": "Menunggu Verifikasi Pembayaran",
  "PROCESSING": "Sedang Diproses",
  "FINISHED": "Selesai",
  "CANCELLED": "Dibatalkan",

  // --- Self Drop ---
  "WAITING_DROP_OFF": "Menunggu Pengantaran Barang",
  "STORE_RECEIVED": "Barang Sudah Diterima",

  // --- Pickup by Admin ---
  "WAITING_PICKUP": "Menunggu Pickup",
  "PICKED_UP_BY_ADMIN": "Barang Sudah Diambil Admin",

  // --- Return: Self Pickup ---
  "READY_PICKUP": "Siap Dikirim/Ambil",
  "CUSTOMER_PICKED_UP": "Sudah Dikirim/Diambil",

  // --- Return: Delivery ---
  "READY_DELIVERY": "Siap Dikirim",
  "ON_DELIVERY": "Dalam Perjalanan",
  "RECEIVED": "Sudah Diterima",

  // --- Legacy compatibility ---
  "AWAITING_DROP_OFF": "Menunggu Pengantaran Barang",
  "ANTRI": "Menunggu Pengantaran Barang",
  "PENDING": "Belum Bayar",
  "READY": "Siap",
  "DELIVERED": "Sudah Diterima",
};

export const STATUS_DESCRIPTIONS = {
  "WAITING_VERIFICATION": "Pesanan dibuat. Menunggu verifikasi pembayaran oleh admin.",
  "WAITING_DROP_OFF": "Silakan antar sepatu Anda ke toko kami di Northwest Lake, Babat Jerawat.",
  "STORE_RECEIVED": "Sepatu Anda sudah diterima di toko dan akan segera diproses.",
  "WAITING_PICKUP": "Admin akan segera menjemput sepatu Anda di lokasi yang ditentukan.",
  "PICKED_UP_BY_ADMIN": "Admin sudah menjemput sepatu Anda. Sedang dalam perjalanan ke toko.",
  "PROCESSING": "Sepatu sedang dibersihkan dan dirawat oleh tim profesional kami.",
  "READY_PICKUP": "Sepatu Anda sudah bersih! Silakan datang ke toko untuk mengambilnya.",
  "CUSTOMER_PICKED_UP": "Sepatu sudah diambil.",
  "READY_DELIVERY": "Pesanan sudah selesai dan siap dikirim ke alamat Anda.",
  "ON_DELIVERY": "Kurir sedang menuju lokasi Anda. Harap siap menerima paket.",
  "RECEIVED": "Sepatu telah diterima. Terima kasih sudah menggunakan Mario Cuci Sepatu!",
  "FINISHED": "Pesanan selesai. Terima kasih! Semoga sepatu Anda tampil kinclong! 👟",
  "CANCELLED": "Pesanan ini telah dibatalkan.",
  // legacy
  "AWAITING_DROP_OFF": "Silakan antar sepatu Anda ke toko kami.",
  "ANTRI": "Silakan antar sepatu Anda ke toko kami.",
  "PENDING": "Pesanan dibuat. Menunggu verifikasi pembayaran.",
  "READY": "Pesanan siap.",
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
  const isSelfDrop = order?.pickupMethod === 'SELF_DROP';
  const isSelfPickup = order?.returnMethod === 'SELF_PICKUP';

  if (isSelfDrop && isSelfPickup) {
    // Case A
    return [
      'WAITING_VERIFICATION',
      'WAITING_DROP_OFF',
      'STORE_RECEIVED',
      'PROCESSING',
      'READY_PICKUP',
      'CUSTOMER_PICKED_UP',
      'FINISHED',
    ];
  }

  if (isSelfDrop && !isSelfPickup) {
    // Case B
    return [
      'WAITING_VERIFICATION',
      'WAITING_DROP_OFF',
      'STORE_RECEIVED',
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
      'WAITING_VERIFICATION',
      'WAITING_PICKUP',
      'PICKED_UP_BY_ADMIN',
      'PROCESSING',
      'READY_PICKUP',
      'CUSTOMER_PICKED_UP',
      'FINISHED',
    ];
  }

  // Case D — Pickup + Delivery (default)
  return [
    'WAITING_VERIFICATION',
    'WAITING_PICKUP',
    'PICKED_UP_BY_ADMIN',
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

  // Normalize legacy PENDING to WAITING_VERIFICATION
  const normalizedCurrent = currentStatus === 'PENDING' ? 'WAITING_VERIFICATION' : currentStatus;

  const currentIndex = flow.indexOf(normalizedCurrent);
  const nextIndex = flow.indexOf(targetStatus);

  // Legacy compatibility
  if (currentStatus === 'PENDING PAYMENT' && targetStatus === 'WAITING_DROP_OFF') return true;
  if (currentStatus === 'COMPLETED' && targetStatus === 'FINISHED') return false;

  // Allow transitions only to the next step in the flow
  return nextIndex === currentIndex + 1;
};

export const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return { bg: '#64748B', text: '#FFFFFF', border: '#475569' }; // Solid Slate
    case 'WAITING_VERIFICATION':
    case 'MENUNGGU_VERIFIKASI':
      return { bg: '#F97316', text: '#FFFFFF', border: '#C2410C' }; // Solid Orange
    case 'WAITING_DROP_OFF':
    case 'MENUNGGU_PENGANTARAN':
    case 'AWAITING_DROP_OFF':
    case 'ANTRI':
      return { bg: '#3B82F6', text: '#FFFFFF', border: '#2563EB' }; // Solid Light Blue
    case 'STORE_RECEIVED':
    case 'BARANG_DITERIMA':
      return { bg: '#2563EB', text: '#FFFFFF', border: '#1D4ED8' }; // Solid Blue
    case 'WAITING_PICKUP':
      return { bg: '#EAB308', text: '#FFFFFF', border: '#CA8A04' }; // Solid Yellow
    case 'PICKED_UP_BY_ADMIN':
    case 'BARANG_DIAMBIL':
      return { bg: '#EA580C', text: '#FFFFFF', border: '#9A3412' }; // Solid Orange Dark
    case 'PROCESSING':
      return { bg: '#1D4ED8', text: '#FFFFFF', border: '#1E40AF' }; // Solid Dark Blue
    case 'READY_PICKUP':
    case 'READY':
    case 'DELIVERED':
      return { bg: '#8B5CF6', text: '#FFFFFF', border: '#6D28D9' }; // Solid Purple
    case 'READY_DELIVERY':
      return { bg: '#7C3AED', text: '#FFFFFF', border: '#5B21B6' }; // Solid Violet
    case 'CUSTOMER_PICKED_UP':
    case 'SUDAH_DIAMBIL':
      return { bg: '#22C55E', text: '#FFFFFF', border: '#16A34A' }; // Solid Green
    case 'ON_DELIVERY':
      return { bg: '#4F46E5', text: '#FFFFFF', border: '#3730A3' }; // Solid Indigo
    case 'RECEIVED':
      return { bg: '#16A34A', text: '#FFFFFF', border: '#15803D' }; // Solid Dark Green
    case 'FINISHED':
    case 'COMPLETED':
      return { bg: '#059669', text: '#FFFFFF', border: '#047857' }; // Solid Emerald
    case 'CANCELLED':
      return { bg: '#EF4444', text: '#FFFFFF', border: '#B91C1C' }; // Solid Red
    default:
      return { bg: '#E5E7EB', text: '#374151', border: '#9CA3AF' };
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
