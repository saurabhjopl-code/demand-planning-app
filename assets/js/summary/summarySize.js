// ===================================================
// Summary 4: Size-wise Analysis Summary
// Table:
// Size | Category | Units Sold | % Share | Category % Share | Units in Stock
// ===================================================

export function renderSummarySize(data) {
  const container = document.getElementById("summary-4");
  if (!container) return;

  const sale = data.sale;
  const stock = data.stock;

  // -------------------------------
  // Size → Category Mapping
  // -------------------------------
  function getSizeCategory(size) {
    if (size === "FS") return "FS";

    const normalSizes = ["S", "M", "L", "XL", "XXL"];
    const plus1Sizes = ["3XL", "4XL", "5XL", "6XL"];
    const plus2Sizes = ["7XL", "8XL", "9XL", "10XL"];

    if (normalSizes.includes(size)) return "Normal";
    if (plus1Sizes.includes(size)) return "PLUS 1";
    if (plus2Sizes.includes(size)) return "PLUS 2";

    return "Other";
  }

  // -------------------------------
  // Size → Sale Units
  // -------------------------------
  const sizeSaleMap = {};
  let totalSaleUnits = 0;

  sale.forEach(row => {
    const size = row["Size"];
    const units = Number(row["Units"] || 0);

    if (!sizeSaleMap[size]) sizeSaleMap[size] = 0;
    sizeSaleMap[size] += units;
    totalSaleUnits += units;
  });

  // -------------------------------
  // Size → Stock Units
  // -------------------------------
  const sizeStockMap = {};
  stock.forEach(row => {
    const size = row["Size"];
    const units = Number(row["Units"] || 0);

    if (!sizeStockMap[size]) sizeStockMap[size] = 0;
    sizeStockMap[size] += units;
  });

  // -------------------------------
  // Category → Sale Units
  // -------------------------------
  const categorySaleMap = {};

  Object.keys(sizeSaleMap).forEach(size => {
    const category = getSizeCategory(size);
    const units = sizeSaleMap[size];

    if (!categorySaleMap[category]) categorySaleMap[category] = 0;
    categorySaleMap[category] += units;
  });

  // -------------------------------
  // Build Rows
  // -------------------------------
  const rows = [];

  Object.keys(sizeSaleMap).forEach(size => {
    const unitsSold = sizeSaleMap[size];
    const stockUnits = sizeStockMap[size] || 0;
    const category = getSizeCategory(size);

    const share =
      totalSaleUnits > 0
        ? ((unitsSold / totalSaleUnits) * 100).toFixed(2)
        : "0.00";

    const categoryShare =
      totalSaleUnits > 0
        ? ((categorySaleMap[category] / totalSaleUnits) * 100).toFixed(2)
        : "0.00";

    rows.push({
      size,
      category,
      unitsSold,
      share,
      categoryShare,
      stockUnits
    });
  });

  // -------------------------------
  // Sort by predefined size order
  // -------------------------------
  const sizeOrder = [
    "FS",
    "S", "M", "L", "XL", "XXL",
    "3XL", "4XL", "5XL", "6XL",
    "7XL", "8XL", "9XL", "10XL"
  ];

  rows.sort(
    (a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size)
  );

  // -------------------------------
  // Build Table HTML
  // -------------------------------
  let html = `
    <h3>Size-wise Analysis</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Size</th>
          <th>Category</th>
          <th>Units Sold</th>
          <th>% Share</th>
          <th>Category % Share</th>
          <th>Units in Stock</th>
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
        <td>${r.share}%</td>
        <td>${r.categoryShare}%</td>
        <td>${r.stockUnits}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
