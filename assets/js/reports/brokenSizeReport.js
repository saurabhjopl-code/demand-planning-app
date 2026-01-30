// ===================================================
// Broken Size Report – V2.4.1 (SORTED BY SALE)
// ===================================================
// Uses Size Count sheet
// Excludes Company Remark = Closed
// Excludes Zero Broken Count
// Severity Bands applied
// Sorted by Total Sale (High → Low)
// ===================================================

export function renderBrokenSizeReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;

  container.innerHTML = "";

  const {
    sale,
    stock,
    styleStatus,
    sizeCount,
    totalSaleDays
  } = data;

  // -------------------------------
  // Closed Styles
  // -------------------------------
  const closedStyles = new Set(
    styleStatus
      .filter(r => String(r["Company Remark"]).toUpperCase() === "CLOSED")
      .map(r => r["Style ID"])
  );

  // -------------------------------
  // Size Count Map
  // -------------------------------
  const sizeCountMap = {};
  sizeCount.forEach(r => {
    sizeCountMap[r["Style ID"]] = Number(r["Size Count"] || 0);
  });

  // -------------------------------
  // Sales by Style
  // -------------------------------
  const saleMap = {};
  sale.forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;
    saleMap[style] = (saleMap[style] || 0) + Number(r["Units"] || 0);
  });

  // -------------------------------
  // Stock by Style & Size
  // -------------------------------
  const stockByStyle = {};
  const totalStockMap = {};

  stock.forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    if (!stockByStyle[style]) stockByStyle[style] = {};
    stockByStyle[style][size] =
      (stockByStyle[style][size] || 0) + units;

    totalStockMap[style] =
      (totalStockMap[style] || 0) + units;
  });

  // -------------------------------
  // Build Rows
  // -------------------------------
  const rows = [];

  Object.keys(sizeCountMap).forEach(style => {
    if (closedStyles.has(style)) return;

    const sizeStock = stockByStyle[style] || {};
    const brokenSizes = Object.keys(sizeStock).filter(
      sz => sizeStock[sz] < 10
    );

    const brokenCount = brokenSizes.length;
    if (brokenCount === 0) return;

    const totalSale = saleMap[style] || 0;
    if (totalSale <= 300) return;

    let remark = "";
    let color = "";

    if (brokenCount > 4) {
      remark = "Critical";
      color = "#dc2626";
    } else if (brokenCount > 2) {
      remark = "Warning";
      color = "#d97706";
    } else {
      remark = "Good";
      color = "#16a34a";
    }

    const totalStock = totalStockMap[style] || 0;
    const drr = totalSaleDays ? totalSale / totalSaleDays : 0;
    const sc = drr ? totalStock / drr : 0;

    rows.push({
      style,
      totalSizes: sizeCountMap[style] || 0,
      brokenCount,
      brokenSizes: brokenSizes.join(", "),
      totalSale,
      totalStock,
      drr,
      sc,
      remark,
      color
    });
  });

  // -------------------------------
  // SORT: Total Sale High → Low
  // -------------------------------
  rows.sort((a, b) => b.totalSale - a.totalSale);

  if (!rows.length) {
    container.innerHTML =
      `<p style="padding:12px;color:#6b7280">
        No broken sizes meeting criteria.
      </p>`;
    return;
  }

  // -------------------------------
  // Render Table
  // -------------------------------
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th>Style ID</th>
          <th>Total Sizes</th>
          <th>Broken Count</th>
          <th>Broken Sizes</th>
          <th>Total Sale</th>
          <th>Total Stock</th>
          <th>DRR</th>
          <th>SC</th>
          <th>Remark</th>
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
        <td>${r.totalSale}</td>
        <td>${r.totalStock}</td>
        <td>${r.drr.toFixed(2)}</td>
        <td>${r.sc.toFixed(1)}</td>
        <td style="font-weight:700;color:${r.color}">
          ${r.remark}
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
