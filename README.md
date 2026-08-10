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
uvicorn app.main:app --reload --host 0.0.0.0
```
API em http://localhost:8000 (docs em `/docs`).

`--host 0.0.0.0` é necessário para que a app mobile (a correr num telemóvel físico) consiga alcançar a API pela rede local — com o valor por omissão (`127.0.0.1`) só o próprio PC consegue ligar-se.

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
