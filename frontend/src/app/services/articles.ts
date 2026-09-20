import api from './api'
import type { Article } from '../types'

export interface BackendArticle {
  id: string
  title: string
  slug: string
  summary: string | null
  content: string
  state: string | null
  published: boolean
  authorId: string
  categoryId: string
  createdAt: string
  updatedAt: string
  author?: { name: string }
  category?: { name: string }
  images?: { url: string }[]
}

export const getArticles = async (): Promise<Article[]> => {
  const res = await api.get<BackendArticle[]>('/articles')
  return res.data.map((a) => ({
    id: a.id,
    title: a.title,
    summary: a.summary || '',
    body: a.content,
    author: a.author?.name || 'Desconocido',
    date: new Date(a.createdAt).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).toUpperCase(),
    tag: a.category?.name || 'SIN CATEGORÍA',
    state: a.state || '',
    imageUrl: a.images?.[0]?.url || '',
    featured: false,
  }))
}

export const getArticleById = (id: string) => api.get(`/articles/${id}`)

export const createArticle = async (data: {
  title: string
  summary: string
  body: string
  state: string
  categoryId: string
}): Promise<BackendArticle> => {
  const slug = data.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const res = await api.post<BackendArticle>('/articles', {
    title: data.title,
    summary: data.summary,
    content: data.body,
    state: data.state,
    categoryId: data.categoryId,
    slug,
    published: true,
  })
  return res.data
}


export const updateArticle = (id: string, data: object) => api.put(`/articles/${id}`, data)
export const deleteArticle = (id: string) => api.delete(`/articles/${id}`)

export const getCategories = async (): Promise<{ id: string; name: string }[]> => {
  const res = await api.get<{ id: string; name: string }[]>('/categories')
  return res.data
}
