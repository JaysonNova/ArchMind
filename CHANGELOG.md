# 变更日志

本项目的所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### 新增
- 待发布功能...

---

## [0.1.0] - 2026-02-16

### 新增

#### 核心功能
- **文档管理系统**: 支持 PDF、DOCX、Markdown 格式文档的上传、处理和管理
- **RAG 引擎**: 基于向量检索的文档问答和内容检索
- **PRD 生成**: 基于历史文档智能生成产品需求文档
- **对话系统**: 支持多轮对话的 AI 助手功能
- **原型预览**: PRD 原型的可视化预览

#### AI 多模型支持
- **Anthropic Claude**: Claude 3.5 Sonnet 支持
- **OpenAI**: GPT-4o、GPT-4 Turbo 支持
- **Google**: Gemini 1.5 Pro 支持 (200K 上下文)
- **智谱 AI**: GLM-4、GLM-4.5 Air 支持
- **阿里云**: 通义千问 (Qwen) 支持
- **百度**: 文心一言 (Wenxin) 支持
- **DeepSeek**: DeepSeek Chat 支持
- **Ollama**: 本地模型支持

#### 文档处理
- 文档版本控制系统
- SHA-256 智能去重
- 批量上传 (并行处理)
- 文档处理进度追踪
- 标签和分类管理

#### 搜索功能
- PostgreSQL 全文检索 (tsvector + GIN)
- pgvector 向量检索
- 混合搜索 (RRF 算法融合)

#### 对象存储
- MinIO 本地存储适配器
- 华为云 OBS 存储适配器
- 统一存储抽象层
- 预签名 URL 下载

#### 用户系统
- JWT 认证
- 用户注册/登录
- 多工作区支持
- 用户 API Key 配置

#### UI 组件
- shadcn/ui 组件库集成 (30+ 组件)
- Tailwind CSS 样式
- 深色模式支持
- 响应式设计

### 技术栈
- Nuxt 3.21 + Vue 3.5 + TypeScript 5.9
- PostgreSQL 14+ + pgvector
- Drizzle ORM
- Pinia 状态管理
- VeeValidate + Zod 表单验证
- LangChain.js
- Vitest 测试框架

---

## [0.0.1] - 2026-02-01

### 新增
- 项目初始化
- 基础项目结构
- Nuxt 3 框架配置
- 基本的文档处理流程

---

## 版本规划

### [0.2.0] - 计划中

#### 新增
- [ ] 混合搜索优化 (重排序机制)
- [ ] Redis 缓存层
- [ ] API 版本控制 (v1)
- [ ] 监控和告警 (Sentry)
- [ ] 审计日志

#### 改进
- [ ] 测试覆盖率提升至 60%+
- [ ] 性能优化 (数据库查询)
- [ ] 安全加固 (CSRF, Rate Limiting)

### [0.3.0] - 计划中

#### 新增
- [ ] WebSocket 实时通信
- [ ] 团队协作功能
- [ ] Webhook 支持
- [ ] OpenAPI 文档自动生成
- [ ] 国际化 (i18n) 完善

#### 改进
- [ ] E2E 测试覆盖
- [ ] CI/CD 流程
- [ ] Docker Compose 生产配置

### [1.0.0] - 计划中

#### 新增
- [ ] RBAC 权限系统
- [ ] 数据导出/导入
- [ ] 批量操作 API
- [ ] 插件系统
- [ ] Kubernetes 部署配置

---

## 版本说明

### 版本号格式

- **主版本号 (MAJOR)**: 不兼容的 API 变更
- **次版本号 (MINOR)**: 向后兼容的功能新增
- **修订号 (PATCH)**: 向后兼容的问题修复

### 变更类型

- **新增 (Added)**: 新功能
- **变更 (Changed)**: 现有功能的变更
- **弃用 (Deprecated)**: 即将移除的功能
- **移除 (Removed)**: 已移除的功能
- **修复 (Fixed)**: Bug 修复
- **安全 (Security)**: 安全相关的修复

---

*最后更新: 2026-02-16*
