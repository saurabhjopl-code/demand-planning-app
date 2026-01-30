// ===================================================
// Broken Size Report
// Logic:
// - Broken size = size with Total Stock < 10
// - Total Sizes from "Size Count" sheet (if present)
// - Exclude Company Remark = "Closed"
// - Fully filter-aware
// ===================================================

export function renderBrokenSizeReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;

  const {
    sale,
    stock,
    styleStatus,
    sizeCount = [],
    totalSaleDays
  } = data;

  // -------------------------------
  // Build Closed Style Set
  // -------------------------------
  const closedStyles = new Set(
    (styleStatus || [])
      .filter(r => String(r["Company Remark"]).toUpperCase() === "CLOSED")
      .map(r => r["Style ID"])
  );

  // -------------------------------
  // Style Universe (Sale + Stock)
  // -------------------------------
  const styleSet = new Set();

  (sale || []).forEach(r => {
    if (!closedStyles.has(r["Style ID"])) {
      styleSet.add(r["Style ID"]);
    }
  });

  (stock || []).forEach(r => {
    if (!closedStyles.has(r["Style ID"])) {
      styleSet.add(r["Style ID"]);
    }
  });

  // -------------------------------
  // Total Sales by Style
  // -------------------------------
  const styleSales = {};
  (sale || []).forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;
    styleSales[style] = (styleSales[style] || 0) + Number(r["Units"] || 0);
  });

  // -------------------------------
  // Stock by Style & Size
  // -------------------------------
  const stockByStyleSize = {};
  const styleStockTotal = {};

  (stock || []).forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    if (!stockByStyleSize[style]) stockByStyleSize[style] = {};
    stockByStyleSize[style][size] =
      (stockByStyleSize[style][size] || 0) + units;

    styleStockTotal[style] = (styleStockTotal[style] || 0) + units;
  });

  // -------------------------------
  // Total Size Count Lookup
  // -------------------------------
  const totalSizeMap = {};
  (sizeCount || []).forEach(r => {
    totalSizeMap[r["Style ID"]] = Number(r["Size Count"] || 0);
  });

  // -------------------------------
  // Build Rows
  // -------------------------------
  const rows = [];

  styleSet.forEach(style => {
    const sizeStock = stockByStyleSize[style] || {};
    const brokenSizes = [];

    Object.keys(sizeStock).forEach(size => {
      if (Number(sizeStock[size]) < 10) {
        brokenSizes.push(size);
      }
    });

    if (brokenSizes.length === 0) return;

    const totalSold = styleSales[style] || 0;
    const totalStock = styleStockTotal[style] || 0;
    const drr = totalSaleDays ? totalSold / totalSaleDays : 0;
    const sc = drr ? totalStock / drr : 0;

    rows.push({
      style,
      totalSizes: totalSizeMap[style] || "",
      brokenCount: brokenSizes.length,
      brokenSizes: brokenSizes.join(", "),
      totalSold,
      totalStock,
      drr,
      sc
    });
  });

  // -------------------------------
  // Sort: Broken Count ↓ then Sales ↓
  // -------------------------------
  rows.sort((a, b) => {
    if (b.brokenCount !== a.brokenCount) {
      return b.brokenCount - a.brokenCount;
    }
    return b.totalSold - a.totalSold;
  });

  // -------------------------------
  // Render
  // -------------------------------
  if (rows.length === 0) {
    container.innerHTML =
      `<p style="padding:12px;color:#6b7280">
        No broken sizes found for current filters.
      </p>`;
    return;
  }

  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th>Style ID</th>
          <th>Total Sizes</th>
          <th>Broken Count</th>
          <th>Broken Sizes</th>
          <th>Total Units Sold</th>
          <th>Total Stock</th>
          <th>DRR</th>
          <th>SC</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach(r => {
    html += `
      <tr>
        <td><b>${r.style}</b></td>
        <td>${r.totalSizes}</td>
        <td><b>${r.brokenCount}</b></td>
        <td>${r.brokenSizes}</td>
        <td>${r.totalSold}</td>
        <td>${r.totalStock}</td>
        <td>${r.drr.toFixed(2)}</td>
        <td>${r.sc.toFixed(1)}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
