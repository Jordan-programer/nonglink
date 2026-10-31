# NongLink

> Plataforma de tecnologia agrícola que liga agricultores a mercados, com dados e sensores ao serviço de preços mais justos.


---

## Visão geral

Em muitos mercados africanos, os pequenos agricultores vendem sem informação de preços e dependem de intermediários que captam a maior parte do valor. A **NongLink** reduz essa distância com três pilares integrados:

| Pilar | O que faz |
|---|---|
| **Marketplace** | Liga produtores e compradores directamente, com transacções transparentes |
| **IoT** | Sensores de campo (humidade, temperatura, etc.) enviam dados via MQTT |
| **Data Intelligence** | Previsão de preços e procura com modelos de machine learning |

**Mercados-alvo:** Angola, República Democrática do Congo, República do Congo e China.

**Impacto (ODS):** SDG 2 (Fome Zero), SDG 8 (Trabalho Digno e Crescimento Económico), SDG 9 (Indústria, Inovação e Infraestrutura) e SDG 17 (Parcerias).

---

## Funcionalidades

- Listagem e negociação de produtos agrícolas
- Agendamento e gestão de rega inteligente por parcela (Fase 2A)
- Ingestão de dados de sensores IoT em tempo real
- Previsão de preço e procura (XGBoost e Prophet)
- Painel de inteligência de preços
- Aplicação web e aplicação móvel
- Modelo de receita: comissão de 3–5% por transacção

---

## Arquitectura

```
┌──────────────┐   ┌───────────────────┐
│  Web (React) │   │ Mobile (React     │
│              │   │ Native)           │
└──────┬───────┘   └─────────┬─────────┘
       │                     │
       └──────────┬──────────┘
                  ▼
        ┌───────────────────┐        ┌──────────────────┐
        │  API (FastAPI)    │◄──────►│  MySQL           │
        └─────────┬─────────┘        └──────────────────┘
                  │
      ┌───────────┴────────────┐
      ▼                        ▼
┌─────────────┐        ┌────────────────────┐
│ ML Pipeline │        │ Broker MQTT        │
│ XGBoost +   │        │ (sensores IoT)     │
│ Prophet     │        └────────────────────┘
└─────────────┘
```

### Stack tecnológica

- **Backend:** Python, FastAPI
- **Web:** React
- **Mobile:** React Native
- **Base de dados:** MySQL
- **IoT:** MQTT
- **ML:** XGBoost, Prophet
- **Infraestrutura:** Docker Compose

---

## Começar

### Pré-requisitos

- Python 3.10+
- Node.js 18+
- Docker e Docker Compose (recomendado)

### Execução com Docker (Full Stack)

O projecto inclui configuração completa de Docker Compose com MySQL 8, Backend FastAPI, Frontend React e Painel Admin:

```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env

# 2. Iniciar todos os serviços com build
docker compose up -d --build

# 3. Ver logs dos serviços
docker compose logs -f
```

Serviços disponibilizados:
- **Frontend (Marketplace):** [http://localhost](http://localhost) (porta `80`)
- **Admin Dashboard:** [http://localhost:5174](http://localhost:5174) (porta `5174`)
- **Backend API & Swagger:** [http://localhost:8000/docs](http://localhost:8000/docs) (porta `8000`)
- **API Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

### Script de Deploy e Produção

Para ambientes VPS ou servidores dedicados, o script `deploy.sh` automatiza todo o ciclo (pull do Git, build dos contentores, health check do backend, migrações Alembic e limpeza de imagens antigas):

```bash
# Tornar executável (em Linux / macOS / VPS)
chmod +x deploy.sh

# Deploy padrão (git pull + build + migrações)
./deploy.sh

# Deploy sem git pull (manual/local)
./deploy.sh --skip-pull

# Deploy reconstruindo imagens sem cache Docker
./deploy.sh --no-cache
```

> **CI/CD Automático:** O repositório está configurado com GitHub Actions em `.github/workflows/deploy.yml` que aciona automaticamente o `deploy.sh` na branch `main` via SSH no directório `/var/www/agrilink/deploy.sh`.

### Desenvolvimento local (sem Docker completo)

Se preferir correr apenas o MySQL em Docker e os serviços localmente:

```bash
# Iniciar apenas a base de dados MySQL de desenvolvimento
docker compose -f docker-compose.dev.yml up -d

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # ou .venv\Scripts\activate no Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd ../frontend
npm install
npm run dev

# Admin
cd ../admin
npm install
npm run dev
```

---

## Estrutura do projeto

```
NongLink/
├── backend/    # API em Python (FastAPI) + SQLAlchemy + Alembic
├── frontend/   # Aplicação web em React (Vite + TypeScript) + Nginx
├── admin/      # Painel de administração em React (Vite + TypeScript) + Nginx
├── mobile/     # Aplicação mobile em React Native (Expo + TypeScript)
├── database/   # Schema e seed do MySQL
├── docs/       # Documentação do projeto
├── docker-compose.yml     # Orquestração de todos os serviços (Produção / Local)
├── docker-compose.dev.yml # Base de dados isolada para desenvolvimento local
└── deploy.sh   # Script de deploy contínuo para VPS e GitHub Actions
```

---

## Estratégia de mercado

A NongLink posiciona **Macau** como porta de entrada para a China, através do mandato do Fórum de Macau para a cooperação com os países de língua portuguesa. A diferenciação assenta em:

- Bolsa digital de commodities agrícolas
- Gestão aduaneira com suporte de blockchain
- Contratos inteligentes no enquadramento jurídico híbrido de Macau

---

## Roadmap

- [x] Arquitectura base e módulo de inteligência de preços
- [x] Identidade de marca
- [ ] Pilotos com produtores reais
- [ ] Integração completa de sensores IoT
- [ ] Interfaces simplificadas para utilizadores com conectividade limitada
- [ ] Bolsa digital de commodities
- [ ] Expansão RDC e República do Congo

---

## Contribuir

1. Faz um *fork* do repositório
2. Cria uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Faz *commit* das alterações (`git commit -m "Adiciona nova funcionalidade"`)
4. Envia a branch (`git push origin feature/nova-funcionalidade`)
5. Abre um *Pull Request*

---

## Licença

A definir.

---

## Contacto

**Jordan Pedro** — CEO, NongLink
Luanda, Angola
`jordanpedro2005@gmail.com` · `https://www.linkedin.com/in/jordan-pedro-a9b009351/`
