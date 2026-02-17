#!/bin/bash

# ============================================================
# ArchMind AI - 一键部署脚本
# ============================================================
# 使用方法:
#   ./deploy.sh              # 标准部署
#   ./deploy.sh --with-nginx # 包含 Nginx 反向代理
#   ./deploy.sh --reset      # 重置所有数据并重新部署
#
# 前置条件:
#   1. 已配置华为云 OBS（需要在 .env 中设置 OBS 密钥）
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    log_success "依赖检查通过"
}

# 创建环境文件
create_env_file() {
    if [ -f ".env" ]; then
        log_info ".env 文件已存在，跳过创建"
        return
    fi

    log_info "创建 .env 文件..."

    # 生成随机密钥
    JWT_SECRET=$(openssl rand -hex 32)
    ENCRYPTION_SECRET=$(openssl rand -hex 16)
    DB_PASSWORD=$(openssl rand -hex 16)

    cat > .env << EOF
# ArchMind AI 生产环境配置
# 自动生成于 $(date)

# 应用 URL（根据实际部署修改）
APP_URL=http://localhost:3000

# 数据库配置
DB_PASSWORD=${DB_PASSWORD}

# 安全配置
JWT_SECRET=${JWT_SECRET}
API_KEY_ENCRYPTION_SECRET=${ENCRYPTION_SECRET}

# 华为云 OBS 存储配置（必须配置）
# 请填写您的华为云 OBS 凭证
HUAWEI_OBS_REGION=cn-north-4
HUAWEI_OBS_ACCESS_KEY=your_huawei_obs_access_key
HUAWEI_OBS_SECRET_KEY=your_huawei_obs_secret_key
HUAWEI_OBS_BUCKET=archmind-documents

# AI API Keys（按需配置）
# ANTHROPIC_API_KEY=your_key
# OPENAI_API_KEY=your_key
# GOOGLE_API_KEY=your_key
# GLM_API_KEY=your_key
# DASHSCOPE_API_KEY=your_key
# BAIDU_API_KEY=your_key
# DEEPSEEK_API_KEY=your_key
EOF

    log_success ".env 文件已创建"
    log_warn "请编辑 .env 文件，配置华为云 OBS 凭证后再运行部署"
}

# 检查 OBS 配置
check_obs_config() {
    if grep -q "your_huawei_obs_access_key" .env 2>/dev/null; then
        log_error "请先在 .env 文件中配置华为云 OBS 凭证"
        log_info "需要配置的变量:"
        log_info "  - HUAWEI_OBS_ACCESS_KEY"
        log_info "  - HUAWEI_OBS_SECRET_KEY"
        log_info "  - HUAWEI_OBS_BUCKET"
        exit 1
    fi
    log_success "华为云 OBS 配置检查通过"
}

# 创建 Docker 目录
create_docker_files() {
    log_info "创建 Docker 配置文件..."

    mkdir -p docker

    # 创建数据库初始化脚本
    cat > docker/init-db.sql << 'EOF'
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建全文搜索配置（中文支持）
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS chinese_zh (COPY = simple);

-- 授权
GRANT ALL PRIVILEGES ON DATABASE archmind TO archmind;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO archmind;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO archmind;
EOF

    # 创建 Nginx 配置（可选）
    cat > docker/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream archmind {
        server archmind:3000;
    }

    server {
        listen 80;
        server_name _;

        client_max_body_size 50M;

        location / {
            proxy_pass http://archmind;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }
    }
}
EOF

    mkdir -p docker/ssl
    log_success "Docker 配置文件已创建"
}

# 构建镜像
build_image() {
    log_info "构建 Docker 镜像..."
    docker compose build --no-cache
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    local with_nginx=$1

    log_info "启动服务..."

    if [ "$with_nginx" = true ]; then
        log_info "启用 Nginx 反向代理..."
        docker compose --profile production up -d
    else
        docker compose up -d
    fi

    log_info "等待服务启动..."
    sleep 10

    # 检查服务状态
    if docker compose ps | grep -q "running"; then
        log_success "服务启动成功！"
    else
        log_error "服务启动失败，请检查日志"
        docker compose logs
        exit 1
    fi
}

# 重置环境
reset_environment() {
    log_warn "即将删除所有数据并重新部署..."
    read -p "确认继续？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "已取消"
        exit 0
    fi

    log_info "停止并删除容器..."
    docker compose down -v --remove-orphans

    log_info "删除镜像..."
    docker rmi archmind-ai 2>/dev/null || true

    log_info "清理完成"
}

# 显示状态
show_status() {
    echo ""
    echo "========================================"
    echo "  ArchMind AI 部署完成"
    echo "========================================"
    echo ""
    docker compose ps
    echo ""
    echo "访问地址:"
    echo "  - 应用: http://localhost:3000"
    echo "  - PostgreSQL: localhost:5432"
    echo ""
    echo "存储服务:"
    echo "  - 华为云 OBS (已在 .env 中配置)"
    echo ""
    echo "常用命令:"
    echo "  查看日志: docker compose logs -f"
    echo "  停止服务: docker compose down"
    echo "  重启服务: docker compose restart"
    echo ""
}

# 主流程
main() {
    echo ""
    echo "========================================"
    echo "  ArchMind AI 一键部署"
    echo "========================================"
    echo ""

    local with_nginx=false
    local reset=false

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --with-nginx)
                with_nginx=true
                shift
                ;;
            --reset)
                reset=true
                shift
                ;;
            *)
                log_error "未知参数: $1"
                exit 1
                ;;
        esac
    done

    check_dependencies

    if [ "$reset" = true ]; then
        reset_environment
    fi

    create_env_file
    check_obs_config
    create_docker_files
    build_image
    start_services "$with_nginx"
    show_status
}

main "$@"
