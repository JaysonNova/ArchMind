/**
 * 用户注册接口
 * POST /api/auth/register
 */

import { z } from 'zod'
import { UserDAO } from '~/lib/db/dao/user-dao'
import { hashPassword } from '~/server/utils/password'
import { generateToken } from '~/server/utils/jwt'
import type { RegisterRequest, AuthResponse } from '~/types/auth'

// 请求体验证 schema
const registerSchema = z.object({
  email: z.string().email('无效的邮箱地址'),
  password: z.string().min(8, '密码至少需要 8 个字符'),
  fullName: z.string().min(1).max(100).optional()
})

// 生成随机用户名
function generateUsername(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'user_'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  try {
    // 解析并验证请求体
    const body = await readBody<RegisterRequest>(event)
    const validatedData = registerSchema.parse(body)

    // 检查邮箱是否已存在
    const emailExists = await UserDAO.emailExists(validatedData.email)
    if (emailExists) {
      throw createError({
        statusCode: 400,
        message: '该邮箱已被注册'
      })
    }

    // 生成唯一的用户名
    let username = generateUsername()
    let attempts = 0
    while (await UserDAO.usernameExists(username)) {
      username = generateUsername()
      attempts++
      if (attempts > 10) {
        throw createError({
          statusCode: 500,
          message: '无法生成唯一用户名，请稍后重试'
        })
      }
    }

    // 哈希密码
    const passwordHash = await hashPassword(validatedData.password)

    // 创建用户
    const user = await UserDAO.create({
      username,
      email: validatedData.email,
      passwordHash,
      fullName: validatedData.fullName
    })

    // 生成 JWT Token
    const token = generateToken({ userId: user.id })

    // 设置 HTTP-Only Cookie
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 天
      path: '/'
    })

    return {
      success: true,
      user
    }
  } catch (error: any) {
    // Zod 验证错误
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: error.errors[0]?.message || '输入数据无效'
      })
    }

    // 已经是 HTTP 错误，直接抛出
    if (error.statusCode) {
      throw error
    }

    // 其他错误
    console.error('注册失败:', error)
    throw createError({
      statusCode: 500,
      message: '注册失败，请稍后重试'
    })
  }
})
