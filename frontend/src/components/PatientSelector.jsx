/**
 * components/PatientSelector.jsx
 * Selector de paciente en la barra lateral.
 */

const PLANES_INFO = {
  Básico:  { emoji: "🔵", badge: "basico",  label: "Plan Básico",  icon: "👤" },
  Premium: { emoji: "🟡", badge: "premium", label: "Plan Premium", icon: "⭐" },
  VIP:     { emoji: "🟣", badge: "vip",     label: "Plan VIP",     icon: "💎" },
};

export default function PatientSelector({ pacientes, pacienteActivo, onSelect }) {
  return (
    <div>
      <p className="sidebar-section-title">Seleccionar Paciente</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {Object.values(pacientes).map((p) => {
          const info = PLANES_INFO[p.plan] || PLANES_INFO["Básico"];
          const isActive = pacienteActivo?.id === p.id;
          return (
            <div
              key={p.id}
              className={`patient-card plan-${info.badge} ${isActive ? "active" : ""}`}
              onClick={() => onSelect(p)}
              role="button"
              aria-pressed={isActive}
              id={`patient-card-${p.id}`}
            >
              <div className="patient-avatar">{info.icon}</div>
              <div className="patient-info">
                <h3>{p.nombre}</h3>
                <p style={{ fontSize: "11px", color: "#9CA3AF" }}>{p.id}</p>
                <span className={`plan-badge ${info.badge}`}>{info.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
