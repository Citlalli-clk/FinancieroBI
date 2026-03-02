import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

interface ExportRow {
  [key: string]: string | number
}

/**
 * Export visible table data to Excel
 */
export function exportExcel(
  rows: ExportRow[],
  headers: string[],
  keys: string[],
  filename: string
) {
  const data = rows.map(row => {
    const obj: Record<string, string | number> = {}
    headers.forEach((h, i) => {
      obj[h] = row[keys[i]] ?? ""
    })
    return obj
  })

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Datos")
  XLSX.writeFile(wb, filename)
}

/**
 * Export table element to PDF with logo and metadata
 */
export async function exportPDF(
  tableRef: HTMLElement,
  title: string,
  filters: string
) {
  const canvas = await html2canvas(tableRef, { scale: 2, useCORS: true })
  const imgData = canvas.toDataURL("image/png")

  const pdf = new jsPDF("l", "mm", "a4")
  const pageW = pdf.internal.pageSize.getWidth()

  // Header
  pdf.setFontSize(18)
  pdf.setTextColor(4, 18, 36) // #041224
  pdf.text("ClickSEGUROS", 14, 18)
  pdf.setFontSize(14)
  pdf.setTextColor(230, 40, 0) // #E62800
  pdf.text(title, 14, 28)
  pdf.setFontSize(9)
  pdf.setTextColor(100, 100, 100)
  pdf.text(filters, 14, 35)
  pdf.text(`Exportado: ${new Date().toLocaleString("es-MX")}`, 14, 40)

  // Table image
  const imgW = pageW - 28
  const imgH = (canvas.height * imgW) / canvas.width
  pdf.addImage(imgData, "PNG", 14, 45, imgW, Math.min(imgH, 150))

  pdf.save(`${title.replace(/\s/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
