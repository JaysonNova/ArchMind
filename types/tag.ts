/**
 * 标签类型定义
 */
export interface Tag {
  id: string
  name: string
  color: string
  description?: string
  usageCount: number
  createdAt: string
  updatedAt: string
}

/**
 * 创建标签的输入类型
 */
export type CreateTagInput = Omit<Tag, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>

/**
 * 更新标签的输入类型
 */
export type UpdateTagInput = Partial<Omit<Tag, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>>
