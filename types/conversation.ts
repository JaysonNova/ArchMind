/**
 * 对话类型定义
 */

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  modelUsed?: string
  useRAG?: boolean
  documentIds?: string[]
  timestamp: number
  isStreaming?: boolean
  prdContent?: string
}

export interface Conversation {
  id: string
  title?: string
  messages: ConversationMessage[]
  currentPrdContent: string
  createdAt: number
  updatedAt: number
  savedToDb?: boolean
  dbId?: string
  /** 上次保存到数据库时的消息数量，用于判断是否有新消息需要保存 */
  lastSavedMessageCount?: number
}

export interface ConversationSaveRequest {
  conversationId: string
  title: string
  messages: ConversationMessage[]
  finalPrdContent: string
}

export interface ConversationSaveResponse {
  success: boolean
  id: string
  message: string
}
