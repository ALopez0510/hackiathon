/**
 * src/services/api.js
 * Servicio de comunicación con el backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Envía un mensaje al agente médico.
 * @param {string} paciente_id
 * @param {string} mensaje
 * @param {boolean} reset - Si true, reinicia el historial de conversación
 */
export async function enviarMensaje(paciente_id, mensaje, reset = false) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paciente_id, mensaje, reset }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Error HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Obtiene la lista de pacientes disponibles.
 */
export async function obtenerPacientes() {
  const response = await fetch(`${API_BASE_URL}/api/chat/pacientes`);
  if (!response.ok) throw new Error("No se pudo obtener la lista de pacientes.");
  return response.json();
}

/**
 * Reinicia el historial de conversación.
 */
export async function reiniciarChat(paciente_id) {
  const response = await fetch(`${API_BASE_URL}/api/chat/${paciente_id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("No se pudo reiniciar el chat.");
  return response.json();
}
