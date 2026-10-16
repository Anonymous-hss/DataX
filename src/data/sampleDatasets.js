// Preloaded Enterprise Datasets (Simulating SAP BW Extractor Extracts & CRM Data)

const generateSapRecords = () => {
  const plants = ['P1000', 'P2000', 'P3000'];
  const vendors = [
    { id: 'VEND-1001', name: 'Apex Industrial Supply Corp' },
    { id: 'VEND-1002', name: 'Precision Bearings & Motion Ltd' },
    { id: 'VEND-1003', name: 'Vortex Sealing Systems' },
    { id: 'VEND-1004', name: 'Titan Electric Drives' },
    { id: 'VEND-1005', name: 'OmniFlex Power Transmissions' },
    { id: 'VEND-1006', name: 'AeroMotion Controls' },
  ];
  const materials = [
    { id: 'MAT-PUMP-101', desc: 'Industrial High-Pressure Centrifugal Pump', price: 280.0 },
    { id: 'MAT-VALVE-202', desc: 'Cryogenic High-Pressure Butterfly Valve', price: 110.0 },
    { id: 'MAT-BEARING-303', desc: 'Heavy-Duty Spherical Roller Bearing', price: 45.0 },
    { id: 'MAT-GASKET-404', desc: 'Fluoroelastomer Flange Seal Gasket', price: 8.5 },
    { id: 'MAT-MOTOR-505', desc: 'Three-Phase Induction Motor 45kW', price: 850.0 },
    { id: 'MAT-SENSOR-606', desc: 'Wireless Vibration & Temp Sensor', price: 135.0 },
    { id: 'MAT-COUPLING-707', desc: 'Flexible Disc Pack Shaft Coupling', price: 95.0 },
    { id: 'MAT-ACTUATOR-808', desc: 'Pneumatic Quarter-Turn Actuator', price: 320.0 }
  ];

  const list = [];
  for (let i = 1; i <= 50; i++) {
    const mat = materials[(i - 1) % materials.length];
    const v = vendors[(i - 1) % vendors.length];
    const poNum = `45000${100 + Math.floor((i - 1) / 3)}`;
    let lineItem = ((i - 1) % 3 + 1) * 10;
    let qty = 5 + (i * 3) % 40;
    let unitPrice = mat.price;
    let total = Math.round(qty * unitPrice * 100) / 100;
    let vendorId = v.id;
    let vendorName = v.name;
    let deliveryPlant = plants[(i - 1) % plants.length];
    let anomaly = null;

    // Specific deterministic anomalies for rules testing
    if (i === 4 || i === 24 || i === 44) {
      // Rule R1: Negative Quantity
      qty = -1 * qty;
      total = Math.round(qty * unitPrice * 100) / 100;
      anomaly = 'Negative Quantity Violation (QUANTITY < 0)';
    } else if (i === 5 || i === 20 || i === 35 || i === 48) {
      // Rule R2: Total Amount Calculation Error (Auto-remediable)
      total = Math.round((total + 999.50) * 100) / 100;
      anomaly = 'Calculation Inconsistency: Amount mismatch';
    } else if (i === 6) {
      // Rule R3: Missing Vendor
      vendorId = '';
      vendorName = '';
      anomaly = 'Missing Mandatory Vendor Code';
    } else if (i === 22) {
      // Rule R3: Lowercase / untrimmed Vendor (Auto-remediable)
      vendorId = ' vend-1002 ';
      anomaly = 'Untrimmed Vendor Code';
    } else if (i === 8 || i === 18 || i === 32 || i === 42) {
      // Rule R4: Legacy plant names (Auto-remediable via Ontology Graph)
      const legacyPlants = ['Plant-Dallas', 'Plant-Chicago', 'Plant-Atlanta', 'Plant-Dallas'];
      deliveryPlant = legacyPlants[((i / 8) | 0) % legacyPlants.length];
      anomaly = `Legacy Plant Name (${deliveryPlant}) -> Resolvable via Ontology Graph`;
    } else if (i === 15) {
      // Rule R5: Non-sequential line item
      lineItem = 7;
      anomaly = 'Non-sequential Line Item Number (not a multiple of 10)';
    }

    list.push({
      id: i,
      PO_NUMBER: poNum,
      LINE_ITEM: lineItem,
      ITEM_NO: lineItem,
      MATERIAL_ID: mat.id,
      MATERIAL_DESC: mat.desc,
      QUANTITY: qty,
      UNIT_OF_MEASURE: 'EA',
      UNIT_PRICE: unitPrice,
      TOTAL_AMOUNT: total,
      VENDOR_ID: vendorId,
      VENDOR_NAME: vendorName,
      DELIVERY_PLANT: deliveryPlant,
      STORAGE_LOC: 'SL01',
      POSTING_DATE: '2026-03-18',
      SAP_BW_INFOCUBE: '0PUR_C01',
      ANOMALY_FLAG: anomaly
    });
  }
  return list;
};

export const SAP_BW_PROCUREMENT_DATA = generateSapRecords();

export const SAP_BW_INVENTORY_DATA = [
  {
    id: 1,
    SKU: "PUMP-A10",
    LOCATION: "Plant-Dallas",
    CURRENT_STOCK: 15,
    IN_TRANSIT: 0,
    AVG_DAILY_DEMAND: 18.0,
    DEMAND_STD_DEV: 5.5,
    LEAD_TIME_DAYS: 12,
    LEAD_TIME_STD_DEV: 2.5,
    UNIT_COST: 280.00,
    SAFETY_STOCK_REQ: 64,
    REORDER_POINT: 280
  },
  {
    id: 2,
    SKU: "VALVE-B22",
    LOCATION: "Plant-Dallas",
    CURRENT_STOCK: 45,
    IN_TRANSIT: 20,
    AVG_DAILY_DEMAND: 25.0,
    DEMAND_STD_DEV: 6.0,
    LEAD_TIME_DAYS: 8,
    LEAD_TIME_STD_DEV: 1.5,
    UNIT_COST: 110.00,
    SAFETY_STOCK_REQ: 48,
    REORDER_POINT: 248
  },
  {
    id: 3,
    SKU: "MOTOR-C30",
    LOCATION: "Plant-Chicago",
    CURRENT_STOCK: 950,
    IN_TRANSIT: 0,
    AVG_DAILY_DEMAND: 20.0,
    DEMAND_STD_DEV: 4.0,
    LEAD_TIME_DAYS: 6,
    LEAD_TIME_STD_DEV: 0.8,
    UNIT_COST: 65.00,
    SAFETY_STOCK_REQ: 32,
    REORDER_POINT: 152
  },
  {
    id: 4,
    SKU: "GASKET-D41",
    LOCATION: "Plant-Chicago",
    CURRENT_STOCK: 320,
    IN_TRANSIT: 0,
    AVG_DAILY_DEMAND: 40.0,
    DEMAND_STD_DEV: 8.0,
    LEAD_TIME_DAYS: 5,
    LEAD_TIME_STD_DEV: 1.0,
    UNIT_COST: 8.00,
    SAFETY_STOCK_REQ: 58,
    REORDER_POINT: 258
  },
  {
    id: 5,
    SKU: "BEARING-E55",
    LOCATION: "Plant-Atlanta",
    CURRENT_STOCK: 60,
    IN_TRANSIT: 0,
    AVG_DAILY_DEMAND: 12.0,
    DEMAND_STD_DEV: 3.0,
    LEAD_TIME_DAYS: 10,
    LEAD_TIME_STD_DEV: 2.0,
    UNIT_COST: 45.00,
    SAFETY_STOCK_REQ: 30,
    REORDER_POINT: 150
  }
];

const generateUserRecords = () => {
  const roles = ['admin', 'analyst', 'manager', 'viewer'];
  const firstNames = ['Sarah', 'Mark', 'Marcus', 'Elena', 'David', 'Aisha', 'Alexander', 'Carlos', 'Emily', 'Tariq'];
  const lastNames = ['Jenkins', 'Lee', 'Vance', 'Rostova', 'Kim', 'Patel', 'Hayes', 'Rivera', 'Watson', 'Mansoor'];
  
  const list = [];
  for (let i = 1; i <= 50; i++) {
    const fn = firstNames[(i - 1) % firstNames.length];
    const ln = lastNames[(i - 1) % lastNames.length];
    let uid = `usr_${100 + i}`;
    let fullName = `${fn} ${ln}`;
    let email = `${fn.toLowerCase()}.${ln.toLowerCase()}@acme.com`;
    let role = roles[(i - 1) % roles.length];
    let status = (i % 7 === 0) ? 'inactive' : 'active';
    let balance = Math.round((500 + (i * 123.45) % 4000) * 100) / 100;

    // Specific deterministic anomalies for rules testing
    if (i === 2 || i === 25 || i === 42) {
      // Rule 1: Malformed email
      email = `invalid.user${i}@bad_domain`;
    } else if (i === 4 || i === 30) {
      // Rule 1: Email leading/trailing symbols (Auto-remediable)
      email = `-${fn.toLowerCase()}.${ln.toLowerCase()}@ACME.com-`;
    } else if (i === 6 || i === 38) {
      // Rule 2: Missing Full Name
      fullName = '';
    } else if (i === 7 || i === 35) {
      // Rule 3: Unauthorized role
      role = 'god_mode';
    } else if (i === 12 || i === 28) {
      // Rule 3: Minor casing/syntax in role (Auto-remediable)
      role = 'Admin*';
    } else if (i === 8 || i === 32) {
      // Rule 4: Disallowed status (Auto-remediable to inactive)
      status = 'pending_review';
    } else if (i === 9 || i === 22 || i === 45) {
      // Rule 6: Negative balance (Auto-remediable by sign inversion)
      balance = -1 * balance;
    } else if (i === 15) {
      // Rule 5: Duplicate ID
      uid = 'usr_105';
    }

    list.push({
      id: uid,
      full_name: fullName,
      email: email,
      role: role,
      status: status,
      account_balance: balance,
      created_at: `2026-0${1 + (i % 3)}-${10 + (i % 18)}T09:00:00Z`
    });
  }
  return list;
};

export const USER_MASTER_DATA = generateUserRecords();
