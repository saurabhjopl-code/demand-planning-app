// ===================================================
// Summary 6: Category-wise Sale (FINAL + GRAND TOTAL)
// Table:
// Category | Total Units Sold | DRR | Total Stock | SC
//
// DRR = Total Units Sold / GLOBAL Total Sale Days
// SC  = Total Stock / DRR
//
// Sorted by DRR (High → Low)
// ===================================================

export function renderSummaryCategory(data) {
  const container = document.getElementById("summary-6");
  if (!container) return;

  const sale = data.sale;
  const stock = data.stock;
  const styleStatus = data.styleStatus;
  const totalSaleDays = data.totalSaleDays;

  // -------------------------------
  // Style ID → Category
  // -------------------------------
  const styleCategoryMap = {};
  styleStatus.forEach(row => {
    const style = row["Style ID"];
    const category = row["Category"] || "Blank";
    styleCategoryMap[style] = category;
  });

  // -------------------------------
  // Category → Sale Units
  // -------------------------------
  const categorySaleMap = {};
  sale.forEach(row => {
    const style = row["Style ID"];
    const units = Number(row["Units"] || 0);
    const category = styleCategoryMap[style] || "Blank";

    categorySaleMap[category] =
      (categorySaleMap[category] || 0) + units;
  });

  // -------------------------------
  // Category → Stock Units
  // -------------------------------
  const categoryStockMap = {};
  stock.forEach(row => {
    const style = row["Style ID"];
    const units = Number(row["Units"] || 0);
    const category = styleCategoryMap[style] || "Blank";

    categoryStockMap[category] =
      (categoryStockMap[category] || 0) + units;
  });

  // -------------------------------
  // Build Rows + Grand Totals
  // -------------------------------
  const rows = [];

  let grandSale = 0;
  let grandStock = 0;

  Object.keys(categorySaleMap).forEach(category => {
    const totalUnitsSold = categorySaleMap[category];
    const totalStock = categoryStockMap[category] || 0;

    const drr =
      totalSaleDays > 0 ? totalUnitsSold / totalSaleDays : 0;

    let sc = 0;
    if (drr === 0 && totalStock > 0) {
      sc = "∞";
    } else if (drr > 0) {
      sc = (totalStock / drr).toFixed(0);
    }

    grandSale += totalUnitsSold;
    grandStock += totalStock;

    rows.push({
      category,
      totalUnitsSold,
      drr,
      totalStock,
      sc
    });
  });

  // -------------------------------
  // Sort by DRR High → Low
  // -------------------------------
  rows.sort((a, b) => b.drr - a.drr);

  // -------------------------------
  // Grand Total Calculations
  // -------------------------------
  const grandDRR =
    totalSaleDays > 0 ? (grandSale / totalSaleDays).toFixed(2) : "0.00";

  let grandSC = 0;
  if (grandDRR === "0.00" && grandStock > 0) {
    grandSC = "∞";
  } else if (Number(grandDRR) > 0) {
    grandSC = (grandStock / Number(grandDRR)).toFixed(0);
  }

  // -------------------------------
  // Build Table HTML
  // -------------------------------
  let html = `
    <h3>Category-wise Sale</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Total Units Sold</th>
          <th>DRR</th>
          <th>Total Stock</th>
          <th>SC</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach(r => {
    html += `
      <tr>
        <td>${r.category}</td>
        <td>${r.totalUnitsSold}</td>
        <td>${r.drr.toFixed(2)}</td>
        <td>${r.totalStock}</td>
        <td>${r.sc}</td>
      </tr>
    `;
  });

  // -------------------------------
  // Grand Total Row
  // -------------------------------
  html += `
      <tr style="font-weight:700;background:#f8fafc">
        <td>Grand Total</td>
        <td>${grandSale}</td>
        <td>${grandDRR}</td>
        <td>${grandStock}</td>
        <td>${grandSC}</td>
      </tr>
    </tbody>
    </table>
  `;

  container.innerHTML = html;
}
