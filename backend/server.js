/**
 * server.js
 * Punto de entrada del backend.
 * Express + CORS + rutas + inicialización de Notion.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initNotion } = require("./services/notionService");
const chatRouter = require("./routes/chat");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middlewares ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    servicio: "Estimador Agéntico de Copago",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ─── Rutas ─────────────────────────────────────────────────────────────────────
app.use("/api/chat", chatRouter);

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Server Error]", err.stack);
  res.status(500).json({ error: "Error interno del servidor." });
});

// ─── Inicialización ────────────────────────────────────────────────────────────
async function iniciar() {
  console.log("\n🏥 Estimador Agéntico de Copago y Cobertura");
  console.log("━".repeat(48));

  // Intentar conectar con Notion (no bloquea si falla)
  console.log("🔌 Conectando con Notion...");
  const notionOk = await initNotion();
  console.log(notionOk ? "✅ Notion conectado." : "⚠️  Usando datos mock.");

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`💬 Chat API: POST http://localhost:${PORT}/api/chat`);
    console.log("━".repeat(48));
    console.log("✨ Listo para recibir consultas médicas.\n");
  });
}

iniciar().catch((err) => {
  console.error("❌ Error fatal al iniciar:", err);
  process.exit(1);
});
