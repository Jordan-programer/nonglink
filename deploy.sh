#!/usr/bin/env bash
# ==============================================================================
# NongLink - Script de Deploy Contínuo e Produção
# ==============================================================================
# Uso:
#   ./deploy.sh              Deploy padrão (git pull + build + migrações)
#   ./deploy.sh --skip-pull  Deploy sem atualizar o repositório git
#   ./deploy.sh --no-cache   Reconstruir imagens sem cache Docker
#   ./deploy.sh --help       Exibe esta ajuda
# ==============================================================================

set -euo pipefail

# Cores para terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sem cor

log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] [OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] [AVISO]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] [ERRO]${NC} $1" >&2
}

# Parâmetros
SKIP_PULL=false
NO_CACHE=""

for arg in "$@"; do
    case "$arg" in
        --skip-pull)
            SKIP_PULL=true
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            ;;
        --help|-h)
            echo "Uso: ./deploy.sh [OPÇÕES]"
            echo ""
            echo "Opções:"
            echo "  --skip-pull    Pula o git pull (útil em testes locais ou deploys manuais)"
            echo "  --no-cache     Reconstrói as imagens do Docker sem usar cache"
            echo "  --help, -h     Mostra esta mensagem de ajuda"
            exit 0
            ;;
        *)
            log_warn "Opção desconhecida: $arg (ignorada)"
            ;;
    esac
done

# Navegar para o directório raiz do projecto
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DEPLOY_DIR"
log_info "Directório de trabalho: $DEPLOY_DIR"

# 1. Verificar pré-requisitos (Docker e Compose)
if ! command -v docker &> /dev/null; then
    log_error "Docker não está instalado. Instale o Docker antes de continuar."
    exit 1
fi

if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    log_error "Docker Compose não foi encontrado. Instale o plugin compose ou o executável docker-compose."
    exit 1
fi
log_info "Utilizando: $COMPOSE_CMD"

# 2. Verificar ficheiro .env
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        log_warn "Ficheiro .env não encontrado. A copiar .env.example para .env..."
        cp .env.example .env
        log_warn "ATENÇÃO: Configure as variáveis e senhas em .env antes de executar em produção!"
    else
        log_error "Nenhum ficheiro .env ou .env.example encontrado. Impossível continuar."
        exit 1
    fi
fi

# Carregar variáveis do .env para o script
set -a
# shellcheck disable=SC1091
source .env
set +a

# 3. Atualizar código do repositório Git (se aplicável)
if [ "$SKIP_PULL" = false ]; then
    if [ -d ".git" ]; then
        log_info "A atualizar o código com 'git pull'..."
        git fetch origin main || true
        git pull origin main || log_warn "Não foi possível puxar da branch main diretamente; mantendo código local."
    else
        log_warn "Directório .git não encontrado. A saltar actualização via git."
    fi
else
    log_info "Flag --skip-pull activa. Saltando git pull."
fi

# 4. Construir e iniciar os contentores Docker
log_info "A construir e iniciar os serviços com Docker Compose..."
if [ -n "$NO_CACHE" ]; then
    $COMPOSE_CMD build --no-cache
fi
$COMPOSE_CMD up -d --build --remove-orphans

# 5. Aguardar saúde do serviço de backend
log_info "A verificar estado de prontidão do backend..."
BACKEND_PORT="${BACKEND_PORT:-8000}"
HEALTH_URL="http://localhost:${BACKEND_PORT}/health"
MAX_RETRIES=24
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if curl -sf "$HEALTH_URL" &> /dev/null; then
        HEALTHY=true
        break
    fi
    log_info "Aguardando backend responder em $HEALTH_URL... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 3
done

if [ "$HEALTHY" = true ]; then
    log_success "Backend está operacional e saudável!"
else
    log_error "Tempo esgotado ao aguardar pelo backend. Verifique os logs com: $COMPOSE_CMD logs backend"
    exit 1
fi

# 6. Executar migrações da base de dados (Alembic)
log_info "A aplicar migrações Alembic..."
$COMPOSE_CMD exec -T backend alembic upgrade head
log_success "Migrações aplicadas com sucesso!"

# 7. Limpeza de imagens Docker obsoletas
log_info "A remover imagens Docker órfãs/dangling..."
docker image prune -f || true

# 8. Relatório final de estado
echo ""
echo "=============================================================================="
log_success "Deploy concluído com sucesso!"
echo "=============================================================================="
$COMPOSE_CMD ps
echo ""
echo "Serviços disponíveis:"
echo "  - Frontend (Web):       http://localhost:${FRONTEND_PORT:-80}"
echo "  - Admin Dashboard:     http://localhost:${ADMIN_PORT:-5174}"
echo "  - Backend API:         http://localhost:${BACKEND_PORT:-8000}"
echo "  - Swagger Docs:        http://localhost:${BACKEND_PORT:-8000}/docs"
echo "  - Health Check:        http://localhost:${BACKEND_PORT:-8000}/health"
echo "=============================================================================="
