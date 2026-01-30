export function renderBrokenSizeReport(data) {
  const container = document.getElementById("report-content");

  const sale = data.sale;
  const stock = data.stock;
  const styleStatus = data.styleStatus;
  const sizeCountSheet = data.sizeCount;
  const totalSaleDays = data.totalSaleDays;

  // ===============================
  // CLOSED STYLES
  // ===============================
  const closedStyles = new Set(
    styleStatus
      .filter(r => String(r["Company Remark"]).toUpperCase() === "CLOSED")
      .map(r => r["Style ID"])
  );

  // ===============================
  // STYLE UNIVERSE (SALE + STOCK)
  // ===============================
  const styleSet = new Set();

  sale.forEach(r => {
    if (!closedStyles.has(r["Style ID"])) {
      styleSet.add(r["Style ID"]);
    }
  });

  stock.forEach(r => {
    if (!closedStyles.has(r["Style ID"])) {
      styleSet.add(r["Style ID"]);
    }
  });

  // ===============================
  // TOTAL SALES BY STYLE
  // ===============================
  const styleSales = {};
  sale.forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;
    styleSales[style] = (styleSales[style] || 0) + Number(r["Units"] || 0);
  });

  // ===============================
  // STOCK BY STYLE & SIZE
  // ===============================
  const stockByStyleSize = {};
  const styleStock = {};

  stock.forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    if (!stockByStyleSize[style]) stockByStyleSize[style] = {};
    stockByStyleSize[style][size] =
      (stockByStyleSize[style][size] || 0) + units;

    styleStock[style] = (styleStock[style] || 0) + units;
  });

  // ===============================
  // TOTAL SIZE COUNT (FROM SHEET)
  // ===============================
  const totalSizeMap = {};
  sizeCountSheet.forEach(r => {
    totalSizeMap[r["Style ID"]] = Number(r["Size Count"] || 0);
  });

  // ===============================
  // BUILD REPORT ROWS
  // ===============================
  const rows = [];

  styleSet.forEach(style => {
    const sizeStockMap = stockByStyleSize[style] || {};
    const brokenSizes = [];

    Object.keys(sizeStockMap).forEach(size => {
      if (Number(sizeStockMap[size]) < 10) {
        brokenSizes.push(size);
      }
    });

    if (brokenSizes.length === 0) return;

    const totalSold = styleSales[style] || 0;
    const totalStock = styleStock[style] || 0;
    const drr = totalSold / totalSaleDays;
    const sc = drr ? totalStock / drr : 0;

    rows.push({
      style,
      totalSizes: totalSizeMap[style] || 0,
      brokenCount: brokenSizes.length,
      brokenSizes: brokenSizes.join(", "),
      totalSold,
      totalStock,
      drr,
      sc
    });
  });

  // SORT: Broken Count ↓ then Sales ↓
  rows.sort((a, b) => {
    if (b.brokenCount !== a.brokenCount) {
      return b.brokenCount - a.brokenCount;
    }
    return b.totalSold - a.totalSold;
  });

  // ===============================
  // RENDER
  // ===============================
  if (rows.length === 0) {
    container.innerHTML =
      `<p style="padding:12px;color:#6b7280">No broken sizes found for current filters.</p>`;
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

  html += `</tbody></table>`;
  container.innerHTML = html;
}
