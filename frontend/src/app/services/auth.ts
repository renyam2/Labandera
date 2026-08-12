import api from './api'

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password })

export const register = (name: string, email: string, password: string) =>
  api.post('/auth/register', { name, email, password })
