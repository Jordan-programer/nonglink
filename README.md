# AgriLink

Plataforma AgriTech que integra marketplace agrícola, monitoramento IoT e análise de dados para agricultores em Angola (e, no futuro, em toda África).

Ver descrição completa do projeto em [`docs/project-description.md`](docs/project-description.md).

## Estrutura do projeto

```
agrilink/
├── backend/    # API em Python (FastAPI) + SQLAlchemy
├── frontend/   # Aplicação web em React (Vite + TypeScript)
├── mobile/     # Aplicação mobile em React Native (Expo + TypeScript)
├── database/   # Schema e seed do MySQL
└── docs/       # Documentação do projeto
```

## Como correr cada parte

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```
API em http://localhost:8000 (docs em `/docs`).

### Base de dados
Importa `database/schema.sql` (e opcionalmente `database/seed.sql`) na tua instância MySQL (ex: via phpMyAdmin do XAMPP).

### Frontend (web)
```bash
cd frontend
npm install
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## Stack
- **Backend:** Python + FastAPI + SQLAlchemy + MySQL
- **Frontend:** React + Vite + TypeScript
- **Mobile:** React Native + Expo + TypeScript
- **Base de dados:** MySQL
