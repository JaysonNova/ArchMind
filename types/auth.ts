/**
 * 认证相关类型定义
 */

export interface User {
  id: string
  username: string // 自动生成：user_xxxxxx
  email: string
  fullName?: string
  avatarUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName?: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  message?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface JwtPayload {
  userId: string
  iat?: number
  exp?: number
}
