// ===================================================
// Summary 2: Current FC Stock
// Table:
// FC | Total Stock | Total Units Sold | DRR | SC
//
// DRR = FC Total Units Sold / GLOBAL Total Sale Days
// SC  = Total Stock / DRR
//
// Includes Grand Total row (consolidated calculation)
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
  // Prepare FC list
  // -------------------------------
  const allFCs = new Set([
    ...Object.keys(saleMap),
    ...Object.keys(stockMap)
  ]);

  let grandTotalStock = 0;
  let grandTotalSales = 0;

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

  allFCs.forEach(fc => {
    const totalStock = stockMap[fc] || 0;
    const totalUnitsSold = saleMap[fc] || 0;

    grandTotalStock += totalStock;
    grandTotalSales += totalUnitsSold;

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

  // -------------------------------
  // Grand Total Row (LOCKED LOGIC)
  // -------------------------------
  const grandDRR =
    totalSaleDays > 0 ? grandTotalSales / totalSaleDays : 0;

  let grandSC = 0;
  if (grandDRR === 0 && grandTotalStock > 0) {
    grandSC = "∞";
  } else if (grandDRR > 0) {
    grandSC = (grandTotalStock / grandDRR).toFixed(0);
  }

  html += `
    <tr style="font-weight:600; background:#f8fafc;">
      <td>Grand Total</td>
      <td>${grandTotalStock}</td>
      <td>${grandTotalSales}</td>
      <td>${grandDRR.toFixed(2)}</td>
      <td>${grandSC}</td>
    </tr>
  `;

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
