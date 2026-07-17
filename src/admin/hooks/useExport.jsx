import { useState } from 'react';

const useExport = ({
  title        = "Export",
  filename     = "export",
  template     = "generic_list",
  subtitle     = "",
  docId        = "",
  columns      = [],
  rows         = [],
  summaryPills = [],
  showTotals   = false,
  totalColumns = [],
  printStyles  = "",
}) => {
  const [pdfOpen, setPdfOpen] = useState(false);

  const onExportExcel = () => {
    const headers = columns.map(c => c.excelKey || c.label);
    const dataRows = rows.map(row =>
      columns.map(c => {
        const val = row[c.key];
        return c.format ? c.format(val) : (val ?? "");
      })
    );
    if (showTotals && totalColumns.length) {
      dataRows.push(columns.map(c => {
        if (totalColumns.includes(c.key)) {
          const sum = rows.reduce((s, r) => s + (parseFloat(r[c.key]) || 0), 0);
          return c.format ? c.format(sum) : sum;
        }
        return c.key === columns[0].key ? "TOTAL" : "";
      }));
    }
    const csv = [headers, ...dataRows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // This is exactly what GenericListTemplate expects
  const pdfData = {
    title, subtitle, docId,
    columns, rows,
    summaryPills, showTotals, totalColumns,
  };

  return {
    exportProps: {
      title,
      filename,
      template,
      pdfData,        // <-- named pdfData, not templateData
      printStyles,
      pdfOpen,
      onOpenPdf:    () => setPdfOpen(true),
      onClosePdf:   () => setPdfOpen(false),
      onExportExcel,
    },
  };
};

export default useExport;