"""
DataX SAP Dataset Generator & Ontology Knowledge Graph
Generates realistic dynamic enterprise datasets for SAP BW, S/4HANA, MARA, EKKO, EKPO.
"""

import time
import random
from typing import Dict, List, Any, Tuple

ONTOLOGY_GRAPH = {
    "entities": {
        "Plant-Dallas": {"sap_code": "P1000", "region": "US-South", "name": "Dallas Precision Operations"},
        "Plant-Chicago": {"sap_code": "P2000", "region": "US-Midwest", "name": "Chicago Central Assembly"},
        "Plant-Atlanta": {"sap_code": "P3000", "region": "US-East", "name": "Atlanta Logistics Hub"},
        "Plant-Houston": {"sap_code": "P1000", "region": "US-South", "name": "Houston Precision Operations"},
        "Plant-Detroit": {"sap_code": "P2000", "region": "US-Midwest", "name": "Detroit Central Assembly"}
    },
    "taxonomies": {
        "MaterialClasses": ["RAW_POLYMER", "MACHINED_ALLOY", "SEMICONDUCTOR_CHIP", "PACKAGING"],
        "PaymentTerms": ["NET30", "NET60", "2/10_NET30", "IMMEDIATE"]
    }
}


def generate_sap_purchasing_records(count=1420) -> List[Dict[str, Any]]:
    rng = random.Random(time.time_ns())

    materials = [
        ("MAT-1001", "Titanium Turbine Casing", 450.00),
        ("MAT-1002", "Precision Ball Bearing 6205", 18.50),
        ("MAT-1003", "Hydraulic Actuator Cyl-8", 320.00),
        ("MAT-1004", "Industrial Servo Motor 5kW", 780.00),
        ("MAT-1005", "Carbon Fiber Composite Sheet", 95.00),
        ("MAT-1006", "High-Torque Gearbox 10:1", 620.00),
        ("MAT-1007", "Stainless Hex Bolt M12x50", 1.25),
        ("MAT-1008", "Electronic Control Unit ECU-v2", 1150.00),
        ("MAT-1009", "Pneumatic Solenoid Valve 24V", 64.00),
        ("MAT-1010", "Optical Inspection Sensor IR", 210.00),
        ("MAT-1011", "Cast Iron Flange 150lb", 42.00),
        ("MAT-1012", "Copper Busbar 1000A", 135.00)
    ]
    valid_vendors = ["V-101", "V-102", "V-103", "V-104", "V-105", "V-201", "V-202", "V-301", "V-302"]
    legacy_plants = ["Plant-Dallas", "Plant-Chicago", "Plant-Atlanta", "Plant-Houston", "Plant-Detroit"]
    authorized_plants = ["P1000", "P2000", "P3000"]
    unauthorized_plants = ["P9999", "PLANT_UNKNOWN", "EXT_LOGISTICS_99"]

    rows = []
    po_base = rng.randint(4500010000, 4500990000)

    for i in range(1, count + 1):
        po_num = f"PO-{po_base + i}"
        item_no = (i % 5 + 1) * 10
        mat_id, mat_desc, unit_price = rng.choice(materials)
        roll = rng.random()

        if roll < 0.12:
            plant = rng.choice(legacy_plants)
            qty = rng.randint(5, 50)
            vendor = rng.choice(valid_vendors)
            total = round(qty * unit_price, 2)
        elif roll < 0.16:
            plant = rng.choice(authorized_plants)
            qty = rng.choice([-20, -10, -5, -1, 0])
            vendor = rng.choice(valid_vendors)
            total = round(qty * unit_price, 2)
        elif roll < 0.20:
            plant = rng.choice(authorized_plants)
            qty = rng.randint(10, 40)
            vendor = rng.choice(valid_vendors)
            discrepancy = rng.choice([-150.00, -75.50, 120.00, 250.00, 85.00])
            total = round((qty * unit_price) + discrepancy, 2)
        elif roll < 0.24:
            plant = rng.choice(authorized_plants)
            qty = rng.randint(5, 30)
            vendor = rng.choice(["", "   ", "UNKNOWN"])
            total = round(qty * unit_price, 2)
        elif roll < 0.27:
            plant = rng.choice(unauthorized_plants)
            qty = rng.randint(5, 25)
            vendor = rng.choice(valid_vendors)
            total = round(qty * unit_price, 2)
        elif roll < 0.36:
            plant = rng.choice(authorized_plants).lower() + " "
            qty = rng.randint(10, 60)
            vendor = f"  {rng.choice(valid_vendors).lower()}  "
            total = round(qty * unit_price, 2)
        else:
            plant = rng.choice(authorized_plants)
            qty = rng.randint(10, 100)
            vendor = rng.choice(valid_vendors)
            total = round(qty * unit_price, 2)

        rows.append({
            "PO_NUMBER": po_num,
            "ITEM_NO": item_no,
            "MATERIAL_ID": mat_id,
            "QUANTITY": qty,
            "UNIT_PRICE": unit_price,
            "DELIVERY_PLANT": plant,
            "VENDOR_ID": vendor,
            "TOTAL_AMOUNT": total
        })
    return rows


def generate_sap_movements_records(count=50) -> List[Dict[str, Any]]:
    movementTypes = ['101', '102', '201', '261', '301', '311']
    plants = ['P1000', 'P2000', 'P3000', 'Plant-Dallas']
    storageLocs = ['SL01', 'SL02', 'WH10', 'WH20']
    materials = ['MAT-1001', 'MAT-1002', 'MAT-1003', 'MAT-1004', 'MAT-1005', 'MAT-1006', 'MAT-1007', 'MAT-1008']
    uoms = ['EA', 'KG', 'PC', 'M']

    rows = []
    for i in range(1, count + 1):
        docNo = f"5000{189200 + i}"
        mvt = movementTypes[(i - 1) % len(movementTypes)]
        mat = materials[(i - 1) % len(materials)]
        plant = plants[(i - 1) % len(plants)]
        sloc = storageLocs[(i - 1) % len(storageLocs)]
        qty = 10 + (i * 7) % 150
        uom = uoms[(i - 1) % len(uoms)]
        amount = round(qty * (25 + (i * 13) % 450), 2)
        if i == 3:
            qty = -5
        rows.append({
            "MBLNR": docNo,
            "BWART": mvt,
            "MATNR": mat,
            "WERKS": plant,
            "LGORT": sloc,
            "MENGE": qty,
            "MEINS": uom,
            "DMBTR": amount,
            "MJAHR": "2026",
            "ZEILE": ((i % 3) + 1) * 10
        })
    return rows


def generate_sap_mara_records(count=50) -> List[Dict[str, Any]]:
    matTypes = ['ROH', 'HALB', 'FERT', 'DIEN']
    matGroups = ['0101', '0104', '0204', '0210', '0309']
    uoms = ['EA', 'KG', 'M', 'L']
    matNames = [
        ("MAT-1001", 45.2, 42.0),
        ("MAT-1002", 18.5, 16.2),
        ("MAT-1003", 320.0, 310.0),
        ("MAT-1004", 780.0, 765.0),
        ("MAT-1005", 95.0, 92.5),
        ("MAT-1006", 620.0, 605.0),
        ("MAT-1007", 1.25, 1.10),
        ("MAT-1008", 1150.0, 1120.0)
    ]

    rows = []
    for i in range(1, count + 1):
        item = matNames[(i - 1) % len(matNames)]
        matnr = item[0] if i <= len(matNames) else f"MAT-{1000 + i}"
        mtart = matTypes[(i - 1) % len(matTypes)]
        matkl = matGroups[(i - 1) % len(matGroups)]
        meins = uoms[(i - 1) % len(uoms)]
        brgew = item[1]
        ntgew = item[2]
        if i == 4:
            ntgew = brgew + 15.0
        rows.append({
            "MATNR": matnr,
            "MTART": mtart,
            "MATKL": matkl,
            "MEINS": meins,
            "BRGEW": brgew,
            "NTGEW": ntgew,
            "GEWEI": "KG",
            "CREATED_ON": f"2025-0{(i % 9) + 1}-14"
        })
    return rows


def generate_sap_ekko_records(count=50) -> List[Dict[str, Any]]:
    compCodes = ['1000', '2000', '3000']
    docTypes = ['NB', 'UB', 'FO']
    vendors = ['V-101', 'V-102', 'V-103', 'V-104', 'V-105', 'V-201', 'V-202']
    currencies = ['USD', 'EUR', 'GBP', 'CHF']

    rows = []
    for i in range(1, count + 1):
        ebeln = f"45000{10000 + i}"
        bukrs = compCodes[(i - 1) % len(compCodes)]
        bsart = docTypes[(i - 1) % len(docTypes)]
        lifnr = vendors[(i - 1) % len(vendors)]
        waers = currencies[(i - 1) % len(currencies)]
        wkurs = 1.00000 if waers == 'USD' else 1.08500 if waers == 'EUR' else 1.27000
        if i == 5:
            lifnr = ""
        rows.append({
            "EBELN": ebeln,
            "BUKRS": bukrs,
            "BSTYP": "F",
            "BSART": bsart,
            "LIFNR": lifnr,
            "WAERS": waers,
            "BEDAT": f"2026-03-{str((i % 25) + 1).zfill(2)}",
            "WKURS": wkurs
        })
    return rows


def generate_sap_ekpo_records(count=50) -> List[Dict[str, Any]]:
    materials = ['MAT-1001', 'MAT-1002', 'MAT-1003', 'MAT-1004', 'MAT-1005', 'MAT-1006']
    plants = ['P1000', 'P2000', 'P3000']
    slocs = ['SL01', 'SL02', 'SL03']

    rows = []
    for i in range(1, count + 1):
        ebeln = f"45000{10000 + (i - 1) // 3 + 1}"
        ebelp = ((i - 1) % 3 + 1) * 10
        matnr = materials[(i - 1) % len(materials)]
        plant = plants[(i - 1) % len(plants)]
        sloc = slocs[(i - 1) % len(slocs)]
        menge = 5 + (i * 3) % 45
        netpr = round(15.0 + (i * 12.5) % 350, 2)
        if i == 6:
            menge = -10
        rows.append({
            "EBELN": ebeln,
            "EBELP": ebelp,
            "MATNR": matnr,
            "MENGE": menge,
            "NETPR": netpr,
            "PEINH": 1,
            "WERKS": plant,
            "LGORT": sloc
        })
    return rows


def get_sap_table_sample(table_name: str, limit: int = 25) -> Tuple[List[Dict[str, Any]], List[str], int]:
    t = (table_name or "").upper()
    if "0IC_C03" in t or "INVENTORY" in t or "MOVEMENT" in t:
        rows = generate_sap_movements_records(count=limit)
        columns = ["MBLNR", "BWART", "MATNR", "WERKS", "LGORT", "MENGE", "MEINS", "DMBTR"]
        total = 8450
    elif "MARA" in t or "MATERIAL" in t:
        rows = generate_sap_mara_records(count=limit)
        columns = ["MATNR", "MTART", "MATKL", "MEINS", "BRGEW", "NTGEW", "GEWEI", "CREATED_ON"]
        total = 3120
    elif "EKKO" in t:
        rows = generate_sap_ekko_records(count=limit)
        columns = ["EBELN", "BUKRS", "BSTYP", "BSART", "LIFNR", "WAERS", "BEDAT", "WKURS"]
        total = 640
    elif "EKPO" in t:
        rows = generate_sap_ekpo_records(count=limit)
        columns = ["EBELN", "EBELP", "MATNR", "MENGE", "NETPR", "PEINH", "WERKS", "LGORT"]
        total = 2180
    elif "BAPI" in t:
        rows = generate_sap_purchasing_records(count=limit)
        columns = ["PO_NUMBER", "ITEM_NO", "MATERIAL_ID", "QUANTITY", "UNIT_PRICE", "DELIVERY_PLANT", "VENDOR_ID", "TOTAL_AMOUNT"]
        total = 1200
    else:
        rows = generate_sap_purchasing_records(count=limit)
        columns = ["PO_NUMBER", "ITEM_NO", "MATERIAL_ID", "QUANTITY", "UNIT_PRICE", "DELIVERY_PLANT", "VENDOR_ID", "TOTAL_AMOUNT"]
        total = 1420
    return rows, columns, total


DOMAIN_PACKS = [
    {
        "id": "sap_bw_s4hana",
        "title": "SAP BW ➔ S/4HANA Procurement & Core Writeback",
        "category": "ERP Modernization",
        "badge": "SAP Certified Ontology",
        "description": "Extract raw InfoCube 0PUR_C01 purchasing lines, resolve legacy plant codes through ontology knowledge graph, enforce budget & quantity bounds, and stage BAPI_PO_CREATE1 payloads with Delta Lake gold replication.",
        "source": {
            "title": "SAP - BW Extract",
            "subtitle": "InfoCube 0PUR_C01",
            "engine": "sap_bw",
            "sampleTable": "0PUR_C01",
            "columns": ["PO_NUMBER", "ITEM_NO", "MATERIAL_ID", "QUANTITY", "UNIT_PRICE", "DELIVERY_PLANT", "VENDOR_ID", "TOTAL_AMOUNT"]
        },
        "target1": {
            "title": "S/4 HANA Clean Core",
            "subtitle": "BAPI_PO_CREATE1 Writeback",
            "engine": "s4_hana",
            "table": "staged_purchase_orders"
        },
        "target2": {
            "title": "Databricks Lakehouse",
            "subtitle": "Unity Catalog Gold Tier",
            "engine": "databricks",
            "table": "retaildata.default.sap_bw_modernized_gold"
        },
        "prebuiltRules": [
            {"id": "r_sap_1", "name": "Positive Line Quantity", "column": "QUANTITY", "check_type": "RANGE_BOUND", "condition": "QUANTITY > 0", "severity": "critical", "description": "Reject negative or zero line item quantities"},
            {"id": "r_sap_2", "name": "Calculation Equality", "column": "TOTAL_AMOUNT", "check_type": "FORMULA_MATCH", "condition": "TOTAL_AMOUNT == QUANTITY * UNIT_PRICE", "severity": "critical", "description": "Ensure line total equals quantity times unit price within $0.05"},
            {"id": "r_sap_3", "name": "Mandatory Vendor ID", "column": "VENDOR_ID", "check_type": "NOT_NULL", "condition": "LENGTH(TRIM(VENDOR_ID)) > 0", "severity": "critical", "description": "Vendor identifier must exist for ERP posting"},
            {"id": "r_sap_4", "name": "Authorized S/4HANA Plant", "column": "DELIVERY_PLANT", "check_type": "ENUM_SET", "condition": "DELIVERY_PLANT IN ('P1000', 'P2000', 'P3000')", "severity": "warning", "description": "Enforce approved plant codes resolved by ontology"}
        ]
    },
    {
        "id": "customer_master_reconciliation",
        "title": "Customer Master & Identity Harmonization",
        "category": "Customer 360",
        "badge": "MongoDB ➔ Neon DB ➔ Replica",
        "description": "Extract user and customer profiles from MongoDB Atlas / NoSQL, apply strict RFC-5322 email syntax validation, RBAC allowed domain verification, non-negative balance checks, and stage clean records to PostgreSQL with secondary analytics replication.",
        "source": {
            "title": "MongoDB Atlas Source",
            "subtitle": "datax_staging.raw_users",
            "engine": "mongodb",
            "sampleTable": "raw_users",
            "columns": ["id", "full_name", "email", "role", "status", "account_balance", "created_at"]
        },
        "target1": {
            "title": "Neon DB (PostgreSQL)",
            "subtitle": "validated_users",
            "engine": "postgres",
            "table": "validated_users"
        },
        "target2": {
            "title": "Secondary Reconciled Replica",
            "subtitle": "analytics_customer_gold",
            "engine": "postgres",
            "table": "analytics_customer_gold"
        },
        "prebuiltRules": [
            {"id": "r_cust_1", "name": "Email RFC-5322 Syntax", "column": "email", "check_type": "REGEX_FORMAT", "condition": "REGEX_MATCH(email, '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$')", "severity": "critical", "description": "Enforce valid RFC email syntax, reject nulls or missing @"},
            {"id": "r_cust_2", "name": "Non-Negative Balance Bound", "column": "account_balance", "check_type": "RANGE_BOUND", "condition": "account_balance >= 0.00", "severity": "critical", "description": "Divert accounts with debt or negative balances to quarantine"},
            {"id": "r_cust_3", "name": "Mandatory Full Name", "column": "full_name", "check_type": "NOT_NULL", "condition": "LENGTH(TRIM(full_name)) > 1", "severity": "critical", "description": "Full name cannot be blank or whitespace-only"},
            {"id": "r_cust_4", "name": "Authorized RBAC Role", "column": "role", "check_type": "ENUM_SET", "condition": "role IN ('admin', 'analyst', 'operator', 'viewer')", "severity": "warning", "description": "Ensure role conforms to permitted security domain"},
            {"id": "r_cust_5", "name": "Unique Customer Identifier", "column": "id", "check_type": "UNIQUE", "condition": "COUNT(id) == 1", "severity": "critical", "description": "Reject duplicate primary keys across batch"},
            {"id": "r_cust_6", "name": "Unique Email Address", "column": "email", "check_type": "UNIQUE", "condition": "COUNT(email) == 1", "severity": "critical", "description": "Prevent duplicate customer accounts on same email"}
        ]
    },
    {
        "id": "financial_gl_ledger",
        "title": "Financial General Ledger & AP Compliance",
        "category": "Finance & Audit",
        "badge": "SOX & GAAP Compliant",
        "description": "Audit general ledger and AP entries across disparate legacy systems, guarantee zero imbalance, verify ISO currency standards, and dual-dispatch approved entries to Financial ERP and audit warehouse.",
        "source": {
            "title": "PostgreSQL Staging Ledger",
            "subtitle": "raw_gl_entries",
            "engine": "postgres",
            "sampleTable": "raw_gl_entries",
            "columns": ["ENTRY_ID", "JOURNAL_DATE", "DEBIT_AMOUNT", "CREDIT_AMOUNT", "CURRENCY", "COST_CENTER", "STATUS"]
        },
        "target1": {
            "title": "Core GL Ledger Target",
            "subtitle": "gl_posting_journal",
            "engine": "postgres",
            "table": "gl_posting_journal"
        },
        "target2": {
            "title": "Audit Governance Vault",
            "subtitle": "sox_audit_archive",
            "engine": "postgres",
            "table": "sox_audit_archive"
        },
        "prebuiltRules": [
            {"id": "r_fin_1", "name": "Positive Line Amounts", "column": "DEBIT_AMOUNT", "check_type": "RANGE_BOUND", "condition": "DEBIT_AMOUNT >= 0 AND CREDIT_AMOUNT >= 0", "severity": "critical", "description": "Debits and credits must be non-negative"},
            {"id": "r_fin_2", "name": "ISO-4217 Currency Code", "column": "CURRENCY", "check_type": "ENUM_SET", "condition": "CURRENCY IN ('USD', 'EUR', 'GBP', 'INR', 'JPY')", "severity": "critical", "description": "Only recognized ISO currency codes allowed"},
            {"id": "r_fin_3", "name": "Mandatory Cost Center", "column": "COST_CENTER", "check_type": "NOT_NULL", "condition": "LENGTH(TRIM(COST_CENTER)) > 0", "severity": "critical", "description": "Financial accounting mandates cost center allocation"}
        ]
    }
]
