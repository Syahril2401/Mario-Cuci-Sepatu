

export const paymentService = {
  processPayment: async (paymentData) => {
    // return api.post('/payment/process', paymentData);
    return { data: { success: true, message: 'Payment simulated successfully' } };
  }
};
