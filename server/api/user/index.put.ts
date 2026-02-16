/**
 * 更新用户信息
 * PUT /api/user
 */

import { z } from 'zod'
import { UserDAO } from '~/lib/db/dao/user-dao'
import { verifyToken } from '~/server/utils/jwt'

// 请求体验证 schema
const updateUserSchema = z.object({
  fullName: z.string().trim().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional().nullable()
})

type UpdateUserRequest = z.infer<typeof updateUserSchema>

interface UpdateUserResponse {
  success: boolean
  user?: {
    id: string
    username: string
    email: string
    fullName?: string
    avatarUrl?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  message?: string
}

export default defineEventHandler(async (event): Promise<UpdateUserResponse> => {
  try {
    // 从 Cookie 中获取 Token
    const token = getCookie(event, 'auth_token')

    if (!token) {
      return {
        success: false,
        message: '未登录'
      }
    }

    // 验证 Token
    const payload = verifyToken(token)
    if (!payload) {
      return {
        success: false,
        message: 'Token 无效或已过期'
      }
    }

    // 获取并验证请求体
    const body = await readBody<UpdateUserRequest>(event)
    const validated = updateUserSchema.safeParse(body)

    if (!validated.success) {
      return {
        success: false,
        message: '输入数据格式错误'
      }
    }

    // 更新用户信息
    const updateData: { fullName?: string; avatarUrl?: string } = {}

    if (validated.data.fullName !== undefined) {
      updateData.fullName = validated.data.fullName
    }

    if (validated.data.avatarUrl !== undefined) {
      updateData.avatarUrl = validated.data.avatarUrl ?? undefined
    }

    const user = await UserDAO.update(payload.userId, updateData)

    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    // 处理头像 URL（使用代理 URL）
    let avatarUrl: string | undefined = user.avatarUrl || undefined
    if (user.avatarUrl && user.avatarUrl.startsWith('avatars/')) {
      avatarUrl = `/api/user/avatar/${user.id}`
    }

    return {
      success: true,
      user: {
        ...user,
        avatarUrl
      }
    }
  } catch (error: any) {
    console.error('更新用户信息失败:', error)
    return {
      success: false,
      message: '更新用户信息失败'
    }
  }
})
