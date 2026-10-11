// Enterprise Knowledge Graph & Ontology Definition
export const ONTOLOGY_GRAPH = {
  version: "2.4.0",
  lastUpdated: "2026-10-11",
  domain: "Enterprise Supply Chain & ERP Modernization",
  nodes: [
    { id: "ent-plant-dallas", type: "LegacyEntity", label: "Plant-Dallas", category: "Location" },
    { id: "ent-plant-chicago", type: "LegacyEntity", label: "Plant-Chicago", category: "Location" },
    { id: "ent-plant-atlanta", type: "LegacyEntity", label: "Plant-Atlanta", category: "Location" },
    
    { id: "sap-p1000", type: "SAP_S4HANA_Entity", label: "P1000 (Dallas Precision)", category: "DeliveryPlant", code: "P1000" },
    { id: "sap-p2000", type: "SAP_S4HANA_Entity", label: "P2000 (Chicago Central)", category: "DeliveryPlant", code: "P2000" },
    { id: "sap-p3000", type: "SAP_S4HANA_Entity", label: "P3000 (Atlanta Logistics)", category: "DeliveryPlant", code: "P3000" },

    { id: "mat-pump", type: "MaterialTaxonomy", label: "PUMP Class", category: "Hydraulics", taxCode: "V1" },
    { id: "mat-valve", type: "MaterialTaxonomy", label: "VALVE Class", category: "FlowControl", taxCode: "V1" },
    { id: "mat-bearing", type: "MaterialTaxonomy", label: "BEARING Class", category: "Mechanical", taxCode: "V1" },
    { id: "mat-motor", type: "MaterialTaxonomy", label: "MOTOR Class", category: "Electromechanical", taxCode: "V1" },

    { id: "lakehouse-delta", type: "DatabricksEntity", label: "Unity Catalog Gold", catalog: "retaildata", schema: "default" }
  ],
  relationships: [
    { from: "ent-plant-dallas", to: "sap-p1000", relation: "MAPS_TO_ERP_PLANT", confidence: 0.99 },
    { from: "ent-plant-chicago", to: "sap-p2000", relation: "MAPS_TO_ERP_PLANT", confidence: 0.99 },
    { from: "ent-plant-atlanta", to: "sap-p3000", relation: "MAPS_TO_ERP_PLANT", confidence: 0.98 },
    { from: "sap-p1000", to: "lakehouse-delta", relation: "FEEDS_ANALYTICS_PARTITION" },
    { from: "sap-p2000", to: "lakehouse-delta", relation: "FEEDS_ANALYTICS_PARTITION" }
  ],
  lookupPlant: (rawName) => {
    if (!rawName) return { sapCode: "UNKNOWN", resolved: false };
    const cleaned = String(rawName).trim();
    if (cleaned === "Plant-Dallas" || cleaned.toLowerCase().includes("dallas")) {
      return { sapCode: "P1000", plantName: "Dallas Precision Operations", resolved: true, method: "Ontology Graph Link" };
    }
    if (cleaned === "Plant-Chicago" || cleaned.toLowerCase().includes("chicago")) {
      return { sapCode: "P2000", plantName: "Chicago Central Assembly", resolved: true, method: "Ontology Graph Link" };
    }
    if (cleaned === "Plant-Atlanta" || cleaned.toLowerCase().includes("atlanta")) {
      return { sapCode: "P3000", plantName: "Atlanta Logistics Hub", resolved: true, method: "Ontology Graph Link" };
    }
    if (/^P[1-9]000$/.test(cleaned)) {
      return { sapCode: cleaned, plantName: `Standard Plant ${cleaned}`, resolved: true, method: "Direct S/4HANA Code" };
    }
    return { sapCode: "UNKNOWN", plantName: "Unmapped Location", resolved: false, method: "Unresolved" };
  }
};
