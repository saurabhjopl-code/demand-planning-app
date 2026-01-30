// ===================================================
// Broken Size Report
// ===================================================

export function renderBrokenSizeReport(data) {
  const container = document.getElementById("report-content");
  container.innerHTML = "";

  const { sale, stock, styleStatus, sizeCount, totalSaleDays } = data;

  if (!sizeCount || !sizeCount.length) {
    container.innerHTML =
      `<p style="padding:12px;color:#6b7280">Size Count data not available</p>`;
    return;
  }

  // ---- Exclude CLOSED styles ----
  const closedStyles = new Set(
    styleStatus
      .filter(r => r["Company Remark"] === "Closed")
      .map(r => r["Style ID"])
  );

  // ---- Build Size Count Map ----
  const expectedSizeMap = {};
  sizeCount.forEach(r => {
    expectedSizeMap[r["Style ID"]] = Number(r["Size Count"] || 0);
  });

  // ---- Aggregate Stock by Style+Size ----
  const stockMap = {};
  stock.forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    stockMap[style] ??= {};
    stockMap[style][size] = (stockMap[style][size] || 0) + units;
  });

  // ---- Aggregate Sale ----
  const saleMap = {};
  sale.forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    saleMap[style] = (saleMap[style] || 0) + Number(r["Units"] || 0);
  });

  // ---- Build Rows ----
  const rows = [];

  Object.keys(expectedSizeMap).forEach(style => {
    if (closedStyles.has(style)) return;

    const sizeStock = stockMap[style] || {};
    const brokenSizes = Object.entries(sizeStock)
      .filter(([, qty]) => qty < 10)
      .map(([size]) => size);

    const brokenCount = brokenSizes.length;
    if (!brokenCount) return;

    const totalStock = Object.values(sizeStock).reduce((a, b) => a + b, 0);
    const totalSale = saleMap[style] || 0;
    const drr = totalSaleDays ? totalSale / totalSaleDays : 0;
    const sc = drr ? totalStock / drr : 0;

    rows.push({
      style,
      totalSizes: expectedSizeMap[style],
      brokenCount,
      brokenSizes: brokenSizes.join(", "),
      totalSale,
      totalStock,
      drr: drr.toFixed(2),
      sc: sc.toFixed(1)
    });
  });

  if (!rows.length) {
    container.innerHTML =
      `<p style="padding:12px;color:#6b7280">No broken sizes found</p>`;
    return;
  }

  // ---- Render Table ----
  container.innerHTML = `
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
        ${rows.map(r => `
          <tr>
            <td>${r.style}</td>
            <td>${r.totalSizes}</td>
            <td>${r.brokenCount}</td>
            <td>${r.brokenSizes}</td>
            <td>${r.totalSale}</td>
            <td>${r.totalStock}</td>
            <td>${r.drr}</td>
            <td>${r.sc}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}
