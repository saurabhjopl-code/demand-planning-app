export function renderSizeCurveReport(data) {
  const container = document.getElementById("report-content");

  const sale = data.sale;
  const stock = data.stock;
  const totalSaleDays = data.totalSaleDays;

  const SIZE_ORDER = [
    "FS","S","M","L","XL","XXL",
    "3XL","4XL","5XL","6XL",
    "7XL","8XL","9XL","10XL"
  ];

  // ===============================
  // SALES BY STYLE & SIZE
  // ===============================
  const styleSales = {};
  const sizeSales = {};

  sale.forEach(r => {
    const style = r["Style ID"];
    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    styleSales[style] = (styleSales[style] || 0) + units;

    if (!sizeSales[style]) sizeSales[style] = {};
    sizeSales[style][size] = (sizeSales[style][size] || 0) + units;
  });

  // ===============================
  // SELLER STOCK BY STYLE
  // ===============================
  const sellerStock = {};

  stock.forEach(r => {
    if (String(r["FC"]).toUpperCase() !== "SELLER") return;
    const style = r["Style ID"];
    sellerStock[style] = (sellerStock[style] || 0) + Number(r["Units"] || 0);
  });

  // ===============================
  // PREPARE STYLE DATA
  // ===============================
  const styles = Object.keys(styleSales).map(style => {
    const totalSales = styleSales[style];
    const drr = totalSales / totalSaleDays;
    const demand = Math.max(
      0,
      Math.round(drr * 45 - (sellerStock[style] || 0))
    );

    return {
      style,
      totalSales,
      demand
    };
  });

  // Sort by Style Demand High → Low
  styles.sort((a, b) => b.demand - a.demand);

  // ===============================
  // BUILD TABLE
  // ===============================
  let html = `
    <div style="background:#eef2ff;padding:10px 12px;border-left:4px solid #2563eb;margin-bottom:12px;font-size:13px">
      <b>How to read this</b><br>
      • Style Demand = units needed to reach target SC (45 Days)<br>
      • Allocation based on real size sales mix<br>
      • “FS” means Free Size
    </div>

    <table class="summary-table">
      <thead>
        <tr>
          <th rowspan="2">Style</th>
          <th rowspan="2">Style Demand</th>
          <th colspan="${SIZE_ORDER.length}">Recommended Buy (Qty)</th>
        </tr>
        <tr>
          ${SIZE_ORDER.map(s => `<th>${s}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
  `;

  styles.forEach(obj => {
    const style = obj.style;
    const styleDemand = obj.demand;
    const totalSales = obj.totalSales;

    html += `
      <tr>
        <td><b>${style}</b></td>
        <td><b>${styleDemand}</b></td>
    `;

    SIZE_ORDER.forEach(size => {
      const sizeSale = (sizeSales[style] || {})[size] || 0;
      const mix = totalSales ? sizeSale / totalSales : 0;
      const recBuy = Math.round(styleDemand * mix);

      html += `<td>${recBuy || ""}</td>`;
    });

    html += `</tr>`;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
