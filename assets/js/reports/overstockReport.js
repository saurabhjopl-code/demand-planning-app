export function renderOverstockReport(data) {
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
      skuSellerStock[style][sku] =
        (skuSellerStock[style][sku] || 0) + units;
    } else {
      styleFCStock[style] = (styleFCStock[style] || 0) + units;
      if (!skuFCStock[style]) skuFCStock[style] = {};
      skuFCStock[style][sku] = (skuFCStock[style][sku] || 0) + units;
    }
  });

  // ===============================
  // BUILD STYLE LEVEL DATA
  // ===============================
  const rows = Object.keys(styleSales)
    .map(style => {
      const sales = styleSales[style];
      const fc = styleFCStock[style] || 0;
      const seller = styleSellerStock[style] || 0;
      const total = fc + seller;

      const drr = sales / totalSaleDays;
      const target = drr * 45;
      const excess = Math.round(total - target);
      const sc = drr ? total / drr : 0;

      return {
        style,
        sales,
        fc,
        seller,
        total,
        drr,
        sc,
        excess
      };
    })
    .filter(r => r.excess > 0)
    .sort((a, b) => b.excess - a.excess);

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
          <th>Excess Stock</th>
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
        <td>${r.excess}</td>
      </tr>
    `;

    const skus = skuSales[r.style] || {};
    Object.keys(skus).forEach(sku => {
      const skuFC = (skuFCStock[r.style] || {})[sku] || 0;
      const skuSeller = (skuSellerStock[r.style] || {})[sku] || 0;
      const skuTotal = skuFC + skuSeller;

      const share = skuTotal / r.total;
      const skuExcess = Math.round(r.excess * share);

      html += `
        <tr class="size-row" data-parent="${r.style}" style="display:none">
          <td></td>
          <td>${sku}</td>
          <td>${skus[sku]}</td>
          <td>${skuFC}</td>
          <td>${skuSeller}</td>
          <td>${skuTotal}</td>
          <td></td>
          <td></td>
          <td>${skuExcess}</td>
        </tr>
      `;
    });
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  // ===============================
  // EXPAND / COLLAPSE
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
