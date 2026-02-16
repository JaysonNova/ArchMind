/**
 * 修改密码
 * PUT /api/user/password
 */

import { z } from 'zod'
import { UserDAO } from '~/lib/db/dao/user-dao'
import { verifyToken } from '~/server/utils/jwt'
import { verifyPassword, hashPassword } from '~/server/utils/password'
import { dbClient } from '~/lib/db/client'

// 请求体验证 schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6).max(100)
})

type ChangePasswordRequest = z.infer<typeof changePasswordSchema>

interface ChangePasswordResponse {
  success: boolean
  message?: string
}

export default defineEventHandler(async (event): Promise<ChangePasswordResponse> => {
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
    const body = await readBody<ChangePasswordRequest>(event)
    const validated = changePasswordSchema.safeParse(body)

    if (!validated.success) {
      return {
        success: false,
        message: '输入数据格式错误'
      }
    }

    const { currentPassword, newPassword } = validated.data

    // 获取用户当前的密码哈希
    const passwordHash = await UserDAO.getPasswordHashById(payload.userId)
    if (!passwordHash) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    // 验证当前密码
    const isValid = await verifyPassword(currentPassword, passwordHash)
    if (!isValid) {
      return {
        success: false,
        message: '当前密码错误'
      }
    }

    // 哈希新密码
    const newPasswordHash = await hashPassword(newPassword)

    // 更新密码（通过更新用户表）
    await dbClient.query(
      'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
      [newPasswordHash, new Date().toISOString(), payload.userId]
    )

    return {
      success: true,
      message: '密码修改成功'
    }
  } catch (error: any) {
    console.error('修改密码失败:', error)
    return {
      success: false,
      message: '修改密码失败'
    }
  }
})
