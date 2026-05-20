/**
 * notionService.js
 * Servicio de integración con Notion API.
 * Lee datos de pacientes, hospitales y copagos desde bases de datos Notion.
 * Si Notion no está disponible, el sistema usa mockData.js como fallback.
 */

require("dotenv").config();
const { Client } = require("@notionhq/client");
const mock = require("../utils/mockData");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// IDs de bases de datos Notion (se inicializan en setupNotionDatabases)
let DB_IDS = {
  pacientes: null,
  hospitales: null,
  copagos: null,
};

/**
 * Verifica si Notion está disponible buscando bases de datos existentes.
 * Si no existen, las crea con datos de ejemplo.
 */
async function initNotion() {
  try {
    const response = await notion.search({
      filter: { property: "object", value: "database" },
    });

    const dbs = response.results;
    for (const db of dbs) {
      const title = db.title?.[0]?.plain_text?.toLowerCase() || "";
      if (title.includes("pacientes"))  DB_IDS.pacientes  = db.id;
      if (title.includes("hospitales")) DB_IDS.hospitales = db.id;
      if (title.includes("copagos"))    DB_IDS.copagos    = db.id;
    }

    if (!DB_IDS.pacientes || !DB_IDS.hospitales || !DB_IDS.copagos) {
      console.log("[Notion] Bases de datos no encontradas. Creando...");
      await crearBaseDeDatos();
    } else {
      console.log("[Notion] ✅ Bases de datos encontradas:", DB_IDS);
    }
    return true;
  } catch (err) {
    console.warn("[Notion] ⚠️  No se pudo conectar. Usando mock data.", err.message);
    return false;
  }
}

/**
 * Crea las 3 bases de datos en Notion y las puebla con datos de ejemplo.
 */
async function crearBaseDeDatos() {
  const rootPageId = process.env.NOTION_ROOT_PAGE_ID;

  // 1. Base de datos de Pacientes
  const dbPacientes = await notion.databases.create({
    parent: { type: "page_id", page_id: rootPageId },
    title: [{ type: "text", text: { content: "Pacientes — Copago Estimador" } }],
    properties: {
      "paciente_id": { title: {} },
      "nombre":      { rich_text: {} },
      "plan_tipo":   { select: { options: [
        { name: "Básico",   color: "blue"   },
        { name: "Premium",  color: "yellow" },
        { name: "VIP",      color: "green"  },
      ]}},
    },
  });
  DB_IDS.pacientes = dbPacientes.id;

  // Insertar pacientes de ejemplo
  for (const [id, p] of Object.entries(mock.PACIENTES)) {
    await notion.pages.create({
      parent: { database_id: DB_IDS.pacientes },
      properties: {
        "paciente_id": { title: [{ text: { content: id } }] },
        "nombre":      { rich_text: [{ text: { content: p.nombre } }] },
        "plan_tipo":   { select: { name: p.plan } },
      },
    });
  }
  console.log("[Notion] ✅ Base de datos Pacientes creada con 3 registros.");

  // 2. Base de datos de Hospitales
  const dbHospitales = await notion.databases.create({
    parent: { type: "page_id", page_id: rootPageId },
    title: [{ type: "text", text: { content: "Hospitales — Copago Estimador" } }],
    properties: {
      "nombre":       { title: {} },
      "nivel_costo":  { select: { options: [
        { name: "Bajo",  color: "green"  },
        { name: "Medio", color: "yellow" },
        { name: "Alto",  color: "red"    },
      ]}},
      "direccion":    { rich_text: {} },
      "telefono":     { rich_text: {} },
    },
  });
  DB_IDS.hospitales = dbHospitales.id;

  for (const h of mock.HOSPITALES) {
    await notion.pages.create({
      parent: { database_id: DB_IDS.hospitales },
      properties: {
        "nombre":      { title: [{ text: { content: h.nombre } }] },
        "nivel_costo": { select: { name: h.nivel_costo } },
        "direccion":   { rich_text: [{ text: { content: h.direccion } }] },
        "telefono":    { rich_text: [{ text: { content: h.telefono } }] },
      },
    });
  }
  console.log("[Notion] ✅ Base de datos Hospitales creada con 3 registros.");
  console.log("[Notion] ℹ️  Base de datos Copagos: usando estructura interna (mock).");
}

/**
 * Obtiene la cobertura del paciente consultando Notion.
 * Si Notion falla, usa el mock data como fallback.
 */
async function getCoberturaYHospitales(paciente_id, especialidad) {
  // Intentar desde Notion primero
  if (DB_IDS.pacientes) {
    try {
      const response = await notion.databases.query({
        database_id: DB_IDS.pacientes,
        filter: {
          property: "paciente_id",
          title: { equals: paciente_id },
        },
      });

      if (response.results.length > 0) {
        const page = response.results[0];
        const plan = page.properties.plan_tipo?.select?.name;
        const nombre = page.properties.nombre?.rich_text?.[0]?.plain_text;

        if (plan) {
          // Usar mock data para el cálculo de copagos (la estructura es la misma)
          const resultado = mock.getHospitalesConCopago(paciente_id, especialidad);
          if (resultado) {
            resultado.paciente = nombre || resultado.paciente;
            resultado.plan = plan;
            resultado.fuente = "Notion";
            return resultado;
          }
        }
      }
    } catch (err) {
      console.warn("[Notion] Error al consultar, usando fallback mock:", err.message);
    }
  }

  // Fallback a mock data
  const resultado = mock.getHospitalesConCopago(paciente_id, especialidad);
  if (resultado) resultado.fuente = "mock";
  return resultado;
}

module.exports = { initNotion, getCoberturaYHospitales };
