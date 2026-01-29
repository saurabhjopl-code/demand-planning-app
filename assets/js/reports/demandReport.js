// ===================================================
// Demand Report – FINAL (45 Days SC)
// ===================================================

export function renderDemandReport(data) {
  const container = document.querySelector(".tab-content");

  const sale = data.sale;
  const stock = data.stock;
  const totalSaleDays = data.totalSaleDays;

  const salesByStyle = {};
  const stockFC = {};
  const stockSeller = {};

  sale.forEach(r => {
    const style = r["Style ID"];
    salesByStyle[style] = (salesByStyle[style] || 0) + Number(r["Units"] || 0);
  });

  stock.forEach(r => {
    const style = r["Style ID"];
    const fc = String(r["FC"] || "").trim().toUpperCase();
    const units = Number(r["Units"] || 0);

    if (fc === "SELLER") {
      stockSeller[style] = (stockSeller[style] || 0) + units;
    } else {
      stockFC[style] = (stockFC[style] || 0) + units;
    }
  });

  const rows = Object.keys(salesByStyle).map(style => {
    const sales = salesByStyle[style];
    const fcStock = stockFC[style] || 0;
    const sellerStock = stockSeller[style] || 0;
    const totalStock = fcStock + sellerStock;
    const drr = sales / totalSaleDays;
    const sc = drr > 0 ? totalStock / drr : 0;
    const demand = Math.max(0, Math.round(drr * 45 - sellerStock));

    return { style, sales, fcStock, sellerStock, totalStock, drr, sc, demand };
  }).sort((a, b) => b.demand - a.demand);

  let html = `
    <table class="summary-table">
      <tr>
        <th>Style ID</th>
        <th>Sales</th>
        <th>FC Stock</th>
        <th>Seller Stock</th>
        <th>Total Stock</th>
        <th>DRR</th>
        <th>SC</th>
        <th>Demand</th>
      </tr>
  `;

  rows.forEach(r => {
    html += `
      <tr>
        <td>${r.style}</td>
        <td>${r.sales}</td>
        <td>${r.fcStock}</td>
        <td>${r.sellerStock}</td>
        <td>${r.totalStock}</td>
        <td>${r.drr.toFixed(2)}</td>
        <td>${r.sc.toFixed(1)}</td>
        <td>${r.demand}</td>
      </tr>
    `;
  });

  html += `</table>`;
  container.innerHTML = html;
}
