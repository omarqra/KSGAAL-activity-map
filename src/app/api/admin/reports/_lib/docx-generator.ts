import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import type { ReportGroup, ReportPayload, ReportRow } from "./report-types";

interface Headings {
  serial: string;
  name: string;
  type: string;
  subtype: string;
  host: string;
  date: string;
  status: string;
  generatedAt: string;
  total: string;
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
  status: "الحالة",
  generatedAt: "تاريخ التوليد",
  total: "إجمالي السجلات",
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
  status: "Status",
  generatedAt: "Generated at",
  total: "Total records",
  count: "Count",
  none: "—",
};

const HEADER_FILL = "232F3E";
const GROUP_FILL = "F2F8FD";

function rtl(locale: ReportPayload["locale"]) {
  return locale === "ar";
}

function textRun(text: string, opts: { bold?: boolean; color?: string } = {}) {
  return new TextRun({
    text,
    bold: opts.bold,
    color: opts.color,
    rightToLeft: true,
  });
}

function headerCell(text: string) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: HEADER_FILL, fill: HEADER_FILL },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        children: [textRun(text, { bold: true, color: "FFFFFF" })],
      }),
    ],
  });
}

function bodyCell(text: string) {
  return new TableCell({
    children: [
      new Paragraph({
        bidirectional: true,
        children: [textRun(text)],
      }),
    ],
  });
}

function buildHeaderRow(h: Headings): TableRow {
  return new TableRow({
    tableHeader: true,
    children: [
      headerCell(h.serial),
      headerCell(h.name),
      headerCell(h.type),
      headerCell(h.subtype),
      headerCell(h.host),
      headerCell(h.date),
      headerCell(h.status),
    ],
  });
}

function buildBodyRow(row: ReportRow, h: Headings): TableRow {
  return new TableRow({
    children: [
      bodyCell(String(row.serial)),
      bodyCell(row.name),
      bodyCell(row.type),
      bodyCell(row.subtype ?? h.none),
      bodyCell(row.hostName),
      bodyCell(row.date),
      bodyCell(row.status),
    ],
  });
}

function buildTable(rows: ReportRow[], h: Headings): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [buildHeaderRow(h), ...rows.map((r) => buildBodyRow(r, h))],
  });
}

function buildGroupHeading(group: ReportGroup, h: Headings): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    bidirectional: true,
    spacing: { before: 240, after: 120 },
    shading: { type: ShadingType.SOLID, color: GROUP_FILL, fill: GROUP_FILL },
    children: [
      textRun(`${group.label} — ${h.count}: ${group.count}`, {
        bold: true,
        color: "033160",
      }),
    ],
  });
}

function buildHeader(payload: ReportPayload, h: Headings): Paragraph[] {
  const generated = new Date(payload.generatedAt).toLocaleString(
    payload.locale === "ar" ? "ar" : "en"
  );
  return [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      children: [textRun(payload.title, { bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 120 },
      children: [textRun(payload.description, { color: "5F6B7A" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 240 },
      children: [
        textRun(
          `${h.generatedAt}: ${generated} · ${h.total}: ${payload.totalCount}`,
          { color: "5F6B7A" }
        ),
      ],
    }),
  ];
}

function buildBody(
  payload: ReportPayload,
  h: Headings
): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [];
  if (payload.rows) {
    out.push(buildTable(payload.rows, h));
    return out;
  }
  if (payload.groups) {
    for (const group of payload.groups) {
      out.push(buildGroupHeading(group, h));
      const renumbered = group.rows.map((r, idx) => ({ ...r, serial: idx + 1 }));
      out.push(buildTable(renumbered, h));
    }
  }
  return out;
}

export async function generateDocx(payload: ReportPayload): Promise<Buffer> {
  const h = payload.locale === "ar" ? HEADINGS_AR : HEADINGS_EN;
  const isRtl = rtl(payload.locale);

  const doc = new Document({
    creator: "Console",
    title: payload.title,
    description: payload.description,
    styles: {
      default: {
        document: {
          run: { font: "Cairo", size: 22 },
          paragraph: { spacing: { line: 320 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
          },
          ...(isRtl ? { rtl: true } : {}),
        },
        children: [...buildHeader(payload, h), ...buildBody(payload, h)],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
