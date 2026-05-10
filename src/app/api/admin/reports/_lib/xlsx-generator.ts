import ExcelJS from "exceljs";

import type { ReportGroup, ReportPayload, ReportRow } from "./report-types";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF232F3E" }, // aws-squid
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 11,
};

const TITLE_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 16,
  color: { argb: "FF16191F" },
};

const META_FONT: Partial<ExcelJS.Font> = {
  italic: true,
  color: { argb: "FF5F6B7A" },
  size: 10,
};

const COLUMNS = [
  { header: "#", key: "serial", width: 6 },
  { header: "name", key: "name", width: 50 },
  { header: "type", key: "type", width: 22 },
  { header: "subtype", key: "subtype", width: 18 },
  { header: "host", key: "host", width: 28 },
  { header: "date", key: "date", width: 22 },
  { header: "year", key: "year", width: 8 },
  { header: "status", key: "status", width: 14 },
];

interface Headings {
  serial: string;
  name: string;
  type: string;
  subtype: string;
  host: string;
  date: string;
  year: string;
  status: string;
  generatedAt: string;
  total: string;
  group: string;
  count: string;
  none: string;
}

const HEADINGS_AR: Headings = {
  serial: "#",
  name: "اسم النشاط",
  type: "النوع",
  subtype: "نوع فرعي",
  host: "الجهة المضيفة",
  date: "التاريخ",
  year: "السنة",
  status: "الحالة",
  generatedAt: "تاريخ التوليد",
  total: "إجمالي السجلات",
  group: "المجموعة",
  count: "عدد",
  none: "—",
};

const HEADINGS_EN: Headings = {
  serial: "#",
  name: "Activity Name",
  type: "Type",
  subtype: "Subtype",
  host: "Host",
  date: "Date",
  year: "Year",
  status: "Status",
  generatedAt: "Generated at",
  total: "Total records",
  group: "Group",
  count: "Count",
  none: "—",
};

function applyRtl(sheet: ExcelJS.Worksheet, locale: ReportPayload["locale"]) {
  if (locale === "ar") sheet.views = [{ rightToLeft: true }];
}

function writeHeaderBlock(
  sheet: ExcelJS.Worksheet,
  payload: ReportPayload,
  h: Headings
) {
  sheet.mergeCells("A1:H1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = payload.title;
  titleCell.font = TITLE_FONT;
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  sheet.getRow(1).height = 26;

  sheet.mergeCells("A2:H2");
  const meta = sheet.getCell("A2");
  meta.value = `${h.generatedAt}: ${new Date(payload.generatedAt).toLocaleString(
    payload.locale === "ar" ? "ar" : "en"
  )} · ${h.total}: ${payload.totalCount}`;
  meta.font = META_FONT;
  meta.alignment = { horizontal: "center" };

  sheet.addRow([]);
}

function writeColumnHeaders(sheet: ExcelJS.Worksheet, h: Headings) {
  const headerRow = sheet.addRow([
    h.serial,
    h.name,
    h.type,
    h.subtype,
    h.host,
    h.date,
    h.year,
    h.status,
  ]);
  headerRow.eachCell((cell) => {
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE9EBED" } },
      bottom: { style: "thin", color: { argb: "FFE9EBED" } },
    };
  });
  headerRow.height = 22;
}

function writeRow(sheet: ExcelJS.Worksheet, row: ReportRow, h: Headings) {
  const r = sheet.addRow([
    row.serial,
    row.name,
    row.type,
    row.subtype ?? h.none,
    row.hostName,
    row.date,
    row.year ?? "",
    row.status,
  ]);
  r.alignment = { vertical: "middle", wrapText: true };
}

function writeGroupHeader(
  sheet: ExcelJS.Worksheet,
  group: ReportGroup,
  h: Headings
) {
  sheet.addRow([]);
  const row = sheet.addRow([`${group.label} — ${h.count}: ${group.count}`]);
  sheet.mergeCells(`A${row.number}:H${row.number}`);
  const cell = sheet.getCell(`A${row.number}`);
  cell.font = { bold: true, color: { argb: "FF033160" }, size: 12 };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF2F8FD" },
  };
}

export async function generateXlsx(payload: ReportPayload): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Console";
  wb.created = new Date();

  const sheet = wb.addWorksheet(payload.title.slice(0, 31));
  sheet.columns = COLUMNS.map((c) => ({ ...c }));
  applyRtl(sheet, payload.locale);

  const h = payload.locale === "ar" ? HEADINGS_AR : HEADINGS_EN;

  writeHeaderBlock(sheet, payload, h);

  if (payload.rows) {
    writeColumnHeaders(sheet, h);
    for (const row of payload.rows) writeRow(sheet, row, h);
  } else if (payload.groups) {
    for (const group of payload.groups) {
      writeGroupHeader(sheet, group, h);
      writeColumnHeaders(sheet, h);
      group.rows.forEach((r, idx) => {
        writeRow(sheet, { ...r, serial: idx + 1 }, h);
      });
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
