export function renderDemandReport(data) {
  const container = document.getElementById("report-content");

  const sale = data.sale;
  const stock = data.stock;
  const totalSaleDays = data.totalSaleDays;

  // ===============================
  // SALES AGGREGATION
  // ===============================
  const styleSales = {};
  const skuSales = {};

  sale.forEach(r => {
    const style = r["Style ID"];
    const sku = r["Uniware SKU"];
    const units = Number(r["Units"] || 0);

    styleSales[style] = (styleSales[style] || 0) + units;

    if (!skuSales[style]) skuSales[style] = {};
    skuSales[style][sku] = (skuSales[style][sku] || 0) + units;
  });

  // ===============================
  // STOCK AGGREGATION
  // ===============================
  const styleFCStock = {};
  const styleSellerStock = {};
  const skuFCStock = {};
  const skuSellerStock = {};

  stock.forEach(r => {
    const style = r["Style ID"];
    const sku = r["Uniware SKU"];
    const fc = String(r["FC"] || "").trim().toUpperCase();
    const units = Number(r["Units"] || 0);

    if (fc === "SELLER") {
      styleSellerStock[style] = (styleSellerStock[style] || 0) + units;
      if (!skuSellerStock[style]) skuSellerStock[style] = {};
      skuSellerStock[style][sku] = (skuSellerStock[style][sku] || 0) + units;
    } else {
      styleFCStock[style] = (styleFCStock[style] || 0) + units;
      if (!skuFCStock[style]) skuFCStock[style] = {};
      skuFCStock[style][sku] = (skuFCStock[style][sku] || 0) + units;
    }
  });

  // ===============================
  // BUILD STYLE LEVEL DATA
  // ===============================
  const rows = Object.keys(styleSales).map(style => {
    const sales = styleSales[style];
    const fc = styleFCStock[style] || 0;
    const seller = styleSellerStock[style] || 0;
    const total = fc + seller;

    const drr = sales / totalSaleDays;
    const sc = drr ? total / drr : 0;
    const demand = Math.max(0, Math.round(drr * 45 - seller));

    return { style, sales, fc, seller, total, drr, sc, demand };
  }).sort((a, b) => b.demand - a.demand);

  // ===============================
  // RENDER TABLE
  // ===============================
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th></th>
          <th>Style ID / SKU</th>
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
      <tr class="style-row" data-style="${r.style}">
        <td class="toggle">+</td>
        <td>${r.style}</td>
        <td>${r.sales}</td>
        <td>${r.fc}</td>
        <td>${r.seller}</td>
        <td>${r.total}</td>
        <td>${r.drr.toFixed(2)}</td>
        <td>${r.sc.toFixed(1)}</td>
        <td>${r.demand}</td>
      </tr>
    `;

    const skus = skuSales[r.style] || {};
    Object.keys(skus).forEach(sku => {
      const skuSale = skus[sku];
      const skuFC = (skuFCStock[r.style] || {})[sku] || 0;
      const skuSeller = (skuSellerStock[r.style] || {})[sku] || 0;
      const skuTotal = skuFC + skuSeller;

      const skuDRR = skuSale / totalSaleDays;
      const skuSC = skuDRR ? skuTotal / skuDRR : 0;
      const share = skuSale / r.sales;
      const skuDemand = Math.round(r.demand * share);

      html += `
        <tr class="size-row" data-parent="${r.style}" style="display:none">
          <td></td>
          <td>${sku}</td>
          <td>${skuSale}</td>
          <td>${skuFC}</td>
          <td>${skuSeller}</td>
          <td>${skuTotal}</td>
          <td>${skuDRR.toFixed(2)}</td>
          <td>${skuSC.toFixed(1)}</td>
          <td>${skuDemand}</td>
        </tr>
      `;
    });
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  // ===============================
  // EXPAND / COLLAPSE LOGIC
  // ===============================
  container.querySelectorAll(".style-row").forEach(row => {
    row.addEventListener("click", () => {
      const style = row.dataset.style;
      const expanded = row.classList.toggle("expanded");
      row.querySelector(".toggle").textContent = expanded ? "−" : "+";

      container
        .querySelectorAll(`.size-row[data-parent="${style}"]`)
        .forEach(r => {
          r.style.display = expanded ? "table-row" : "none";
        });
    });
  });
}
