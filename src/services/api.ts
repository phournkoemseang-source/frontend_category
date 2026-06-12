import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; // Replace with your actual backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const categoryService = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  update: (id: any, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: any) => api.delete(`/categories/${id}`),
};
