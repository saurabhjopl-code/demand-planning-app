// ===================================================
// Summary 4: Size-wise Analysis Summary
// Table:
// Size | Category | Units Sold | % Share | Category % Share | Units in Stock
//
// - XS treated as Normal
// - Category & Category % Share merged (rowspan)
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

    const normalSizes = ["XS", "S", "M", "L", "XL", "XXL"];
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
  // Category → Sizes + Sale Units
  // -------------------------------
  const categoryMap = {};

  Object.keys(sizeSaleMap).forEach(size => {
    const category = getSizeCategory(size);
    if (!categoryMap[category]) {
      categoryMap[category] = {
        sizes: [],
        saleUnits: 0
      };
    }

    categoryMap[category].sizes.push(size);
    categoryMap[category].saleUnits += sizeSaleMap[size];
  });

  // -------------------------------
  // Size Order (Locked)
  // -------------------------------
  const sizeOrder = [
    "FS",
    "XS", "S", "M", "L", "XL", "XXL",
    "3XL", "4XL", "5XL", "6XL",
    "7XL", "8XL", "9XL", "10XL"
  ];

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

  // Loop category by category (to manage rowspan)
  Object.keys(categoryMap).forEach(category => {
    const sizes = categoryMap[category].sizes
      .sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));

    const categoryShare =
      totalSaleUnits > 0
        ? ((categoryMap[category].saleUnits / totalSaleUnits) * 100).toFixed(2)
        : "0.00";

    sizes.forEach((size, index) => {
      const unitsSold = sizeSaleMap[size];
      const stockUnits = sizeStockMap[size] || 0;

      const sizeShare =
        totalSaleUnits > 0
          ? ((unitsSold / totalSaleUnits) * 100).toFixed(2)
          : "0.00";

      html += `<tr>
        <td>${size}</td>`;

      // Category cell (merged)
      if (index === 0) {
        html += `
          <td rowspan="${sizes.length}">${category}</td>
        `;
      }

      html += `
        <td>${unitsSold}</td>
        <td>${sizeShare}%</td>
      `;

      // Category % Share cell (merged)
      if (index === 0) {
        html += `
          <td rowspan="${sizes.length}">${categoryShare}%</td>
        `;
      }

      html += `
        <td>${stockUnits}</td>
      </tr>`;
    });
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
