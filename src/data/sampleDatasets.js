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

// -----------------------------------------------------------------------------
// SAP Distinct Table Generators (0IC_C03, MARA, EKKO, EKPO)
// -----------------------------------------------------------------------------

// SAP Material Movements (0IC_C03) - 8,450 records
export const generateSapMovementsRecords = (count = 50) => {
  const movementTypes = ['101', '102', '201', '261', '301', '311'];
  const plants = ['P1000', 'P2000', 'P3000', 'Plant-Dallas'];
  const storageLocs = ['SL01', 'SL02', 'WH10', 'WH20'];
  const materials = ['MAT-1001', 'MAT-1002', 'MAT-1003', 'MAT-1004', 'MAT-1005', 'MAT-1006', 'MAT-1007', 'MAT-1008'];
  const uoms = ['EA', 'KG', 'PC', 'M'];

  const rows = [];
  for (let i = 1; i <= count; i++) {
    const docNo = `5000${189200 + i}`;
    const mvt = movementTypes[(i - 1) % movementTypes.length];
    const mat = materials[(i - 1) % materials.length];
    let plant = plants[(i - 1) % plants.length];
    const sloc = storageLocs[(i - 1) % storageLocs.length];
    let qty = 10 + (i * 7) % 150;
    const uom = uoms[(i - 1) % uoms.length];
    const amount = Math.round(qty * (25 + (i * 13) % 450) * 100) / 100;
    
    // Deterministic anomalies for testing
    if (i === 3 || i === 23) {
      qty = -5; // Negative movement
    } else if (i === 7) {
      plant = 'Plant-Dallas'; // Legacy plant for ontology resolution
    }

    rows.push({
      MBLNR: docNo,
      BWART: mvt,
      MATNR: mat,
      WERKS: plant,
      LGORT: sloc,
      MENGE: qty,
      MEINS: uom,
      DMBTR: amount,
      MJAHR: '2026',
      ZEILE: ((i % 3) + 1) * 10
    });
  }
  return rows;
};

// SAP General Material Master (MARA) - 3,120 records
export const generateSapMaraRecords = (count = 50) => {
  const matTypes = ['ROH', 'HALB', 'FERT', 'DIEN'];
  const matGroups = ['0101', '0104', '0204', '0210', '0309'];
  const uoms = ['EA', 'KG', 'M', 'L'];
  const matNames = [
    { id: 'MAT-1001', gross: 45.2, net: 42.0 },
    { id: 'MAT-1002', gross: 18.5, net: 16.2 },
    { id: 'MAT-1003', gross: 320.0, net: 310.0 },
    { id: 'MAT-1004', gross: 780.0, net: 765.0 },
    { id: 'MAT-1005', gross: 95.0, net: 92.5 },
    { id: 'MAT-1006', gross: 620.0, net: 605.0 },
    { id: 'MAT-1007', gross: 1.25, net: 1.10 },
    { id: 'MAT-1008', gross: 1150.0, net: 1120.0 }
  ];

  const rows = [];
  for (let i = 1; i <= count; i++) {
    const item = matNames[(i - 1) % matNames.length];
    let matnr = i <= matNames.length ? item.id : `MAT-${1000 + i}`;
    const mtart = matTypes[(i - 1) % matTypes.length];
    const matkl = matGroups[(i - 1) % matGroups.length];
    const meins = uoms[(i - 1) % uoms.length];
    let brgew = item.gross;
    let ntgew = item.net;

    if (i === 4) {
      ntgew = brgew + 15.0; // Gross < Net violation
    } else if (i === 9) {
      matnr = ''; // Missing mandatory material number
    }

    rows.push({
      MATNR: matnr,
      MTART: mtart,
      MATKL: matkl,
      MEINS: meins,
      BRGEW: brgew,
      NTGEW: ntgew,
      GEWEI: 'KG',
      CREATED_ON: `2025-0${(i % 9) + 1}-14`
    });
  }
  return rows;
};

// SAP Purchasing Document Header (EKKO) - 640 records
export const generateSapEkkoRecords = (count = 50) => {
  const compCodes = ['1000', '2000', '3000'];
  const docTypes = ['NB', 'UB', 'FO'];
  const vendors = ['V-101', 'V-102', 'V-103', 'V-104', 'V-105', 'V-201', 'V-202'];
  const currencies = ['USD', 'EUR', 'GBP', 'CHF'];

  const rows = [];
  for (let i = 1; i <= count; i++) {
    const ebeln = `45000${10000 + i}`;
    const bukrs = compCodes[(i - 1) % compCodes.length];
    const bsart = docTypes[(i - 1) % docTypes.length];
    let lifnr = vendors[(i - 1) % vendors.length];
    const waers = currencies[(i - 1) % currencies.length];
    const wkurs = waers === 'USD' ? 1.00000 : waers === 'EUR' ? 1.08500 : 1.27000;

    if (i === 5) lifnr = ''; // Missing vendor

    rows.push({
      EBELN: ebeln,
      BUKRS: bukrs,
      BSTYP: 'F',
      BSART: bsart,
      LIFNR: lifnr,
      WAERS: waers,
      BEDAT: `2026-03-${String((i % 25) + 1).padStart(2, '0')}`,
      WKURS: wkurs
    });
  }
  return rows;
};

// SAP Purchasing Document Item (EKPO) - 2,180 records
export const generateSapEkpoRecords = (count = 50) => {
  const materials = ['MAT-1001', 'MAT-1002', 'MAT-1003', 'MAT-1004', 'MAT-1005', 'MAT-1006'];
  const plants = ['P1000', 'P2000', 'P3000'];
  const slocs = ['SL01', 'SL02', 'SL03'];

  const rows = [];
  for (let i = 1; i <= count; i++) {
    const ebeln = `45000${10000 + Math.floor((i - 1) / 3) + 1}`;
    const ebelp = ((i - 1) % 3 + 1) * 10;
    const matnr = materials[(i - 1) % materials.length];
    const plant = plants[(i - 1) % plants.length];
    const sloc = slocs[(i - 1) % slocs.length];
    let menge = 5 + (i * 3) % 45;
    const netpr = 15.0 + (i * 12.5) % 350;

    if (i === 6) menge = -10; // Negative quantity

    rows.push({
      EBELN: ebeln,
      EBELP: ebelp,
      MATNR: matnr,
      MENGE: menge,
      NETPR: Math.round(netpr * 100) / 100,
      PEINH: 1,
      WERKS: plant,
      LGORT: sloc
    });
  }
  return rows;
};

export const getTableCatalog = (engine = 'sap_bw') => {
  if (engine === 'mongodb' || engine === 'mongo') {
    return [
      { name: 'raw_users', rows: '1,840 docs', rowCount: 1840, domain: 'Customer & User Master' },
      { name: 'transactions', rows: '6,120 docs', rowCount: 6120, domain: 'Ledger Transactions' },
      { name: 'customer_profiles', rows: '920 docs', rowCount: 920, domain: 'KYC Customer Profiles' }
    ];
  }
  if (engine === 'postgres' || engine === 'postgresql') {
    return [
      { name: 'users', rows: '2,450 rows', rowCount: 2450, domain: 'User Master' },
      { name: 'orders', rows: '5,820 rows', rowCount: 5820, domain: 'Orders & Settlements' },
      { name: 'audit_logs', rows: '14,290 rows', rowCount: 14290, domain: 'Compliance Audit Logs' }
    ];
  }
  return [
    { name: '0PUR_C01', rows: '1,420 rows', rowCount: 1420, domain: 'Purchasing InfoCube' },
    { name: '0IC_C03', rows: '8,450 rows', rowCount: 8450, domain: 'Material Movements & Stocks' },
    { name: 'BAPI_PO_CREATE1', rows: '1,200 rows', rowCount: 1200, domain: 'S/4HANA PO Staging' },
    { name: 'MARA', rows: '3,120 rows', rowCount: 3120, domain: 'General Material Master' },
    { name: 'EKKO', rows: '640 rows', rowCount: 640, domain: 'Purchasing Document Header' },
    { name: 'EKPO', rows: '2,180 rows', rowCount: 2180, domain: 'Purchasing Document Item' }
  ];
};

export const getTableData = (tableName = '0PUR_C01', engine = 'sap_bw', limit = 50) => {
  const norm = (tableName || '').toUpperCase();
  if (norm.includes('0IC_C03') || norm.includes('INVENTORY') || norm.includes('MOVEMENT')) {
    const all = generateSapMovementsRecords(Math.max(limit, 25));
    return {
      rows: all.slice(0, limit),
      columns: ['MBLNR', 'BWART', 'MATNR', 'WERKS', 'LGORT', 'MENGE', 'MEINS', 'DMBTR'],
      rowCount: 8450,
      rowCountFormatted: '8,450 rows',
      tableName: '0IC_C03'
    };
  }
  if (norm.includes('MARA') || norm.includes('MATERIAL')) {
    const all = generateSapMaraRecords(Math.max(limit, 25));
    return {
      rows: all.slice(0, limit),
      columns: ['MATNR', 'MTART', 'MATKL', 'MEINS', 'BRGEW', 'NTGEW', 'GEWEI', 'CREATED_ON'],
      rowCount: 3120,
      rowCountFormatted: '3,120 rows',
      tableName: 'MARA'
    };
  }
  if (norm.includes('EKKO')) {
    const all = generateSapEkkoRecords(Math.max(limit, 25));
    return {
      rows: all.slice(0, limit),
      columns: ['EBELN', 'BUKRS', 'BSTYP', 'BSART', 'LIFNR', 'WAERS', 'BEDAT', 'WKURS'],
      rowCount: 640,
      rowCountFormatted: '640 rows',
      tableName: 'EKKO'
    };
  }
  if (norm.includes('EKPO')) {
    const all = generateSapEkpoRecords(Math.max(limit, 25));
    return {
      rows: all.slice(0, limit),
      columns: ['EBELN', 'EBELP', 'MATNR', 'MENGE', 'NETPR', 'PEINH', 'WERKS', 'LGORT'],
      rowCount: 2180,
      rowCountFormatted: '2,180 rows',
      tableName: 'EKPO'
    };
  }
  if (norm.includes('BAPI_PO_CREATE1')) {
    const all = generateSapRecords();
    return {
      rows: all.slice(0, limit),
      columns: ['PO_NUMBER', 'ITEM_NO', 'MATERIAL_ID', 'QUANTITY', 'UNIT_PRICE', 'DELIVERY_PLANT', 'VENDOR_ID', 'TOTAL_AMOUNT'],
      rowCount: 1200,
      rowCountFormatted: '1,200 rows',
      tableName: 'BAPI_PO_CREATE1'
    };
  }
  if (norm.includes('USER') || engine === 'postgres' || engine === 'mongodb') {
    const all = generateUserRecords();
    return {
      rows: all.slice(0, limit),
      columns: ['id', 'full_name', 'email', 'role', 'status', 'account_balance'],
      rowCount: 2450,
      rowCountFormatted: '2,450 rows',
      tableName: tableName || 'users'
    };
  }
  // Default to 0PUR_C01
  const all = generateSapRecords();
  return {
    rows: all.slice(0, limit),
    columns: ['PO_NUMBER', 'ITEM_NO', 'MATERIAL_ID', 'QUANTITY', 'UNIT_PRICE', 'DELIVERY_PLANT', 'VENDOR_ID', 'TOTAL_AMOUNT'],
    rowCount: 1420,
    rowCountFormatted: '1,420 rows',
    tableName: '0PUR_C01'
  };
};

