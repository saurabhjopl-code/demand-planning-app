// ===================================================
// Summary 6: Category-wise Sale (FINAL)
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
  // Build Rows
  // -------------------------------
  const rows = [];

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

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
