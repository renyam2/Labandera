import api from './api'

export interface LoginResponse {
  requires2fa?: boolean
  pendingToken?: string
  token?: string
  user?: { id: string; name: string; email: string; roles: string[] }
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await api.post('/auth/login', { email, password })
  return res.data
}

export const register = (name: string, email: string, password: string) =>
  api.post('/auth/register', { name, email, password })
