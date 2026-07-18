import api from './api'

export interface BackendArticle {
  id: string
  title: string
  slug: string
  summary: string | null
  content: string
  image: string | null
  published: boolean
  authorId: string
  categoryId: string
  createdAt: string
  updatedAt: string
  author?: { name: string }
  category?: { name: string }
}

export interface FrontendArticle {
  id: string
  title: string
  summary: string
  body: string
  author: string
  date: string
  tag: string
  state: string
  imageUrl: string
  featured: boolean
}

export const getArticles = async (): Promise<FrontendArticle[]> => {
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
    state: '',
    imageUrl: a.image || '',
    featured: false,
  }))
}

export const getArticleById = (id: string) => api.get(`/articles/${id}`)

export const createArticle = async (data: {
  title: string
  summary: string
  body: string
  authorId: string
  categoryId: string
}): Promise<BackendArticle> => {
  const slug = data.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const res = await api.post<BackendArticle>('/articles', {
    ...data,
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
