/**
 * routes/chat.js
 * Endpoint POST /api/chat
 * Orquesta el flujo: mensaje → agente → herramienta → respuesta
 */

const express = require("express");
const router = express.Router();
const { chatConAgente } = require("../services/geminiService");
const { PACIENTES } = require("../utils/mockData");

// Almacén de historial de conversaciones en memoria
// En producción: usar Redis o base de datos
const conversaciones = new Map();

/**
 * POST /api/chat
 * Body: { paciente_id: string, mensaje: string, reset?: boolean }
 * Response: { reply, especialidad, cobertura, historial_length }
 */
router.post("/", async (req, res) => {
  const { paciente_id, mensaje, reset } = req.body;

  // Validaciones
  if (!paciente_id || typeof paciente_id !== "string") {
    return res.status(400).json({ error: "paciente_id es requerido." });
  }
  if (!mensaje || typeof mensaje !== "string" || !mensaje.trim()) {
    return res.status(400).json({ error: "mensaje no puede estar vacío." });
  }

  // Verificar que el paciente existe
  const paciente = PACIENTES[paciente_id];
  if (!paciente) {
    return res.status(404).json({
      error: `Paciente con ID "${paciente_id}" no encontrado.`,
      pacientes_disponibles: Object.keys(PACIENTES),
    });
  }

  // Obtener o inicializar historial de conversación
  const clave = paciente_id;
  if (reset || !conversaciones.has(clave)) {
    conversaciones.set(clave, []);
  }

  const historial = conversaciones.get(clave);

  // Agregar mensaje del usuario al historial
  historial.push({
    role: "user",
    parts: [
      {
        text: `[Paciente ID: ${paciente_id} | Plan: ${paciente.plan}]\n\n${mensaje.trim()}`,
      },
    ],
  });

  try {
    const { reply, especialidad, cobertura } = await chatConAgente(
      paciente_id,
      historial
    );

    // Agregar respuesta del agente al historial
    historial.push({
      role: "model",
      parts: [{ text: reply }],
    });

    // Limitar historial a últimos 20 turnos para evitar context overflow
    if (historial.length > 40) {
      const cortado = historial.splice(0, historial.length - 40);
      console.log(`[Chat] Historial podado: ${cortado.length} mensajes eliminados.`);
    }

    conversaciones.set(clave, historial);

    return res.json({
      reply,
      especialidad,
      cobertura,
      paciente: {
        id: paciente_id,
        nombre: paciente.nombre,
        plan: paciente.plan,
      },
      historial_length: historial.length,
    });
  } catch (err) {
    console.error("[Chat] Error en el agente:", err.message);
    return res.status(500).json({
      error: "Error al procesar la consulta con el agente de IA.",
      detalle: err.message,
    });
  }
});

/**
 * DELETE /api/chat/:paciente_id
 * Reinicia el historial de conversación de un paciente.
 */
router.delete("/:paciente_id", (req, res) => {
  const { paciente_id } = req.params;
  conversaciones.delete(paciente_id);
  return res.json({ message: `Historial de ${paciente_id} reiniciado.` });
});

/**
 * GET /api/chat/pacientes
 * Lista los pacientes disponibles para el selector del frontend.
 */
router.get("/pacientes", (req, res) => {
  return res.json({ pacientes: PACIENTES });
});

module.exports = router;
