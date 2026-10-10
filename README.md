# NongLink

> Plataforma de tecnologia agrícola que liga agricultores a mercados, com dados e sensores ao serviço de preços mais justos.

*Anteriormente conhecida como AgriLink.*

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
- MySQL 8+
- Docker e Docker Compose (recomendado)

### Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/<organizacao>/nonglink.git
cd nonglink

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Arrancar os serviços
docker compose up --build
```

### Desenvolvimento local (sem Docker)

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Web
cd ../web
npm install
npm run dev
```

> **Nota:** ajusta os caminhos e comandos acima à estrutura real do repositório.

---

## Estrutura do projeto

```
NongLink/
├── backend/    # API em Python (FastAPI) + SQLAlchemy
├── frontend/   # Aplicação web em React (Vite + TypeScript)
├── mobile/     # Aplicação mobile em React Native (Expo + TypeScript)
├── database/   # Schema e seed do MySQL
└── docs/       # Documentação do projeto
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
