/**
 * components/ChatWindow.jsx
 * Ventana principal del chat: mensajes + input + indicador de escritura.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Message from "./Message";
import { enviarMensaje, reiniciarChat } from "../services/api";

const SYMPTOM_EXAMPLES = [
  "Me duele mucho la parte baja de la espalda y tengo fiebre",
  "Tengo dolor en el pecho y me falta el aire",
  "Llevo 3 días con dolor de cabeza muy fuerte",
  "Me duele el abdomen y tengo náuseas",
  "Tengo una erupción en la piel que pica mucho",
  "Me duelen las articulaciones de las manos",
];

export default function ChatWindow({ paciente }) {
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const messagesEndRef           = useRef(null);
  const textareaRef              = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, loading]);

  // Limpiar chat cuando cambia el paciente
  useEffect(() => {
    setMensajes([]);
    setError(null);
    setInput("");
  }, [paciente?.id]);

  const handleSend = useCallback(async () => {
    const texto = input.trim();
    if (!texto || loading || !paciente) return;

    const msgUsuario = {
      id: Date.now(),
      role: "user",
      content: texto,
      timestamp: new Date(),
    };

    setMensajes((prev) => [...prev, msgUsuario]);
    setInput("");
    setLoading(true);
    setError(null);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const data = await enviarMensaje(paciente.id, texto);
      const msgBot = {
        id: Date.now() + 1,
        role: "bot",
        content: data.reply,
        timestamp: new Date(),
        especialidad: data.especialidad,
        cobertura: data.cobertura,
      };
      setMensajes((prev) => [...prev, msgBot]);
    } catch (err) {
      setError(err.message || "Error al conectar con el agente.");
      // Remover el mensaje del usuario si falló
      setMensajes((prev) => prev.filter((m) => m.id !== msgUsuario.id));
    } finally {
      setLoading(false);
    }
  }, [input, loading, paciente]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = async () => {
    if (!paciente) return;
    try {
      await reiniciarChat(paciente.id);
    } catch (_) {}
    setMensajes([]);
    setError(null);
  };

  const handleExampleClick = (symptom) => {
    setInput(symptom);
    textareaRef.current?.focus();
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const sinPaciente = !paciente;
  const sinMensajes = mensajes.length === 0;

  return (
    <>
      {/* ── Header ── */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="status-dot" />
          <div className="chat-header-title">
            <h2>
              {paciente
                ? `Consulta de ${paciente.nombre}`
                : "Estimador de Copago"}
            </h2>
            <p>
              {paciente
                ? `Plan ${paciente.plan} · ID: ${paciente.id}`
                : "Selecciona un paciente para comenzar"}
            </p>
          </div>
        </div>
        {mensajes.length > 0 && (
          <button
            className="btn-reset"
            onClick={handleReset}
            id="btn-reset-chat"
            title="Reiniciar conversación"
          >
            🔄 Nueva consulta
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="messages-list" id="messages-container">
        {sinPaciente || sinMensajes ? (
          <div className="welcome-state">
            <div className="welcome-icon">🏥</div>
            {sinPaciente ? (
              <>
                <h2>Bienvenido a MediBot</h2>
                <p>
                  Selecciona un paciente en el panel izquierdo para comenzar
                  tu consulta de cobertura médica.
                </p>
              </>
            ) : (
              <>
                <h2>Hola, {paciente.nombre} 👋</h2>
                <p>
                  Describe tus síntomas y te ayudaré a identificar la
                  especialidad médica, tu copago exacto y el hospital más
                  conveniente de tu red.
                </p>
                <div style={{ marginTop: "16px", textAlign: "left", width: "100%", maxWidth: "500px" }}>
                  <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "10px", fontWeight: 500 }}>
                    💡 SÍNTOMAS DE EJEMPLO
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {SYMPTOM_EXAMPLES.map((s, i) => (
                      <button
                        key={i}
                        className="symptom-chip"
                        onClick={() => handleExampleClick(s)}
                        id={`symptom-example-${i}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {mensajes.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="typing-wrapper" id="typing-indicator">
                <div className="msg-avatar bot-avatar">🏥</div>
                <div className="typing-bubble">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                alignSelf: "center",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: "12px",
                padding: "10px 16px",
                color: "#DC2626",
                fontSize: "13px",
              }}>
                ⚠️ {error}
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            className="input-field"
            id="chat-input"
            rows={1}
            placeholder={
              sinPaciente
                ? "Selecciona un paciente para comenzar..."
                : "Describe tus síntomas aquí... (Enter para enviar)"
            }
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={sinPaciente || loading}
          />
          <button
            className="btn-send"
            id="btn-send"
            onClick={handleSend}
            disabled={!input.trim() || sinPaciente || loading}
            title="Enviar mensaje"
          >
            ➤
          </button>
        </div>
        <p className="input-hint">
          Powered by Gemini 2.5 Flash · MCP Architecture · Notion Database
        </p>
      </div>
    </>
  );
}
