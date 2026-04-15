import type { Rating, Format } from "./types.js";

function pick(rating: Rating, fields: (keyof Rating)[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const f of fields) {
    obj[f] = rating[f];
  }
  return obj;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeCsvValue(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return `"${value}"`;
}

function toJson(ratings: Rating[], fields: (keyof Rating)[]): string {
  const filtered = ratings.map((r) => pick(r, fields));
  return JSON.stringify(filtered, null, 2);
}

function toCsv(ratings: Rating[], fields: (keyof Rating)[]): string {
  const header = fields.map((f) => escapeCsvValue(f)).join(",");
  const rows = ratings.map((r) =>
    fields.map((f) => escapeCsvValue(String(r[f]))).join(","),
  );
  return [header, ...rows].join("\n");
}

function toXml(ratings: Rating[], fields: (keyof Rating)[]): string {
  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', "<ratings>"];

  for (const r of ratings) {
    lines.push("  <rating>");
    for (const f of fields) {
      const val = escapeXml(String(r[f]));
      lines.push(`    <${f}>${val}</${f}>`);
    }
    lines.push("  </rating>");
  }

  lines.push("</ratings>");
  return lines.join("\n");
}

export function formatRatings(
  ratings: Rating[],
  fields: (keyof Rating)[],
  format: Format,
): string {
  switch (format) {
    case "json":
      return toJson(ratings, fields);
    case "csv":
      return toCsv(ratings, fields);
    case "xml":
      return toXml(ratings, fields);
  }
}
