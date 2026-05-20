# 🏥 MediBot — Estimador Agéntico de Copago y Cobertura

> Sistema conversacional impulsado por IA que permite a un paciente describir sus síntomas en lenguaje natural y obtener: la **especialidad médica recomendada**, el **copago exacto según su plan de seguro**, y el **hospital más económico** de su red.

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js v18 o superior
- npm v9 o superior

### 1. Backend (Puerto 3001)

```bash
cd backend
npm install
npm run dev
```

El servidor iniciará en `http://localhost:3001`.
Al arrancar, intentará conectarse a Notion para crear/leer las bases de datos.
Si Notion no está disponible, operará con datos mock sin interrupciones.

### 2. Frontend (Puerto 5173)

```bash
cd frontend
npm install
npm run dev
```

Abrir en el browser: `http://localhost:5173`

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                    React Web Chat UI                         │
│         (Vite + diseño minimalista soft)                     │
└──────────────────────┬───────────────────────────────────────┘
                       │ POST /api/chat
                       │ { paciente_id, mensaje }
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                  Node.js + Express Backend                   │
│                     (Puerto 3001)                            │
└──────────┬──────────────────────────────┬────────────────────┘
           │                              │
           │ Tool Calling                 │ Notion API
           ▼                              ▼
┌──────────────────┐          ┌───────────────────────┐
│ Gemini 2.5 Flash │          │    Notion Database    │
│    (LLM Agent)   │          │ ─ Pacientes/Planes    │
│                  │◄────────►│ ─ Hospitales          │
│ System Prompt    │          │ ─ Copagos/Tarifario   │
│ Tool Schema      │          └───────────────────────┘
└──────────────────┘                    │
                                        │ Fallback si offline
                                        ▼
                              ┌──────────────────────┐
                              │    mockData.js       │
                              │  (datos simulados)   │
                              └──────────────────────┘
```

### Flujo de una Consulta

1. **Usuario** escribe síntomas en el chat.
2. **Backend** agrega el contexto del paciente (ID + plan) y envía al LLM.
3. **Gemini 2.5 Flash** analiza los síntomas con su system prompt clínico.
4. **Gemini** llama a la herramienta `consultar_cobertura_y_hospitales` via Tool Calling.
5. **Backend** ejecuta la herramienta: consulta Notion (o mock) → calcula copagos.
6. **Backend** devuelve el resultado de la herramienta al LLM.
7. **Gemini** genera la respuesta final con especialidad, copago y recomendación de hospital.
8. **Frontend** muestra la respuesta formateada al usuario.

---

## 📁 Estructura del Proyecto

```
Hackiathon/
├── backend/
│   ├── server.js                  # Servidor Express + init
│   ├── routes/
│   │   └── chat.js                # POST /api/chat, GET /pacientes
│   ├── services/
│   │   ├── geminiService.js       # LLM + Tool Calling cycle
│   │   └── notionService.js       # Notion API + fallback
│   ├── utils/
│   │   └── mockData.js            # Datos simulados (3 planes, 3 hospitales)
│   ├── .env                       # Variables de entorno
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Layout principal
│   │   ├── index.css              # Design system completo
│   │   ├── services/
│   │   │   └── api.js             # Cliente HTTP al backend
│   │   └── components/
│   │       ├── ChatWindow.jsx     # Ventana de chat + input
│   │       ├── Message.jsx        # Burbuja de mensaje
│   │       └── PatientSelector.jsx # Selector de paciente
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 🗄️ Base de Datos

### Pacientes / Planes

| ID    | Nombre        | Plan    | Copagos |
|-------|--------------|---------|---------|
| P001  | Ana García   | Básico  | Altos   |
| P002  | Carlos López | Premium | Medios  |
| P003  | María Torres | VIP     | Mínimos |

### Red de Hospitales

| Hospital                     | Nivel    | Especialidades |
|-----------------------------|----------|---------------|
| Hospital Nacional del Seguro | Bajo     | 10            |
| Clínica Metropolitana Central| Medio    | 12            |
| Hospital Elite Médico        | Alto     | 14            |

### Ejemplo de Copago (Traumatología)

| Plan    | Hosp. Bajo | Hosp. Medio | Hosp. Alto |
|---------|-----------|-------------|------------|
| Básico  | $35       | $55         | $80        |
| Premium | $15       | $25         | $40        |
| VIP     | $5        | $10         | $15        |

---

## 🔧 API Endpoints

```
POST   /api/chat             → Chat con el agente
GET    /api/chat/pacientes   → Lista pacientes disponibles
DELETE /api/chat/:id         → Reiniciar historial
GET    /health               → Health check del servidor
```

### Ejemplo de Request

```json
POST /api/chat
{
  "paciente_id": "P001",
  "mensaje": "Me duele mucho la parte baja de la espalda y tengo fiebre"
}
```

### Ejemplo de Response

```json
{
  "reply": "## 👨‍⚕️ Análisis Clínico\n\nBasándome en tus síntomas...",
  "especialidad": "Urología",
  "cobertura": {
    "paciente": "Ana García",
    "plan": "Básico",
    "especialidad": "Urología",
    "opciones": [...],
    "hospital_recomendado": {
      "hospital": "Hospital Nacional del Seguro",
      "copago_usd": 40,
      "nivel_costo": "Bajo"
    }
  }
}
```

---

## 🔮 Migración a MCP Real

La arquitectura está diseñada para migrar fácilmente a un servidor MCP
(Model Context Protocol) real. Actualmente:

```
Gemini Tool Calling → notionService.js (función local)
```

Para migrar a MCP:

1. Crear un servidor MCP en un proceso separado (`mcp-server/`):
   - Expone la herramienta `consultar_cobertura_y_hospitales` como MCP Tool
   - Conecta directamente a Notion, SQL, o cualquier base de datos
   - Gestiona autenticación y caché

2. Actualizar `geminiService.js` para apuntar al servidor MCP:
   - Reemplazar la llamada directa a `notionService` por una llamada HTTP al MCP server
   - El schema de la herramienta no cambia
   - El LLM no nota la diferencia

3. Beneficios de MCP real:
   - El servidor de datos corre independiente del backend
   - Se puede reutilizar con otros LLMs (Claude, GPT-4, etc.)
   - Escalabilidad horizontal
   - Auditoría de herramientas centralizada

```
Gemini → Backend → [MCP Server] → Notion / SQL / APIs externas
```

---

## 🔐 Variables de Entorno

```env
GEMINI_API_KEY=tu_clave_aqui
GEMINI_MODEL=gemini-2.5-flash
NOTION_TOKEN=tu_token_aqui
NOTION_ROOT_PAGE_ID=id_de_la_pagina
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

## 📄 Licencia

MIT — Construido para demostración en Hackathon.
