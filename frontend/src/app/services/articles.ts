import api from './api'

export const getArticles = () => api.get('/articles')
export const getArticleById = (id: string) => api.get(`/articles/${id}`)
export const createArticle = (data: object) => api.post('/articles', data)
export const updateArticle = (id: string, data: object) => api.put(`/articles/${id}`, data)
export const deleteArticle = (id: string) => api.delete(`/articles/${id}`)
