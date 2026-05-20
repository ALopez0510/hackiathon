/**
 * mockData.js
 * Datos simulados de la base de datos médica.
 * Actúa como fallback si Notion no está disponible,
 * y como fuente de demostración consistente.
 */

// ─── Pacientes y sus Planes ───────────────────────────────────────────────────
const PACIENTES = {
  P001: { id: "P001", nombre: "Ana García",    plan: "Básico"   },
  P002: { id: "P002", nombre: "Carlos López",  plan: "Premium"  },
  P003: { id: "P003", nombre: "María Torres",  plan: "VIP"      },
};

// ─── Red de Hospitales ────────────────────────────────────────────────────────
const HOSPITALES = [
  {
    id: "H001",
    nombre: "Hospital Nacional del Seguro",
    nivel_costo: "Bajo",
    especialidades: [
      "Medicina General", "Traumatología", "Urología",
      "Cardiología", "Gastroenterología", "Neurología",
      "Dermatología", "Ginecología", "Pediatría", "Oftalmología"
    ],
    direccion: "Av. Central 1200, Ciudad",
    telefono: "+502 2234-5678",
  },
  {
    id: "H002",
    nombre: "Clínica Metropolitana Central",
    nivel_costo: "Medio",
    especialidades: [
      "Medicina General", "Traumatología", "Urología",
      "Cardiología", "Gastroenterología", "Neurología",
      "Dermatología", "Ginecología", "Pediatría", "Oftalmología",
      "Oncología", "Reumatología"
    ],
    direccion: "Boulevard del Reformador 450, Zona 9",
    telefono: "+502 2345-6789",
  },
  {
    id: "H003",
    nombre: "Hospital Elite Médico",
    nivel_costo: "Alto",
    especialidades: [
      "Medicina General", "Traumatología", "Urología",
      "Cardiología", "Gastroenterología", "Neurología",
      "Dermatología", "Ginecología", "Pediatría", "Oftalmología",
      "Oncología", "Reumatología", "Cirugía Bariátrica", "Neurocirugía"
    ],
    direccion: "Vía 5, 4-50, Zona 4 Torre Médica",
    telefono: "+502 2456-7890",
  },
];

// ─── Tarifario de Copagos ─────────────────────────────────────────────────────
// Estructura: COPAGOS[plan][nivel_hospital][especialidad]
// Valores en USD
const COPAGOS = {
  Básico: {
    Bajo:  {
      "Medicina General":    15, "Traumatología":       35,
      "Urología":            40, "Cardiología":         50,
      "Gastroenterología":   40, "Neurología":          50,
      "Dermatología":        30, "Ginecología":         35,
      "Pediatría":           20, "Oftalmología":        30,
      "Oncología":           80, "Reumatología":        45,
    },
    Medio: {
      "Medicina General":    25, "Traumatología":       55,
      "Urología":            60, "Cardiología":         75,
      "Gastroenterología":   60, "Neurología":          75,
      "Dermatología":        45, "Ginecología":         55,
      "Pediatría":           30, "Oftalmología":        45,
      "Oncología":          110, "Reumatología":        65,
    },
    Alto: {
      "Medicina General":    40, "Traumatología":       80,
      "Urología":            90, "Cardiología":        110,
      "Gastroenterología":   90, "Neurología":         110,
      "Dermatología":        65, "Ginecología":         80,
      "Pediatría":           45, "Oftalmología":        65,
      "Oncología":          150, "Reumatología":        95,
    },
  },
  Premium: {
    Bajo: {
      "Medicina General":     5, "Traumatología":       15,
      "Urología":            20, "Cardiología":         25,
      "Gastroenterología":   20, "Neurología":          25,
      "Dermatología":        10, "Ginecología":         15,
      "Pediatría":           10, "Oftalmología":        15,
      "Oncología":           40, "Reumatología":        20,
    },
    Medio: {
      "Medicina General":    10, "Traumatología":       25,
      "Urología":            30, "Cardiología":         35,
      "Gastroenterología":   30, "Neurología":          35,
      "Dermatología":        20, "Ginecología":         25,
      "Pediatría":           15, "Oftalmología":        20,
      "Oncología":           55, "Reumatología":        30,
    },
    Alto: {
      "Medicina General":    20, "Traumatología":       40,
      "Urología":            45, "Cardiología":         55,
      "Gastroenterología":   45, "Neurología":          55,
      "Dermatología":        30, "Ginecología":         40,
      "Pediatría":           25, "Oftalmología":        30,
      "Oncología":           80, "Reumatología":        50,
    },
  },
  VIP: {
    Bajo: {
      "Medicina General":     0, "Traumatología":        5,
      "Urología":             5, "Cardiología":          5,
      "Gastroenterología":    5, "Neurología":           5,
      "Dermatología":         0, "Ginecología":          5,
      "Pediatría":            0, "Oftalmología":         5,
      "Oncología":           10, "Reumatología":         5,
      "Cirugía Bariátrica":  15, "Neurocirugía":        15,
    },
    Medio: {
      "Medicina General":     5, "Traumatología":       10,
      "Urología":            10, "Cardiología":         15,
      "Gastroenterología":   10, "Neurología":          15,
      "Dermatología":         5, "Ginecología":         10,
      "Pediatría":            5, "Oftalmología":        10,
      "Oncología":           20, "Reumatología":        10,
      "Cirugía Bariátrica":  25, "Neurocirugía":        25,
    },
    Alto: {
      "Medicina General":    10, "Traumatología":       15,
      "Urología":            15, "Cardiología":         20,
      "Gastroenterología":   15, "Neurología":          20,
      "Dermatología":        10, "Ginecología":         15,
      "Pediatría":           10, "Oftalmología":        15,
      "Oncología":           30, "Reumatología":        15,
      "Cirugía Bariátrica":  35, "Neurocirugía":        35,
    },
  },
};

// ─── Mapeo de Síntomas a Especialidades ──────────────────────────────────────
// (Referencia para el LLM — no es autoritativa, el LLM decide)
const SINTOMAS_ESPECIALIDADES = {
  "dolor de espalda baja":    ["Traumatología", "Urología"],
  "fiebre con dolor":         ["Medicina General", "Urología"],
  "dolor de pecho":           ["Cardiología", "Medicina General"],
  "problemas de visión":      ["Oftalmología"],
  "dolor abdominal":          ["Gastroenterología", "Medicina General"],
  "dolor de cabeza fuerte":   ["Neurología", "Medicina General"],
  "erupciones en la piel":    ["Dermatología"],
  "problemas menstruales":    ["Ginecología"],
  "tos persistente":          ["Medicina General"],
  "dolor articular":          ["Traumatología", "Reumatología"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPaciente(paciente_id) {
  return PACIENTES[paciente_id] || null;
}

function getHospitalesConCopago(paciente_id, especialidad) {
  const paciente = getPaciente(paciente_id);
  if (!paciente) return null;

  const plan = paciente.plan;
  const resultados = [];

  for (const hospital of HOSPITALES) {
    const tieneEspecialidad = hospital.especialidades.includes(especialidad);
    if (!tieneEspecialidad) continue;

    const copagoPorNivel = COPAGOS[plan]?.[hospital.nivel_costo];
    const copago = copagoPorNivel?.[especialidad];

    resultados.push({
      hospital: hospital.nombre,
      nivel_costo: hospital.nivel_costo,
      direccion: hospital.direccion,
      telefono: hospital.telefono,
      copago_usd: copago !== undefined ? copago : "No disponible",
    });
  }

  // Ordenar por copago (menor primero)
  resultados.sort((a, b) => {
    if (a.copago_usd === "No disponible") return 1;
    if (b.copago_usd === "No disponible") return -1;
    return a.copago_usd - b.copago_usd;
  });

  return {
    paciente: paciente.nombre,
    plan: plan,
    especialidad: especialidad,
    opciones: resultados,
    hospital_recomendado: resultados[0] || null,
  };
}

module.exports = {
  PACIENTES,
  HOSPITALES,
  COPAGOS,
  getPaciente,
  getHospitalesConCopago,
};
