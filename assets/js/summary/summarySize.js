// ===================================================
// Summary 4: Size-wise Analysis
// Size order FIXED
// Grand Total row added
// ===================================================

export function renderSummarySize(data) {
  const container = document.getElementById("summary-4");
  if (!container) return;

  const sale = data.sale;
  const stock = data.stock;

  // -------------------------------
  // REQUIRED SIZE SEQUENCE
  // -------------------------------
  const SIZE_ORDER = [
    "FS",
    "S", "M", "L", "XL", "XXL",
    "3XL", "4XL", "5XL", "6XL",
    "7XL", "8XL", "9XL", "10XL"
  ];

  // -------------------------------
  // Size → Category Map (LOCKED)
  // -------------------------------
  const sizeCategory = size => {
    if (size === "FS") return "FS";
    if (["3XL", "4XL", "5XL", "6XL"].includes(size)) return "PLUS 1";
    if (["7XL", "8XL", "9XL", "10XL"].includes(size)) return "PLUS 2";
    return "Normal";
  };

  // -------------------------------
  // Aggregate Sales by Size
  // -------------------------------
  const sizeSales = {};
  let totalUnitsSold = 0;

  sale.forEach(r => {
    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    sizeSales[size] = (sizeSales[size] || 0) + units;
    totalUnitsSold += units;
  });

  // -------------------------------
  // Aggregate Stock by Size
  // -------------------------------
  const sizeStock = {};
  let totalStock = 0;

  stock.forEach(r => {
    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    sizeStock[size] = (sizeStock[size] || 0) + units;
    totalStock += units;
  });

  // -------------------------------
  // Category Totals
  // -------------------------------
  const categoryTotals = {};

  Object.keys(sizeSales).forEach(size => {
    const cat = sizeCategory(size);
    categoryTotals[cat] = (categoryTotals[cat] || 0) + sizeSales[size];
  });

  // -------------------------------
  // Build Rows in REQUIRED ORDER
  // -------------------------------
  const rows = [];

  SIZE_ORDER.forEach(size => {
    if (!sizeSales[size] && !sizeStock[size]) return;

    const cat = sizeCategory(size);
    const unitsSold = sizeSales[size] || 0;
    const unitsInStock = sizeStock[size] || 0;

    rows.push({
      size,
      category: cat,
      unitsSold,
      totalUnitsSold: categoryTotals[cat] || 0,
      sizeShare: totalUnitsSold
        ? ((unitsSold / totalUnitsSold) * 100).toFixed(2)
        : "0.00",
      categoryShare: totalUnitsSold
        ? (((categoryTotals[cat] || 0) / totalUnitsSold) * 100).toFixed(2)
        : "0.00",
      unitsInStock,
      totalStock
    });
  });

  // -------------------------------
  // Render Table
  // -------------------------------
  let html = `
    <h3>Size-wise Analysis</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Size</th>
          <th>Category</th>
          <th>Units Sold</th>
          <th>Total Units Sold</th>
          <th>Size % Share</th>
          <th>Category % Share</th>
          <th>Units in Stock</th>
          <th>Total Stock</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach(r => {
    html += `
      <tr>
        <td>${r.size}</td>
        <td>${r.category}</td>
        <td>${r.unitsSold}</td>
        <td>${r.totalUnitsSold}</td>
        <td>${r.sizeShare}%</td>
        <td>${r.categoryShare}%</td>
        <td>${r.unitsInStock}</td>
        <td>${r.totalStock}</td>
      </tr>
    `;
  });

  // -------------------------------
  // Grand Total Row
  // -------------------------------
  html += `
      <tr style="font-weight:700;background:#f8fafc">
        <td colspan="2">Grand Total</td>
        <td>${totalUnitsSold}</td>
        <td></td>
        <td></td>
        <td></td>
        <td>${totalStock}</td>
        <td></td>
      </tr>
    </tbody>
    </table>
  `;

  container.innerHTML = html;
}
