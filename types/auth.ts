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

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  email: string
  password: string
  confirmPassword: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message?: string
  devCode?: string // 仅开发环境
  devResetUrl?: string // 仅开发环境
}

export interface ResetPasswordResponse {
  success: boolean
  message?: string
  user?: User
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
