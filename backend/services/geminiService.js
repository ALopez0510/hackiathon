/**
 * geminiService.js
 * Agente clínico basado en Gemini 2.5 Flash con Tool Calling.
 *
 * Flujo:
 *  1. Se envía el mensaje del usuario al LLM con el system prompt clínico.
 *  2. Gemini analiza los síntomas y llama a la herramienta "consultar_cobertura_y_hospitales".
 *  3. El backend ejecuta la herramienta (consulta Notion/mock).
 *  4. Se devuelve el resultado al LLM para que genere la respuesta final.
 */

require("dotenv").config();
const axios = require("axios");
const { getCoberturaYHospitales } = require("./notionService");

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${
  process.env.GEMINI_MODEL || "gemini-2.5-flash"
}:generateContent?key=${process.env.GEMINI_API_KEY}`;

// ─── System Prompt Clínico ─────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres MediBot, un asistente virtual de salud especializado en orientación médica y estimación de costos de cobertura de seguro. Eres empático, claro y profesional.

Tu flujo de trabajo es SIEMPRE el siguiente:
1. Escucha los síntomas del paciente con atención.
2. Analiza los síntomas y determina la especialidad médica más apropiada de esta lista EXACTA:
   - Medicina General
   - Traumatología
   - Urología
   - Cardiología
   - Gastroenterología
   - Neurología
   - Dermatología
   - Ginecología
   - Pediatría
   - Oftalmología
   - Oncología
   - Reumatología
   - Cirugía Bariátrica
   - Neurocirugía
3. OBLIGATORIAMENTE llama a la herramienta "consultar_cobertura_y_hospitales" con la especialidad determinada y el paciente_id.
4. Con los datos de la herramienta, responde al paciente de forma clara indicando:
   a) La especialidad médica recomendada y por qué.
   b) El hospital más económico de su red (el recomendado).
   c) El copago exacto en dólares para ese hospital.
   d) Todas las opciones de hospitales disponibles con sus copagos.
5. Siempre termina con un mensaje de apoyo y la recomendación de consultar al médico en persona.

REGLAS IMPORTANTES:
- NUNCA inventes costos. SIEMPRE usa la herramienta para obtener los copagos reales.
- Si el síntoma puede corresponder a múltiples especialidades, elige la más urgente o relevante.
- Responde en español con un tono cálido y profesional.
- Usa emojis médicos sutiles (🏥 💊 👨‍⚕️) para hacer la respuesta más amigable.
- Formatea la respuesta con secciones claras usando markdown.`;

// ─── Tool Schema ───────────────────────────────────────────────────────────────
const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "consultar_cobertura_y_hospitales",
        description:
          "Consulta la base de datos del seguro médico para obtener el copago exacto del paciente según su plan y la especialidad médica requerida. Devuelve todas las opciones de hospitales en la red con sus respectivos copagos, ordenadas de menor a mayor costo.",
        parameters: {
          type: "OBJECT",
          properties: {
            especialidad: {
              type: "STRING",
              description:
                "La especialidad médica determinada a partir de los síntomas. Debe ser exactamente uno de: Medicina General, Traumatología, Urología, Cardiología, Gastroenterología, Neurología, Dermatología, Ginecología, Pediatría, Oftalmología, Oncología, Reumatología, Cirugía Bariátrica, Neurocirugía.",
            },
            paciente_id: {
              type: "STRING",
              description:
                "El ID único del paciente (ej. P001, P002, P003) para consultar su plan de seguro.",
            },
          },
          required: ["especialidad", "paciente_id"],
        },
      },
    ],
  },
];

/**
 * Construye el cuerpo de la request para Gemini.
 */
function buildRequest(historial, systemPrompt) {
  return {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: historial,
    tools: TOOLS,
    tool_config: {
      function_calling_config: { mode: "AUTO" },
    },
    generation_config: {
      temperature: 0.3,
      max_output_tokens: 2048,
    },
  };
}

/**
 * Llama a Gemini y maneja el ciclo completo de Tool Calling.
 * @param {string} paciente_id - ID del paciente
 * @param {Array}  historial   - Array de mensajes { role, parts }
 * @returns {Promise<{reply: string, especialidad: string|null, cobertura: object|null}>}
 */
async function chatConAgente(paciente_id, historial) {
  let currentHistorial = [...historial];
  let especialidadDetectada = null;
  let coberturaData = null;
  let intentos = 0;
  const MAX_INTENTOS = 5;

  while (intentos < MAX_INTENTOS) {
    intentos++;

    const body = buildRequest(currentHistorial, SYSTEM_PROMPT);
    const response = await axios.post(GEMINI_API_URL, body, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    const candidate = response.data.candidates?.[0];
    if (!candidate) throw new Error("Gemini no retornó candidatos.");

    const parts = candidate.content?.parts || [];
    const finishReason = candidate.finishReason;

    // Detectar si hay function calls
    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length > 0) {
      // Agregar respuesta del modelo al historial
      currentHistorial.push({
        role: "model",
        parts: parts,
      });

      // Ejecutar cada herramienta
      const toolResults = [];
      for (const part of functionCalls) {
        const { name, args } = part.functionCall;

        if (name === "consultar_cobertura_y_hospitales") {
          const { especialidad, paciente_id: pid } = args;
          especialidadDetectada = especialidad;

          console.log(`[Gemini Tool] Consultando: especialidad=${especialidad}, paciente=${pid}`);
          const resultado = await getCoberturaYHospitales(pid || paciente_id, especialidad);
          coberturaData = resultado;

          toolResults.push({
            functionResponse: {
              name,
              response: {
                result: resultado || {
                  error: "Paciente no encontrado o especialidad no disponible.",
                },
              },
            },
          });
        }
      }

      // Agregar resultados de herramientas al historial
      currentHistorial.push({
        role: "user",
        parts: toolResults,
      });

      // Continuar el loop para que Gemini genere la respuesta final
      continue;
    }

    // Sin function calls → respuesta final de texto
    const textParts = parts.filter((p) => p.text);
    if (textParts.length > 0) {
      const reply = textParts.map((p) => p.text).join("");
      return { reply, especialidad: especialidadDetectada, cobertura: coberturaData };
    }

    // Si finish_reason es STOP sin texto, error
    if (finishReason === "STOP") {
      throw new Error("Gemini finalizó sin generar texto.");
    }

    throw new Error(`Respuesta inesperada de Gemini. finishReason: ${finishReason}`);
  }

  throw new Error("Se superó el máximo de iteraciones de Tool Calling.");
}

module.exports = { chatConAgente };
