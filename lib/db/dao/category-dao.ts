/**
 * CategoryDAO - 分类数据访问对象
 * 提供分类的 CRUD 操作和树形结构管理
 */

import { dbClient } from '../client'
import type { Category, CategoryTreeNode, CreateCategoryInput, UpdateCategoryInput } from '~/types/category'

export class CategoryDAO {
  /**
   * 查询所有分类
   */
  static async findAll(): Promise<Category[]> {
    const sql = `
      SELECT * FROM categories
      ORDER BY level ASC, sort_order ASC, name ASC
    `
    const result = await dbClient.query(sql)
    return result.rows.map(row => this.mapRowToCategory(row))
  }

  /**
   * 根据 ID 查询分类
   */
  static async findById(id: string): Promise<Category | null> {
    const sql = 'SELECT * FROM categories WHERE id = $1'
    const result = await dbClient.query(sql, [id])

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToCategory(result.rows[0])
  }

  /**
   * 查询顶级分类
   */
  static async findRootCategories(): Promise<Category[]> {
    const sql = `
      SELECT * FROM categories
      WHERE parent_id IS NULL
      ORDER BY sort_order ASC, name ASC
    `
    const result = await dbClient.query(sql)
    return result.rows.map(row => this.mapRowToCategory(row))
  }

  /**
   * 查询某分类的子分类
   */
  static async findChildren(parentId: string): Promise<Category[]> {
    const sql = `
      SELECT * FROM categories
      WHERE parent_id = $1
      ORDER BY sort_order ASC, name ASC
    `
    const result = await dbClient.query(sql, [parentId])
    return result.rows.map(row => this.mapRowToCategory(row))
  }

  /**
   * 创建分类
   */
  static async create(input: CreateCategoryInput): Promise<Category> {
    // 1. 计算 level 和 path
    let level = 0
    let path = input.name

    if (input.parentId) {
      const parent = await this.findById(input.parentId)
      if (!parent) {
        throw new Error(`Parent category not found: ${input.parentId}`)
      }
      level = parent.level + 1
      path = `${parent.path}/${input.name}`
    }

    // 2. 插入数据
    const sql = `
      INSERT INTO categories (
        name, parent_id, path, level, sort_order, description, icon
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `

    const result = await dbClient.query(sql, [
      input.name,
      input.parentId || null,
      path,
      level,
      input.sortOrder || 0,
      input.description || null,
      input.icon || null
    ])

    return this.mapRowToCategory(result.rows[0])
  }

  /**
   * 更新分类
   */
  static async update(id: string, input: UpdateCategoryInput): Promise<Category | null> {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (input.name !== undefined) {
      fields.push(`name = $${paramIndex}`)
      values.push(input.name)
      paramIndex++
    }

    if (input.sortOrder !== undefined) {
      fields.push(`sort_order = $${paramIndex}`)
      values.push(input.sortOrder)
      paramIndex++
    }

    if (input.description !== undefined) {
      fields.push(`description = $${paramIndex}`)
      values.push(input.description)
      paramIndex++
    }

    if (input.icon !== undefined) {
      fields.push(`icon = $${paramIndex}`)
      values.push(input.icon)
      paramIndex++
    }

    if (fields.length === 0) {
      return await this.findById(id)
    }

    // 如果名称改变，需要重新计算 path
    if (input.name !== undefined) {
      const category = await this.findById(id)
      if (category) {
        let newPath = input.name

        if (category.parentId) {
          const parent = await this.findById(category.parentId)
          if (parent) {
            newPath = `${parent.path}/${input.name}`
          }
        }

        fields.push(`path = $${paramIndex}`)
        values.push(newPath)
        paramIndex++

        // 更新所有子分类的 path
        await this.updateChildrenPath(id, category.path, newPath)
      }
    }

    values.push(id)
    const sql = `
      UPDATE categories
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await dbClient.query(sql, values)

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToCategory(result.rows[0])
  }

  /**
   * 删除分类（级联删除子分类）
   */
  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM categories WHERE id = $1'
    const result = await dbClient.query(sql, [id])
    return (result.rowCount ?? 0) > 0
  }

  /**
   * 移动分类到新父级
   */
  static async move(id: string, newParentId: string | null): Promise<Category | null> {
    const category = await this.findById(id)
    if (!category) {
      return null
    }

    // 计算新的 level 和 path
    let newLevel = 0
    let newPath = category.name

    if (newParentId) {
      const newParent = await this.findById(newParentId)
      if (!newParent) {
        throw new Error(`Parent category not found: ${newParentId}`)
      }

      // 防止循环引用
      if (newParent.path.startsWith(category.path + '/')) {
        throw new Error('Cannot move category to its own descendant')
      }

      newLevel = newParent.level + 1
      newPath = `${newParent.path}/${category.name}`
    }

    // 更新分类
    const sql = `
      UPDATE categories
      SET parent_id = $1, level = $2, path = $3
      WHERE id = $4
      RETURNING *
    `

    const result = await dbClient.query(sql, [newParentId, newLevel, newPath, id])

    // 更新所有子分类的 path 和 level
    await this.updateChildrenPath(id, category.path, newPath)

    return this.mapRowToCategory(result.rows[0])
  }

  /**
   * 构建分类树
   */
  static async buildTree(): Promise<CategoryTreeNode[]> {
    const allCategories = await this.findAll()
    const categoryMap = new Map<string, CategoryTreeNode>()

    // 创建映射
    for (const cat of allCategories) {
      categoryMap.set(cat.id, { ...cat, children: [] })
    }

    // 构建树结构
    const tree: CategoryTreeNode[] = []

    for (const cat of allCategories) {
      const node = categoryMap.get(cat.id)!

      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId)
        if (parent) {
          if (!parent.children) {
            parent.children = []
          }
          parent.children.push(node)
        }
      } else {
        tree.push(node)
      }
    }

    return tree
  }

  /**
   * 查询分类下的文档数量
   */
  static async getDocumentCount(categoryId: string): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM documents WHERE category_id = $1'
    const result = await dbClient.query(sql, [categoryId])
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * 查询分类路径上的所有分类（面包屑）
   */
  static async getBreadcrumb(categoryId: string): Promise<Category[]> {
    const category = await this.findById(categoryId)
    if (!category) {
      return []
    }

    const pathParts = category.path.split('/')
    const breadcrumb: Category[] = []

    let currentPath = ''
    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part

      const sql = 'SELECT * FROM categories WHERE path = $1'
      const result = await dbClient.query(sql, [currentPath])

      if (result.rows.length > 0) {
        breadcrumb.push(this.mapRowToCategory(result.rows[0]))
      }
    }

    return breadcrumb
  }

  /**
   * 更新子分类的 path（内部方法）
   */
  private static async updateChildrenPath(parentId: string, oldPath: string, newPath: string): Promise<void> {
    const sql = `
      UPDATE categories
      SET path = $1 || substring(path from ${oldPath.length + 1}),
          level = level + $2
      WHERE path LIKE $3
    `

    const levelDiff = newPath.split('/').length - oldPath.split('/').length

    await dbClient.query(sql, [
      newPath,
      levelDiff,
      `${oldPath}/%`
    ])
  }

  /**
   * 映射数据库行到 Category 对象
   */
  private static mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      path: row.path,
      level: row.level,
      sortOrder: row.sort_order,
      description: row.description,
      icon: row.icon,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}
