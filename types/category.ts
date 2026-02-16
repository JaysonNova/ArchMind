/**
 * 分类类型定义
 */
export interface Category {
  id: string
  name: string
  parentId: string | null
  path: string
  level: number
  sortOrder: number
  description?: string
  icon?: string
  createdAt: string
  updatedAt: string
}

/**
 * 分类树节点类型
 */
export interface CategoryTreeNode extends Category {
  children?: CategoryTreeNode[]
}

/**
 * 创建分类的输入类型
 */
export type CreateCategoryInput = Omit<Category, 'id' | 'path' | 'level' | 'createdAt' | 'updatedAt'>

/**
 * 更新分类的输入类型
 */
export type UpdateCategoryInput = Partial<Omit<Category, 'id' | 'path' | 'level' | 'createdAt' | 'updatedAt'>>
