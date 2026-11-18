"""
Synthetic Multi-Tab Excel Replica Generator for Client Demo (TIME R3.2 Material Master)
Generates 4 realistic multi-tab FMD Excel workbooks (SUSTAIN, ATLAS, CONS, CMMS/MAXIMO),
2 XREF override workbooks, and 1 Legacy SAP BW HANA Source Data workbook.

Formatting matches the client screenshots:
- Row 1: "Field Mapping" title
- Row 2: Red (#FF0000) header bar with bold black text and autofilter
- 6 Tabs per FMD:
    1. Field Mapping - MARA
    2. Field Mapping - MARC (with exact PM_MM_1..PM_MM_72 rows from screenshots)
    3. Field Mapping - MAKT (with MAKT-MATNR Internal & MAKT-MAKTX per-source rules)
    4. Field Mapping - MBEW
    5. Field Mapping - MARD
    6. Field Mapping - Classification
"""

import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "demo_data", "fmd")

FMD_HEADERS = [
    "UNIQUE_ID",
    "SOURCE",
    "OBJECT",
    "WORKSTREAM",
    "SUB_WORKSTREAM",
    "DATA_LEVEL",
    "TARGET_TABLE",
    "TARGET_FIELD_NAME",
    "TARGET_FIELD_TEXT",
    "MAPPING_RULE",
    "SOURCE_TABLE",
    "SOURCE_FIELD",
    "FILE_NAME",
    "XREF_TABLE",
    "XREF_FIELD",
    "RULE_LOGIC",
    "STATUS",
    "EXCEPTION_NOTE",
]

# Exact MARC rows observed in Screenshots 8, 9, 10
MARC_BASE_ROWS = [
    ("PM_MM_1", "Header Data", "MARC", "MATNR", "Product Number", "Internal", "N/A", "N/A"),
    ("PM_MM_2", "Header Data", "MARC", "WERKS", "Plant", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "WERKS"),
    ("PM_MM_3", "MRP 1", "MARC", "DISMM", "MRP Type", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "DISMM"),
    ("PM_MM_4", "MRP 1", "MARC", "DISPO", "MRP Controller", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "DISPO"),
    ("PM_MM_5", "MRP 1", "MARC", "MTVFP", "Availability Check", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "MTVFP"),
    ("PM_MM_6", "Purchasing", "MARC", "MMSTA", "Plant-Specific Product Status", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "MMSTA"),
    ("PM_MM_8", "Sales: General/Plant", "MARC", "PRCTR", "Profit Center", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "PRCTR"),
    ("PM_MM_9", "Plant Data/Storage 1", "MARC", "AUSME", "Unit of Issue (ISO format)", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "AUSME"),
    ("PM_MM_22", "Purchasing", "MARC", "EKGRP", "Purchasing Group", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "EKGRP"),
    ("PM_MM_24", "Purchasing", "MARC", "KAUTB", "Automatic Purchase Oder Allowed", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "KAUTB"),
    ("PM_MM_27", "MRP 1", "MARC", "MINBE", "Reorder Point", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "MINBE"),
    ("PM_MM_36", "MRP 1", "MARC", "DISLS", "Lot Sizing Procedure", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "DISLS"),
    ("PM_MM_38", "MRP 1", "MARC", "BSTMA", "Maximum Lot Size", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "BSTMA"),
    ("PM_MM_41", "MRP 1", "MARC", "MABST", "Maximum Stock Level", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "MABST"),
    ("PM_MM_42", "MRP 1", "MARC", "BSTRF", "Rounding Value", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "BSTRF"),
    ("PM_MM_43", "MRP 2", "MARC", "EISBE", "Safety Stock", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "EISBE"),
    ("PM_MM_52", "MRP 2", "MARC", "BESKZ", "Procurement Type", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "BESKZ"),
    ("PM_MM_53", "MRP 2", "MARC", "SOBSL", "Special Procurement Type", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "SOBSL"),
    ("PM_MM_59", "MRP 2", "MARC", "PLIFZ", "Planned Delivery Time", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "PLIFZ"),
    ("PM_MM_60", "MRP 2", "MARC", "WEBAZ", "Goods Receipt Processing Time", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "WEBAZ"),
    ("PM_MM_71", "Plant Data/Storage 1", "MARC", "ABCIN", "Physical Inventory Indicator for Cycle Counting", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "ABCIN"),
    ("PM_MM_72", "Plant Data/Storage 1", "MARC", "CCFIX", "Cycle Counting Indicator Fixed", "Copy", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "CCFIX"),
]

MARA_BASE_ROWS = [
    ("MM_MARA_1", "Basic Data 1", "MARA", "MATNR", "Material Number", "Internal", "N/A", "N/A"),
    ("MM_MARA_2", "Basic Data 1", "MARA", "MTART", "Material Type", "XRef/Rule", "MARA", "MTART"),
    ("MM_MARA_3", "Basic Data 1", "MARA", "MBRSH", "Industry Sector", "Default", "N/A", "N/A"),
    ("MM_MARA_4", "Basic Data 1", "MARA", "MATKL", "Material Group", "XRef/Rule", "MARA", "MATKL"),
    ("MM_MARA_5", "Basic Data 1", "MARA", "MEINS", "Base Unit of Measure", "XRef/Rule", "MARA", "MEINS"),
]

MBEW_BASE_ROWS = [
    ("MM_MBEW_1", "Accounting 1", "MBEW", "MATNR", "Material Number", "Internal", "N/A", "N/A"),
    ("MM_MBEW_2", "Accounting 1", "MBEW", "BWKEY", "Valuation Area", "XRef/Rule", "MBEW", "BWKEY"),
    ("MM_MBEW_3", "Accounting 1", "MBEW", "BKLAS", "Valuation Class", "XRef/Rule", "MBEW", "BKLAS"),
    ("MM_MBEW_4", "Accounting 1", "MBEW", "VPRSV", "Price Control Indicator", "Copy", "MBEW", "VPRSV"),
]

MARD_BASE_ROWS = [
    ("MM_MARD_1", "Storage Data", "MARD", "MATNR", "Material Number", "Internal", "N/A", "N/A"),
    ("MM_MARD_2", "Storage Data", "MARD", "WERKS", "Plant", "Copy", "MARD", "WERKS"),
    ("MM_MARD_3", "Storage Data", "MARD", "LGORT", "Storage Location", "XRef/Rule", "MARD", "LGORT"),
]

CLASS_BASE_ROWS = [
    ("MM_CLS_1", "Classification", "KSSK", "OBJEK", "Object Number (MATNR)", "Internal", "N/A", "N/A"),
    ("MM_CLS_2", "Classification", "KSSK", "KLART", "Class Type", "Default", "N/A", "N/A"),
    ("MM_CLS_3", "Classification", "AUSP", "ATWRT", "Characteristic Value", "Copy", "AUSP", "ATWRT"),
]

FMD_SPECS = [
    {
        "filename": "TIME-L3-MDA-MT-C_Material_Master-FMD-SUSTAIN_R3.2.xlsx",
        "source_system": "SUSTAIN",
        "source_label": "SUSTAIN Legacy SAP ECC",
        "id_prefix": "SUS_MM",
        "marc_source_table": "SUSTAIN_MARC",
        "makt_rows": [
            (
                "SUS_MAKT_1",
                "SUSTAIN Legacy SAP ECC",
                "Material Master",
                "Make",
                "Quality",
                "Basic Data 1",
                "MAKT",
                "MATNR",
                "Product Number",
                "Internal",
                "MAKT",
                "MATNR",
                "N/A",
                "N/A",
                "N/A",
                "Direct internal key mapping from legacy MATNR to TIME Product Number. No active transformation required.",
                "VALID",
                "None",
            ),
            (
                "SUS_MAKT_2",
                "SUSTAIN Legacy SAP ECC",
                "Material Master",
                "Make",
                "Quality",
                "Basic Data 1",
                "MAKT",
                "SPRAS",
                "Language Key",
                "Default",
                "MAKT",
                "SPRAS",
                "N/A",
                "N/A",
                "N/A",
                "Default to 'EN' if legacy language key is blank; otherwise preserve ISO language key.",
                "VALID",
                "None",
            ),
            (
                "SUS_MAKT_3",
                "SUSTAIN Legacy SAP ECC",
                "Material Master",
                "Make",
                "Quality",
                "Basic Data 1",
                "MAKT",
                "MAKTX",
                "Product Description",
                "XRef/Rule",
                "MAKT",
                "Material description (MAKTX)",
                "SAP_BW_HANA_Legacy_MAKT_Source_Data.xlsx",
                "TIME_L3_MM_R3_2_MAKTX_XREF_MATERIAL_DESCRIPTION_MASTER_DATA; TIME_L3_MM_R3_2_MAKT_OVERRIDE_XREF",
                "TIME_MAKTX",
                "Check whether MATNR exists in Material Description XREF or MAKT Override cross-reference. If an override exists, use TIME_MAKTX. Otherwise, copy legacy MAKT-MAKTX.",
                "REWORK",
                "Requires dual cross-reference lookup (Material Description XREF + MAKT Override XREF); FMD status currently REWORK pending business sign-off.",
            ),
        ],
    },
    {
        "filename": "TIME-L3-MDA-MT-C_Material_Master-FMD-ATLAS_R3.2.xlsx",
        "source_system": "ATLAS",
        "source_label": "ATLAS Legacy ERP",
        "id_prefix": "ATL_MM",
        "marc_source_table": "ATLAS_MARC",
        "makt_rows": [
            (
                "ATL_MAKT_1",
                "ATLAS Legacy ERP",
                "Material Master",
                "Make",
                "Quality",
                "Basic Data 1",
                "MAKT",
                "MATNR",
                "Product Number",
                "Internal",
                "MAKT",
                "MATNR",
                "N/A",
                "N/A",
                "N/A",
                "Direct internal mapping from legacy MATNR to TIME Product Number. No active transformation required.",
                "FINAL REVIEW",
                "None",
            ),
            (
                "ATL_MAKT_2",
                "ATLAS Legacy ERP",
                "Material Master",
                "Make",
                "Quality",
                "Basic Data 1",
                "MAKT",
                "SPRAS",
                "Language Key",
                "Copy",
                "MAKT",
                "SPRAS",
                "N/A",
                "N/A",
                "N/A",
                "Direct copy of ISO language code.",
                "FINAL REVIEW",
                "None",
            ),
            (
                "ATL_MAKT_3",
                "ATLAS Legacy ERP",
                "Material Master",
                "Make",
                "Quality",
                "Basic Data 1",
                "MAKT",
                "MAKTX",
                "Product Description",
                "XRef/Rule",
                "MAKT",
                "Material description (MAKTX)",
                "SAP_BW_HANA_Legacy_MAKT_Source_Data.xlsx",
                "TIME_L3_MM_R3_2_MAKTX_XREF_MATERIAL_DESCRIPTION_MASTER_DATA",
                "TIME_MAKTX",
                "Search TIME_L3_MM_R3_2_MAKTX_XREF_MATERIAL_DESCRIPTION_MASTER_DATA using the legacy material number (MATNR). If found, use cross-reference field TIME_MAKTX. Otherwise, copy MAKT-MAKTX.",
                "FINAL REVIEW",
                "Uses single primary Material Description XREF table; pending final governance approval (FINAL REVIEW).",
            ),
        ],
    },
    {
        "filename": "TIME-L3-MDA-MT-C Material Master-FMD-CONS R3.2.xlsx",
        "source_system": "CONS",
        "source_label": "Construction / CONS Model Table",
        "id_prefix": "CNS_MM",
        "marc_source_table": "R3_2_CONS_MATERIAL_MASTERDATA",
        "makt_rows": [
            (
                "CNS_MAKT_1",
                "Construction / CONS Model Table",
                "Material Master",
                "Make",
                "Quality",
                "Basic Data 1",
                "MAKT",
                "MATNR",
                "Product Number",
                "Internal",
                "R3_2_CONS_MATERIAL_MASTERDATA",
                "MATNR",
                "N/A",
                "N/A",
                "N/A",
                "Internal sequence / material key alignment. No transformation required.",
                "VALID",
                "None",
            ),
            (
                "CNS_MAKT_2",
                "Construction / CONS Model Table",
                "Material Master",
                "Make",
                "Quality",
                "Basic Data 1",
                "MAKT",
                "SPRAS",
                "Language Key",
                "Default",
                "R3_2_CONS_MATERIAL_MASTERDATA",
                "SPRAS",
                "N/A",
                "N/A",
                "N/A",
                "Set language key to 'EN'.",
                "VALID",
                "None",
            ),
            (
                "CNS_MAKT_3",
                "Construction / CONS Model Table",
                "Material Master",
                "Make",
                "Quality",
                "Basic Data 1",
                "MAKT",
                "MAKTX",
                "Product Description",
                "Business construction",
                "R3_2_CONS_MATERIAL_MASTERDATA",
                "Material description (CONSTRUCTED_MAKTX)",
                "SAP_BW_HANA_Legacy_MAKT_Source_Data.xlsx",
                "N/A",
                "N/A",
                "Construct standardized TIME product description from business construction model attributes (UPPER(TRIM(CONDITION_PREFIX || ' ' || EQUIP_NOUN)), fallback to source MAKTX, max 40 chars).",
                "VALID",
                "Constructed via standardized business naming rules rather than legacy copy or XREF lookup.",
            ),
        ],
    },
    {
        "filename": "TIME-L3-MDA-MT-C Material Master-FMD-CMMS_R3.2.xlsx",
        "source_system": "CMMS/MAXIMO",
        "source_label": "PM MM-Construction Table",
        "id_prefix": "PM_MM",
        "marc_source_table": "R3_2_CONS_MATERIAL_CMMS_MASTERDATA",
        "makt_rows": [
            (
                "PM_MAKT_1",
                "PM MM-Construction Table",
                "Material Master",
                "Make",
                "Quality",
                "Header Data",
                "MAKT",
                "MATNR",
                "Product Number",
                "Internal",
                "N/A",
                "N/A",
                "N/A",
                "N/A",
                "N/A",
                "Internal material key assignment; no active transformation needed.",
                "VALID",
                "None",
            ),
            (
                "PM_MAKT_2",
                "PM MM-Construction Table",
                "Material Master",
                "Make",
                "Quality",
                "Basic Data 1",
                "MAKT",
                "SPRAS",
                "Language Key",
                "Copy",
                "R3_2_CONS_MATERIAL_CMMS_MASTERDATA",
                "SPRAS",
                "N/A",
                "N/A",
                "N/A",
                "Copy language key directly from construction model table.",
                "VALID",
                "None",
            ),
            (
                "PM_MAKT_3",
                "PM MM-Construction Table",
                "Material Master",
                "Make",
                "Quality",
                "Basic Data 1",
                "MAKT",
                "MAKTX",
                "Product Description",
                "Copy",
                "R3_2_CONS_MATERIAL_CMMS_MASTERDATA",
                "MAKTX",
                "SAP_BW_HANA_Legacy_MAKT_Source_Data.xlsx",
                "N/A",
                "N/A",
                "Explicitly mapped using Direct Copy from R3_2_CONS_MATERIAL_CMMS_MASTERDATA.MAKTX to target Product Description (MAKT-MAKTX).",
                "VALID",
                "Design spec exception (TIME_L3_MDA_MT-C_Material_Master_R3.2[21]): normal mapping is Direct Copy, but a cross-reference override may supersede the description if registered.",
            ),
        ],
    },
]


def _style_fmd_sheet(ws, tab_color="FF0000"):
    ws.sheet_properties.tabColor = tab_color

    # Row 1: Title
    ws["A1"] = "Field Mapping"
    ws["A1"].font = Font(name="Calibri", size=16, bold=True, color="000000")

    # Row 2: Red header row matching client Excel screenshots
    red_fill = PatternFill(start_color="FF0000", end_color="FF0000", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="000000")
    thin_border = Border(
        left=Side(style="thin", color="BFBFBF"),
        right=Side(style="thin", color="BFBFBF"),
        top=Side(style="thin", color="BFBFBF"),
        bottom=Side(style="thin", color="BFBFBF"),
    )

    for col_idx, header in enumerate(FMD_HEADERS, start=1):
        cell = ws.cell(row=2, column=col_idx, value=header)
        cell.fill = red_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    ws.row_dimensions[1].height = 24
    ws.row_dimensions[2].height = 22
    ws.auto_filter.ref = f"A2:R{max(ws.max_row, 3)}"

    col_widths = {
        "A": 15, "B": 28, "C": 18, "D": 14, "E": 18, "F": 22,
        "G": 15, "H": 20, "I": 34, "J": 22, "K": 36, "L": 26,
        "M": 32, "N": 42, "O": 16, "P": 55, "Q": 16, "R": 45,
    }
    for col_letter, width in col_widths.items():
        ws.column_dimensions[col_letter].width = width


def _write_data_rows(ws, rows):
    thin_border = Border(
        left=Side(style="thin", color="D9D9D9"),
        right=Side(style="thin", color="D9D9D9"),
        top=Side(style="thin", color="D9D9D9"),
        bottom=Side(style="thin", color="D9D9D9"),
    )
    body_font = Font(name="Calibri", size=10, color="000000")
    for row_idx, row_vals in enumerate(rows, start=3):
        for col_idx, val in enumerate(row_vals, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = body_font
            cell.border = thin_border
            cell.alignment = Alignment(vertical="center", wrap_text=(col_idx in (16, 18)))


def _build_generic_rows(base_rows, spec, table_override=None):
    rows = []
    for uid, data_level, target_table, field_name, field_text, rule, src_tbl, src_fld in base_rows:
        eff_uid = uid if spec["source_system"] == "CMMS/MAXIMO" else uid.replace("PM_MM", spec["id_prefix"])
        eff_src_tbl = "N/A" if src_tbl == "N/A" else (table_override or src_tbl)
        rows.append((
            eff_uid,
            spec["source_label"],
            "Material Master",
            "Make",
            "Quality",
            data_level,
            target_table,
            field_name,
            field_text,
            rule,
            eff_src_tbl,
            src_fld,
            "N/A",
            "N/A" if rule != "XRef/Rule" else f"TIME_L3_MM_R3_2_{field_name}_XREF",
            "N/A" if rule != "XRef/Rule" else f"TIME_{field_name}",
            f"{rule} mapping for {target_table}-{field_name} ({field_text}).",
            "VALID",
            "None",
        ))
    return rows


def generate_fmd_workbooks():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    generated_files = []

    for spec in FMD_SPECS:
        wb = openpyxl.Workbook()
        # 1. MARA
        ws_mara = wb.active
        ws_mara.title = "Field Mapping - MARA"
        _write_data_rows(ws_mara, _build_generic_rows(MARA_BASE_ROWS, spec))
        _style_fmd_sheet(ws_mara, "FF0000")

        # 2. MARC
        ws_marc = wb.create_sheet("Field Mapping - MARC")
        _write_data_rows(ws_marc, _build_generic_rows(MARC_BASE_ROWS, spec, spec["marc_source_table"]))
        _style_fmd_sheet(ws_marc, "00B050" if spec["source_system"] == "CMMS/MAXIMO" else "FF0000")

        # 3. MAKT
        ws_makt = wb.create_sheet("Field Mapping - MAKT")
        _write_data_rows(ws_makt, spec["makt_rows"])
        _style_fmd_sheet(ws_makt, "FF0000")

        # 4. MBEW
        ws_mbew = wb.create_sheet("Field Mapping - MBEW")
        _write_data_rows(ws_mbew, _build_generic_rows(MBEW_BASE_ROWS, spec))
        _style_fmd_sheet(ws_mbew, "FF0000")

        # 5. MARD
        ws_mard = wb.create_sheet("Field Mapping - MARD")
        _write_data_rows(ws_mard, _build_generic_rows(MARD_BASE_ROWS, spec))
        _style_fmd_sheet(ws_mard, "FF0000")

        # 6. Classification
        ws_cls = wb.create_sheet("Field Mapping - Classification")
        _write_data_rows(ws_cls, _build_generic_rows(CLASS_BASE_ROWS, spec))
        _style_fmd_sheet(ws_cls, "FF0000")

        out_path = os.path.join(OUTPUT_DIR, spec["filename"])
        wb.save(out_path)
        generated_files.append(out_path)

    return generated_files


def _style_simple_table(ws, headers, rows, header_hex="1F4E78"):
    fill = PatternFill(start_color=header_hex, end_color=header_hex, fill_type="solid")
    hfont = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    bfont = Font(name="Calibri", size=10, color="000000")
    for c_idx, h in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=c_idx, value=h)
        cell.fill = fill
        cell.font = hfont
        cell.alignment = Alignment(horizontal="center", vertical="center")
    for r_idx, row in enumerate(rows, start=2):
        for c_idx, val in enumerate(row, start=1):
            cell = ws.cell(row=r_idx, column=c_idx, value=val)
            cell.font = bfont
    for col in ws.columns:
        max_len = max(len(str(c.value or "")) for c in col)
        ws.column_dimensions[col[0].column_letter].width = min(max(max_len + 4, 14), 52)


def generate_xref_workbooks():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    paths = []

    # 1. Primary Material Description XREF (used by SUSTAIN & ATLAS)
    wb1 = openpyxl.Workbook()
    ws1 = wb1.active
    ws1.title = "MAKTX_XREF"
    headers = ["LEGACY_MATNR", "SOURCE_SYSTEM", "LEGACY_MAKTX", "TIME_MAKTX", "OVERRIDE_REASON", "APPROVED_BY"]
    rows1 = [
        ("100001", "SUSTAIN", "LEGACY PUMP ASSEMBLY", "PUMP ASSEMBLY", "Standardize legacy prefix removal for TIME S/4HANA", "Data Governance Board"),
        ("200001", "ATLAS", "ATLAS FILTER UNIT", "FILTER UNIT", "Remove legacy ERP name prefix per TIME naming spec", "Data Governance Board"),
        ("100002", "SUSTAIN", "OLD VALVE CONTROL 2IN", "VALVE CONTROL 2IN", "Standardize valve naming", "Data Governance Board"),
        ("200002", "ATLAS", "ATLAS PRESSURE GAUGE 100PSI", "PRESSURE GAUGE 100PSI", "Remove ATLAS prefix", "Data Governance Board"),
    ]
    _style_simple_table(ws1, headers, rows1)
    p1 = os.path.join(OUTPUT_DIR, "TIME_L3_MM_R3_2_MAKTX_XREF_MATERIAL_DESCRIPTION_MASTER_DATA.xlsx")
    wb1.save(p1)
    paths.append(p1)

    # 2. Secondary MAKT Override XREF (used by SUSTAIN dual-check)
    wb2 = openpyxl.Workbook()
    ws2 = wb2.active
    ws2.title = "MAKT_OVERRIDE_XREF"
    rows2 = [
        ("100003", "SUSTAIN", "LEGACY SEAL KIT REV A", "SEAL KIT MECHANICAL REV A", "Safety critical description override", "Lead Material Steward"),
        ("400009", "CMMS/MAXIMO", "MOTOR ASSY OLD SPEC", "ELECTRIC MOTOR 5HP IEC", "Optional design-spec override exception", "Plant Engineering"),
    ]
    _style_simple_table(ws2, headers, rows2, header_hex="7F6000")
    p2 = os.path.join(OUTPUT_DIR, "TIME_L3_MM_R3_2_MAKT_OVERRIDE_XREF.xlsx")
    wb2.save(p2)
    paths.append(p2)

    return paths


def generate_source_data_workbook():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    wb = openpyxl.Workbook()

    headers = [
        "SOURCE_SYSTEM", "SOURCE_TABLE", "MATNR", "SPRAS", "MAKTX",
        "WERKS", "CONDITION_PREFIX", "EQUIP_NOUN", "DISMM", "EKGRP",
    ]
    combined_rows = [
        # The 4 canonical screenshot demo records:
        ("SUSTAIN", "MAKT", "100001", "EN", "LEGACY PUMP ASSEMBLY", "P100", "", "", "PD", "001"),
        ("ATLAS", "MAKT", "200001", "EN", "ATLAS FILTER UNIT", "P200", "", "", "VB", "002"),
        ("CONS", "R3_2_CONS_MATERIAL_MASTERDATA", "300001", "EN", "NEW MIXING VESSEL", "P300", "NEW", "MIXING VESSEL", "PD", "003"),
        ("CMMS/MAXIMO", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "400001", "EN", "MAINTENANCE MOTOR", "P400", "", "", "ND", "004"),
        # Additional representative records (including fallback copy & intentional Z_ERRORLOG validation cases):
        ("SUSTAIN", "MAKT", "100004", "EN", "LEGACY HEAT EXCHANGER", "P100", "", "", "PD", "001"),
        ("ATLAS", "MAKT", "200004", "EN", "", "P200", "", "", "VB", "002"),  # Missing mandatory MAKTX -> Z_ERRORLOG
        ("CONS", "R3_2_CONS_MATERIAL_MASTERDATA", "300002", "EN", "HIGH PRESSURE STAINLESS STEEL INDUSTRIAL REACTOR VESSEL 5000L", "P300", "HIGH PRESSURE", "STAINLESS STEEL INDUSTRIAL REACTOR VESSEL 5000L", "PD", "003"),  # >40 chars SAP limit -> Z_ERRORLOG
        ("CMMS/MAXIMO", "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "400009", "EN", "MOTOR ASSY OLD SPEC", "P400", "", "", "ND", "004"),  # Design-spec XREF override exception demonstration
    ]

    ws_all = wb.active
    ws_all.title = "Combined_MAKT_Demo_Subset"
    _style_simple_table(ws_all, headers, combined_rows, header_hex="0F766E")

    # Also split into per-source sheets for realistic multi-tab upload demos
    by_source = {
        "MAKT_SUSTAIN": [r for r in combined_rows if r[0] == "SUSTAIN"],
        "MAKT_ATLAS": [r for r in combined_rows if r[0] == "ATLAS"],
        "CONS_MASTERDATA": [r for r in combined_rows if r[0] == "CONS"],
        "R3_2_CONS_CMMS_MASTERDATA": [r for r in combined_rows if r[0] == "CMMS/MAXIMO"],
    }
    for sheet_name, s_rows in by_source.items():
        ws = wb.create_sheet(sheet_name)
        _style_simple_table(ws, headers, s_rows, header_hex="1E3A8A")

    out_path = os.path.join(OUTPUT_DIR, "SAP_BW_HANA_Legacy_MAKT_Source_Data.xlsx")
    wb.save(out_path)
    return out_path


def generate_all():
    fmds = generate_fmd_workbooks()
    xrefs = generate_xref_workbooks()
    src = generate_source_data_workbook()
    return {"fmds": fmds, "xrefs": xrefs, "source": src}


if __name__ == "__main__":
    res = generate_all()
    print(f"Generated {len(res['fmds'])} FMD workbooks, {len(res['xrefs'])} XREF workbooks, and 1 Source workbook in {OUTPUT_DIR}")
    for p in res["fmds"] + res["xrefs"] + [res["source"]]:
        print("  -", os.path.basename(p))
