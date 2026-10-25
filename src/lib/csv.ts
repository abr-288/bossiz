// Export CSV pour les tableurs français (séparateur « ; », BOM UTF-8).
export function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const cell = (v: unknown) => {
    const text = v == null ? "" : String(v);
    // Neutralise les formules interprétées par les tableurs.
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return /[";\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = [
    columns.map((c) => cell(c.label)).join(";"),
    ...rows.map((r) => columns.map((c) => cell(r[c.key])).join(";")),
  ];
  return "﻿" + lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
