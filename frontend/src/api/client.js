import axios from 'axios';

// در Local: با خالی گذاشتن VITE_API_URL، از Vite Proxy استفاده می‌شود (/api -> localhost:4000)
// در Render: مقدار VITE_API_URL را روی آدرس واقعی بک‌اند تنظیم کنید، مثلاً:
// https://ferno-back.onrender.com/api
const baseURL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ferno_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('ferno_token');
      localStorage.removeItem('ferno_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default client;