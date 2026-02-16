/**
 * 密码哈希工具
 * 使用 bcrypt 进行密码加密和验证
 */

import bcrypt from 'bcrypt'

const { hash, compare } = bcrypt

const SALT_ROUNDS = 10

/**
 * 对密码进行哈希加密
 * @param password 原始密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS)
}

/**
 * 验证密码是否匹配
 * @param password 原始密码
 * @param hashedPassword 哈希后的密码
 * @returns 是否匹配
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword)
}
