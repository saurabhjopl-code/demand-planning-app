// ===================================================
// Summary 4: Size-wise Analysis Summary (FINAL FIX)
// GLOBAL SIZE SEQUENCE ENFORCED
// ===================================================

export function renderSummarySize(data) {
  const container = document.getElementById("summary-4");
  if (!container) return;

  const sale = data.sale;
  const stock = data.stock;

  // -------------------------------
  // Size → Category Mapping
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
  // GLOBAL SIZE ORDER (LOCKED)
  // -------------------------------
  const sizeOrder = [
    "FS",
    "XS", "S", "M", "L", "XL", "XXL",
    "3XL", "4XL", "5XL", "6XL",
    "7XL", "8XL", "9XL", "10XL"
  ];

  // -------------------------------
  // Aggregate Sales
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
  // Aggregate Stock
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
  // Category Aggregates
  // -------------------------------
  const categoryTotals = {};

  sizeOrder.forEach(size => {
    if (!sizeSale[size]) return;

    const cat = getCategory(size);
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = {
        sale: 0,
        stock: 0,
        sizes: []
      };
    }

    categoryTotals[cat].sale += sizeSale[size];
    categoryTotals[cat].stock += sizeStock[size] || 0;
    categoryTotals[cat].sizes.push(size);
  });

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

  const categoryRowUsed = {};

  sizeOrder.forEach(size => {
    if (!sizeSale[size]) return;

    const cat = getCategory(size);
    const unitsSold = sizeSale[size];
    const stockUnits = sizeStock[size] || 0;

    const sizeShare = totalSale > 0
      ? ((unitsSold / totalSale) * 100).toFixed(2)
      : "0.00";

    const catShare = totalSale > 0
      ? ((categoryTotals[cat].sale / totalSale) * 100).toFixed(2)
      : "0.00";

    html += `<tr>
      <td>${size}</td>`;

    // Category column (rowspan once)
    if (!categoryRowUsed[cat]) {
      html += `<td rowspan="${categoryTotals[cat].sizes.length}">${cat}</td>`;
      categoryRowUsed[cat] = true;
    }

    html += `
      <td>${unitsSold}</td>`;

    // Category total sale (rowspan once)
    if (categoryRowUsed[cat] === true) {
      html += `<td rowspan="${categoryTotals[cat].sizes.length}">
        ${categoryTotals[cat].sale}
      </td>`;
    }

    html += `<td>${sizeShare}%</td>`;

    // Category % share (rowspan once)
    if (categoryRowUsed[cat] === true) {
      html += `<td rowspan="${categoryTotals[cat].sizes.length}">
        ${catShare}%
      </td>`;
    }

    html += `
      <td>${stockUnits}</td>`;

    // Category total stock (rowspan once)
    if (categoryRowUsed[cat] === true) {
      html += `<td rowspan="${categoryTotals[cat].sizes.length}">
        ${categoryTotals[cat].stock}
      </td>`;
      categoryRowUsed[cat] = "done";
    }

    html += `</tr>`;
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
  `;

  html += `</tbody></table>`;
  container.innerHTML = html;
}
