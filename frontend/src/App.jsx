/**
 * App.jsx
 * Componente raíz — Layout de dos paneles: Sidebar + Chat.
 */

import { useState, useEffect } from "react";
import PatientSelector from "./components/PatientSelector";
import ChatWindow from "./components/ChatWindow";
import { obtenerPacientes } from "./services/api";
import "./index.css";

// Datos de pacientes hardcoded como fallback inmediato
const PACIENTES_DEFAULT = {
  P001: { id: "P001", nombre: "Ana García",   plan: "Básico"  },
  P002: { id: "P002", nombre: "Carlos López", plan: "Premium" },
  P003: { id: "P003", nombre: "María Torres", plan: "VIP"     },
};

export default function App() {
  const [pacientes, setPacientes]   = useState(PACIENTES_DEFAULT);
  const [pacienteActivo, setPacienteActivo] = useState(null);
  const [backendOk, setBackendOk]   = useState(null); // null=checking, true=ok, false=error

  // Intentar cargar pacientes desde el backend
  useEffect(() => {
    obtenerPacientes()
      .then((data) => {
        setPacientes(data.pacientes || PACIENTES_DEFAULT);
        setBackendOk(true);
      })
      .catch(() => {
        setBackendOk(false);
      });
  }, []);

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏥</div>
          <div className="sidebar-logo-text">
            <h1>MediBot</h1>
            <p>Estimador de Copago</p>
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* Estado del backend */}
        {backendOk === false && (
          <div style={{
            background: "#FEF3C7",
            border: "1px solid #FCD34D",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "12px",
            color: "#92400E",
            lineHeight: 1.5,
          }}>
            ⚠️ <strong>Servidor offline.</strong> Inicia el backend con{" "}
            <code>npm run dev</code> en la carpeta <code>backend/</code>.
          </div>
        )}

        {/* Selector de pacientes */}
        <PatientSelector
          pacientes={pacientes}
          pacienteActivo={pacienteActivo}
          onSelect={setPacienteActivo}
        />

        <div className="sidebar-divider" />

        {/* Info box */}
        <div className="info-box">
          <strong>💡 ¿Cómo funciona?</strong>
          1. Selecciona un paciente<br />
          2. Describe tus síntomas<br />
          3. El agente IA detecta la especialidad<br />
          4. Consulta tu plan y calcula el copago<br />
          5. Te sugiere el hospital más económico
        </div>

        {/* Planes */}
        <div>
          <p className="sidebar-section-title">Planes de Cobertura</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              { plan: "Básico",  color: "#DBEAFE", text: "#1D4ED8", desc: "Copago estándar" },
              { plan: "Premium", color: "#FEF3C7", text: "#92400E", desc: "Copago reducido" },
              { plan: "VIP",     color: "#EDE9FE", text: "#5B21B6", desc: "Copago mínimo" },
            ].map(({ plan, color, text, desc }) => (
              <div key={plan} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "#F9FAFB",
                borderRadius: "8px",
                border: "1px solid #F3F4F6",
              }}>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>{plan}</span>
                <span style={{
                  fontSize: "11px",
                  background: color,
                  color: text,
                  padding: "2px 8px",
                  borderRadius: "20px",
                  fontWeight: 600,
                }}>
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Chat Area ── */}
      <main className="chat-area">
        <ChatWindow
          key={pacienteActivo?.id}
          paciente={pacienteActivo}
        />
      </main>
    </div>
  );
}
