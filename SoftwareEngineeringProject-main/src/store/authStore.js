import { create } from 'zustand';

// Retrieve initial state from localStorage if available
const getSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};
const savedUser = getSavedUser();
const savedToken = localStorage.getItem('token');

const useAuthStore = create((set) => ({
  user: savedUser || null,
  token: savedToken && savedToken !== 'undefined' && savedToken !== 'null' ? savedToken : null,
  isAuthenticated: !!(savedToken && savedToken !== 'undefined' && savedToken !== 'null'),
  login: (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    set({ user: userData, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
