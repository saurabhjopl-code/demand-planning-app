// ===================================================
// Summary 4: Size-wise Analysis Summary (FINAL)
// Size order FIXED (FS → XS → S … 10XL)
// Grand Total row INCLUDED
// ===================================================

export function renderSummarySize(data) {
  const container = document.getElementById("summary-4");
  if (!container) return;

  const sale = data.sale;
  const stock = data.stock;

  // -------------------------------
  // Size → Category Mapping (LOCKED)
  // -------------------------------
  function getCategory(size) {
    if (size === "FS") return "FS";

    const normal = ["XS", "S", "M", "L", "XL", "XXL"];
    const plus1 = ["3XL", "4XL", "5XL", "6XL"];
    const plus2 = ["7XL", "8XL", "9XL", "10XL"];

    if (normal.includes(size)) return "Normal";
    if (plus1.includes(size)) return "PLUS 1";
    if (plus2.includes(size)) return "PLUS 2";

    return "Other";
  }

  // -------------------------------
  // Size-level Sales
  // -------------------------------
  const sizeSale = {};
  let totalSale = 0;

  sale.forEach(r => {
    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    sizeSale[size] = (sizeSale[size] || 0) + units;
    totalSale += units;
  });

  // -------------------------------
  // Size-level Stock
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
  // Category Aggregation
  // -------------------------------
  const categoryData = {};

  Object.keys(sizeSale).forEach(size => {
    const cat = getCategory(size);

    if (!categoryData[cat]) {
      categoryData[cat] = {
        sizes: [],
        saleTotal: 0,
        stockTotal: 0
      };
    }

    categoryData[cat].sizes.push(size);
    categoryData[cat].saleTotal += sizeSale[size];
    categoryData[cat].stockTotal += sizeStock[size] || 0;
  });

  // -------------------------------
  // Size Order (FINAL LOCK)
  // -------------------------------
  const sizeOrder = [
    "FS",
    "XS", "S", "M", "L", "XL", "XXL",
    "3XL", "4XL", "5XL", "6XL",
    "7XL", "8XL", "9XL", "10XL"
  ];

  // -------------------------------
  // Build Table
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

  Object.keys(categoryData).forEach(category => {
    const cat = categoryData[category];
    const sizes = cat.sizes.sort(
      (a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b)
    );

    const catShare = totalSale > 0
      ? ((cat.saleTotal / totalSale) * 100).toFixed(2)
      : "0.00";

    sizes.forEach((size, idx) => {
      const unitsSold = sizeSale[size] || 0;
      const stockUnits = sizeStock[size] || 0;

      const sizeShare = totalSale > 0
        ? ((unitsSold / totalSale) * 100).toFixed(2)
        : "0.00";

      html += `<tr>
        <td>${size}</td>`;

      if (idx === 0) {
        html += `<td rowspan="${sizes.length}">${category}</td>`;
      }

      html += `<td>${unitsSold}</td>`;

      if (idx === 0) {
        html += `<td rowspan="${sizes.length}">${cat.saleTotal}</td>`;
      }

      html += `<td>${sizeShare}%</td>`;

      if (idx === 0) {
        html += `<td rowspan="${sizes.length}">${catShare}%</td>`;
      }

      html += `<td>${stockUnits}</td>`;

      if (idx === 0) {
        html += `<td rowspan="${sizes.length}">${cat.stockTotal}</td>`;
      }

      html += `</tr>`;
    });
  });

  // -------------------------------
  // Grand Total Row
  // -------------------------------
  html += `
      <tr style="font-weight:700;background:#f8fafc">
        <td colspan="2">Grand Total</td>
        <td>${totalSale}</td>
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
