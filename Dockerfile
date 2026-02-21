# ArchMind AI - Production Dockerfile
# 多阶段构建，优化镜像大小

# ================================
# Stage 1: 依赖安装
# ================================
FROM node:20-alpine AS deps

# 安装 pnpm 及原生模块编译工具
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装全部依赖（包含 dev，以便原生模块能正确编译）
# 之后用 --prod 过滤只保留生产依赖
RUN pnpm install --frozen-lockfile
RUN pnpm prune --prod

# ================================
# Stage 2: 构建
# ================================
FROM node:20-alpine AS builder

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 复制依赖文件并安装全部依赖
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 设置构建时环境变量
ARG APP_URL=http://localhost:3000
ENV APP_URL=$APP_URL
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server

# 构建
RUN pnpm build

# ================================
# Stage 3: 运行时
# ================================
FROM node:20-alpine AS runner

WORKDIR /app

# 安装 dumb-init 用于正确处理信号
RUN apk add --no-cache dumb-init

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nuxt

# 复制构建产物
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# 复制生产依赖（用于 pg 等原生模块）
COPY --from=deps /app/node_modules ./node_modules

# 设置权限
RUN chown -R nuxt:nodejs /app

USER nuxt

# 环境变量
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000

# 使用 dumb-init 启动
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", ".output/server/index.mjs"]
