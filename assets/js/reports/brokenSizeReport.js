export function renderBrokenSizeReport(data) {
  const container = document.getElementById("report-content");

  const sale = data.sale;
  const stock = data.stock;
  const styleStatus = data.styleStatus;
  const sizeCountSheet = data.sizeCount;
  const totalSaleDays = data.totalSaleDays;

  // ===============================
  // EXCLUDE CLOSED STYLES
  // ===============================
  const closedStyles = new Set(
    styleStatus
      .filter(r => String(r["Company Remark"]).toUpperCase() === "CLOSED")
      .map(r => r["Style ID"])
  );

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
  // SIZE COUNT LOOKUP
  // ===============================
  const totalSizeMap = {};
  sizeCountSheet.forEach(r => {
    totalSizeMap[r["Style ID"]] = Number(r["Size Count"] || 0);
  });

  // ===============================
  // BUILD REPORT ROWS
  // ===============================
  const rows = [];

  Object.keys(totalSizeMap).forEach(style => {
    if (closedStyles.has(style)) return;

    const sizes = stockByStyleSize[style] || {};
    const brokenSizes = [];

    Object.keys(sizes).forEach(size => {
      if (sizes[size] < 10) {
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
      totalSizes: totalSizeMap[style],
      brokenCount: brokenSizes.length,
      brokenSizes: brokenSizes.join(", "),
      totalSold,
      totalStock,
      drr,
      sc
    });
  });

  // SORT: Broken Count ↓
  rows.sort((a, b) => b.brokenCount - a.brokenCount);

  // ===============================
  // RENDER TABLE
  // ===============================
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
