// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
    //baseURL: 'http://localhost:8001/api', // Puerto configurado en el backend
    baseURL: '/vasodelahistoria/api/api',
});

// Interceptor para añadir el token JWT a todas las peticiones
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('amstel_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
