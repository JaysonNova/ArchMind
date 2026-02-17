# ArchMind 文档中心

> 项目文档索引与导航

---

## 快速开始

| 文档 | 描述 |
|------|------|
| [README.md](../README.md) | 项目主文档、安装指南 |
| [CLAUDE.md](../CLAUDE.md) | AI 开发助手指南 |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | 贡献指南 |
| [CHANGELOG.md](../CHANGELOG.md) | 变更日志 |

---

## 核心文档

### 架构与设计

| 文档 | 描述 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统架构详解（推荐） |
| [技术路线与架构文档.md](./技术路线与架构文档.md) | 技术选型说明 |
| [架构设计文档.md](./架构设计文档.md) | 架构设计细节 |
| [ArchMind AI 产品需求文档 (PRD).md](./ArchMind%20AI%20产品需求文档%20(PRD).md) | 产品需求文档 |

### 详细设计

| 文档 | 描述 |
|------|------|
| [详细设计/01-数据层详细设计.md](./详细设计/01-数据层详细设计.md) | 数据库设计 |
| [详细设计/02-RAG引擎详细设计.md](./详细设计/02-RAG引擎详细设计.md) | RAG 引擎设计 |
| [详细设计/03-AI服务层详细设计.md](./详细设计/03-AI服务层详细设计.md) | AI 服务设计 |
| [详细设计/04-PRD生成引擎详细设计.md](./详细设计/04-PRD生成引擎详细设计.md) | PRD 生成设计 |
| [详细设计/05-API层详细设计.md](./详细设计/05-API层详细设计.md) | API 层设计 |
| [详细设计/06-前端架构详细设计.md](./详细设计/06-前端架构详细设计.md) | 前端架构设计 |

---

## API 文档

| 文档 | 描述 |
|------|------|
| [api/API.md](./api/API.md) | 完整 API 参考 |

---

## Phase 实施文档

| 文档 | 描述 | 状态 |
|------|------|------|
| [PHASE-2-SUMMARY.md](./PHASE-2-SUMMARY.md) | 文件上传重构 | ✅ 完成 |
| [PHASE-3-SUMMARY.md](./PHASE-3-SUMMARY.md) | 状态追踪 | ✅ 完成 |
| [PHASE-4-SUMMARY.md](./PHASE-4-SUMMARY.md) | 标签与分类 | ✅ 完成 |
| [PHASE-5-SUMMARY.md](./PHASE-5-SUMMARY.md) | 混合搜索 | ✅ 完成 |
| [PHASE-6-SUMMARY.md](./PHASE-6-SUMMARY.md) | 版本控制 | ✅ 完成 |
| [PHASE-6-CHECKLIST.md](./PHASE-6-CHECKLIST.md) | Phase 6 检查清单 | ✅ 完成 |
| [PROJECT-COMPLETE-SUMMARY.md](./PROJECT-COMPLETE-SUMMARY.md) | 项目完整总结 | ✅ 完成 |

---

## 部署指南

| 文档 | 描述 |
|------|------|
| [minio-setup.md](./minio-setup.md) | MinIO 本地存储配置 |
| [huawei-obs-deployment.md](./huawei-obs-deployment.md) | 华为云 OBS 部署 |
| [HUAWEI-OBS-SUMMARY.md](./HUAWEI-OBS-SUMMARY.md) | 华为云 OBS 适配器总结 |
| [PostgreSQL数据库迁移指南.md](./PostgreSQL数据库迁移指南.md) | 数据库迁移指南 |

---

## 组件与样式

| 文档 | 描述 |
|------|------|
| [SHADCN_DESIGN_STANDARDS.md](./SHADCN_DESIGN_STANDARDS.md) | UI 设计规范 |
| [SHADCN_USAGE.md](./SHADCN_USAGE.md) | 组件使用指南 |
| [SHADCN_SETUP.md](./SHADCN_SETUP.md) | 组件安装配置 |

---

## 集成指南

| 文档 | 描述 |
|------|------|
| [GLM_INTEGRATION.md](./GLM_INTEGRATION.md) | 智谱 AI (GLM) 集成 |
| [I18N.md](./I18N.md) | 国际化 (i18n) 指南 |
| [I18N_QUICK_START.md](./I18N_QUICK_START.md) | 国际化快速开始 |
| [storage-adapter-examples.md](./storage-adapter-examples.md) | 存储适配器示例 |

---

## 技术参考

| 文档 | 描述 |
|------|------|
| [multi-model-vectors.md](./multi-model-vectors.md) | 多模型向量支持 |
| [pgvector-2000-dim-limit.md](./pgvector-2000-dim-limit.md) | pgvector 维度限制说明 |
| [LOGIC_COVERAGE.md](./LOGIC_COVERAGE.md) | 逻辑覆盖说明 |
| [WORKSPACE_GUIDE.md](./WORKSPACE_GUIDE.md) | 工作区指南 |

---

## 文档分类

```
docs/
├── 核心文档
│   ├── ARCHITECTURE.md          # 架构文档
│   ├── 技术路线与架构文档.md
│   └── 架构设计文档.md
│
├── API 文档
│   └── api/
│       └── API.md               # API 参考
│
├── 详细设计
│   └── 详细设计/
│       ├── 01-数据层详细设计.md
│       ├── 02-RAG引擎详细设计.md
│       ├── 03-AI服务层详细设计.md
│       ├── 04-PRD生成引擎详细设计.md
│       ├── 05-API层详细设计.md
│       └── 06-前端架构详细设计.md
│
├── Phase 实施
│   ├── PHASE-2-SUMMARY.md ~ PHASE-6-SUMMARY.md
│   ├── PHASE-6-CHECKLIST.md
│   └── PROJECT-COMPLETE-SUMMARY.md
│
├── 部署指南
│   ├── minio-setup.md
│   ├── huawei-obs-deployment.md
│   ├── HUAWEI-OBS-SUMMARY.md
│   └── PostgreSQL数据库迁移指南.md
│
├── 组件与样式
│   ├── SHADCN_DESIGN_STANDARDS.md
│   ├── SHADCN_USAGE.md
│   └── SHADCN_SETUP.md
│
├── 集成指南
│   ├── GLM_INTEGRATION.md
│   ├── I18N.md
│   ├── I18N_QUICK_START.md
│   └── storage-adapter-examples.md
│
└── 技术参考
    ├── multi-model-vectors.md
    ├── pgvector-2000-dim-limit.md
    ├── LOGIC_COVERAGE.md
    └── WORKSPACE_GUIDE.md
```

---

## 推荐阅读顺序

### 新开发者

1. [README.md](../README.md) - 项目概览
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构理解
3. [CLAUDE.md](../CLAUDE.md) - 开发规范
4. [api/API.md](./api/API.md) - API 了解

### 运维部署

1. [minio-setup.md](./minio-setup.md) - 本地存储
2. [HUAWEI-OBS-SUMMARY.md](./HUAWEI-OBS-SUMMARY.md) - 云存储
3. [PostgreSQL数据库迁移指南.md](./PostgreSQL数据库迁移指南.md) - 数据库

### 功能扩展

1. [详细设计/](./详细设计/) - 模块设计
2. [SHADCN_USAGE.md](./SHADCN_USAGE.md) - UI 组件
3. [GLM_INTEGRATION.md](./GLM_INTEGRATION.md) - AI 集成

---

*最后更新: 2026-02-16*
