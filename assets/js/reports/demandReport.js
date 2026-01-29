export function renderDemandReport(data) {
  const container = document.getElementById("report-content");

  const sale = data.sale;
  const stock = data.stock;
  const totalSaleDays = data.totalSaleDays;

  const sales = {};
  const fcStock = {};
  const sellerStock = {};

  sale.forEach(r => {
    const style = r["Style ID"];
    sales[style] = (sales[style] || 0) + Number(r["Units"] || 0);
  });

  stock.forEach(r => {
    const style = r["Style ID"];
    const fc = String(r["FC"] || "").trim().toUpperCase();
    const units = Number(r["Units"] || 0);

    if (fc === "SELLER") {
      sellerStock[style] = (sellerStock[style] || 0) + units;
    } else {
      fcStock[style] = (fcStock[style] || 0) + units;
    }
  });

  const rows = Object.keys(sales).map(style => {
    const saleQty = sales[style];
    const fc = fcStock[style] || 0;
    const seller = sellerStock[style] || 0;
    const total = fc + seller;
    const drr = saleQty / totalSaleDays;
    const sc = drr ? total / drr : 0;
    const demand = Math.max(0, Math.round(drr * 45 - seller));

    return { style, saleQty, fc, seller, total, drr, sc, demand };
  }).sort((a, b) => b.demand - a.demand);

  let html = `
    <table class="summary-table">
      <thead>
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
      </thead>
      <tbody>
  `;

  rows.forEach(r => {
    html += `
      <tr>
        <td>${r.style}</td>
        <td>${r.saleQty}</td>
        <td>${r.fc}</td>
        <td>${r.seller}</td>
        <td>${r.total}</td>
        <td>${r.drr.toFixed(2)}</td>
        <td>${r.sc.toFixed(1)}</td>
        <td>${r.demand}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}
