// ===================================================
// Summary 2: Current FC Stock
// Table:
// FC | Total Stock | Total Units Sold | DRR | SC
//
// DRR = FC Total Units Sold / GLOBAL Total Sale Days
// SC  = Total Stock / DRR
// ===================================================

export function renderSummaryStock(data) {
  const container = document.getElementById("summary-2");
  if (!container) return;

  const sale = data.sale;
  const stock = data.stock;
  const totalSaleDays = data.totalSaleDays;

  // -------------------------------
  // FC → Sale Units
  // -------------------------------
  const saleMap = {};
  sale.forEach(row => {
    const fc = row["FC"];
    const units = Number(row["Units"] || 0);

    if (!saleMap[fc]) saleMap[fc] = 0;
    saleMap[fc] += units;
  });

  // -------------------------------
  // FC → Stock Units
  // -------------------------------
  const stockMap = {};
  stock.forEach(row => {
    const fc = row["FC"];
    const units = Number(row["Units"] || 0);

    if (!stockMap[fc]) stockMap[fc] = 0;
    stockMap[fc] += units;
  });

  // -------------------------------
  // Build Table HTML
  // -------------------------------
  let html = `
    <h3>Current FC Stock</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>FC</th>
          <th>Total Stock</th>
          <th>Total Units Sold</th>
          <th>DRR</th>
          <th>SC</th>
        </tr>
      </thead>
      <tbody>
  `;

  const allFCs = new Set([
    ...Object.keys(saleMap),
    ...Object.keys(stockMap)
  ]);

  allFCs.forEach(fc => {
    const totalStock = stockMap[fc] || 0;
    const totalUnitsSold = saleMap[fc] || 0;

    const drr =
      totalSaleDays > 0 ? totalUnitsSold / totalSaleDays : 0;

    let sc = 0;
    if (drr === 0 && totalStock > 0) {
      sc = "∞";
    } else if (drr > 0) {
      sc = (totalStock / drr).toFixed(0);
    }

    html += `
      <tr>
        <td>${fc}</td>
        <td>${totalStock}</td>
        <td>${totalUnitsSold}</td>
        <td>${drr.toFixed(2)}</td>
        <td>${sc}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
