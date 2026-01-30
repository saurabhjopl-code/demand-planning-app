// ===================================================
// Broken Size Report (USING SIZE COUNT SHEET)
// ===================================================
// Broken Size = size where TOTAL stock < 10
// Total Sizes = Size Count sheet value
// Excludes Company Remark = Closed
// ===================================================

export function renderBrokenSizeReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;

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
  const closed = new Set(
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
  const salesByStyle = {};
  sale.forEach(r => {
    const s = r["Style ID"];
    if (closed.has(s)) return;
    salesByStyle[s] = (salesByStyle[s] || 0) + Number(r["Units"] || 0);
  });

  // -------------------------------
  // Stock by Style & Size
  // -------------------------------
  const stockByStyle = {};
  const totalStock = {};

  stock.forEach(r => {
    const s = r["Style ID"];
    if (closed.has(s)) return;

    const size = r["Size"];
    const u = Number(r["Units"] || 0);

    if (!stockByStyle[s]) stockByStyle[s] = {};
    stockByStyle[s][size] = (stockByStyle[s][size] || 0) + u;

    totalStock[s] = (totalStock[s] || 0) + u;
  });

  // -------------------------------
  // Build Rows
  // -------------------------------
  const rows = [];

  Object.keys(stockByStyle).forEach(style => {
    const sizes = stockByStyle[style];
    const broken = Object.keys(sizes).filter(sz => sizes[sz] < 10);

    if (!broken.length) return;

    const sold = salesByStyle[style] || 0;
    const drr = totalSaleDays ? sold / totalSaleDays : 0;
    const sc = drr ? totalStock[style] / drr : 0;

    rows.push({
      style,
      totalSizes: sizeCountMap[style] || 0,
      brokenCount: broken.length,
      brokenSizes: broken.join(", "),
      sold,
      stock: totalStock[style] || 0,
      drr,
      sc
    });
  });

  // -------------------------------
  // Sort by Broken Count ↓
  // -------------------------------
  rows.sort((a, b) => b.brokenCount - a.brokenCount);

  if (!rows.length) {
    container.innerHTML = `<p style="padding:12px">No broken sizes found</p>`;
    return;
  }

  // -------------------------------
  // Render
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
        <td>${r.sold}</td>
        <td>${r.stock}</td>
        <td>${r.drr.toFixed(2)}</td>
        <td>${r.sc.toFixed(1)}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}
