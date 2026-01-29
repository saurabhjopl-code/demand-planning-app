// ===================================================
// Demand Report (45 Days SC) – V1.2 LOCKED
// ===================================================

export function renderDemandReport(data) {
  const container = document.querySelector(".tab-content");
  if (!container) return;

  const sale = data.sale;
  const stock = data.stock;
  const totalSaleDays = data.totalSaleDays;

  // -------------------------------
  // Style → Size Sale
  // -------------------------------
  const styleSizeSale = {};
  const styleTotalSale = {};

  sale.forEach(r => {
    const style = r["Style ID"];
    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    if (!styleSizeSale[style]) styleSizeSale[style] = {};
    styleSizeSale[style][size] =
      (styleSizeSale[style][size] || 0) + units;

    styleTotalSale[style] =
      (styleTotalSale[style] || 0) + units;
  });

  // -------------------------------
  // Style → Total Stock
  // -------------------------------
  const styleStock = {};
  stock.forEach(r => {
    const style = r["Style ID"];
    const units = Number(r["Units"] || 0);

    styleStock[style] = (styleStock[style] || 0) + units;
  });

  // -------------------------------
  // Build Report Rows
  // -------------------------------
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th>Style</th>
          <th>Style Demand (45 Days)</th>
          <th colspan="14">Recommended Buy (Qty)</th>
        </tr>
        <tr>
          <th></th>
          <th></th>
          <th>FS</th><th>S</th><th>M</th><th>L</th><th>XL</th><th>XXL</th>
          <th>3XL</th><th>4XL</th><th>5XL</th><th>6XL</th>
          <th>7XL</th><th>8XL</th><th>9XL</th><th>10XL</th>
        </tr>
      </thead>
      <tbody>
  `;

  Object.keys(styleTotalSale).forEach(style => {
    const totalSale = styleTotalSale[style];
    const stockQty = styleStock[style] || 0;

    if (totalSale === 0) return;

    const drr = totalSale / totalSaleDays;
    const targetStock = drr * 45;
    const styleDemand = Math.max(
      0,
      Math.round(targetStock - stockQty)
    );

    html += `
      <tr>
        <td><b>${style}</b></td>
        <td><b>${styleDemand}</b></td>
    `;

    const sizes = [
      "FS","S","M","L","XL","XXL",
      "3XL","4XL","5XL","6XL",
      "7XL","8XL","9XL","10XL"
    ];

    sizes.forEach(size => {
      const sizeSale = styleSizeSale[style][size] || 0;
      const share =
        totalSale > 0 ? sizeSale / totalSale : 0;
      const sizeDemand = Math.round(styleDemand * share);

      html += `<td>${sizeDemand || ""}</td>`;
    });

    html += `</tr>`;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
