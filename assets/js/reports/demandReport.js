// ===================================================
// Demand Report – 45 Days SC (V1.3 UI FORMAT)
// ===================================================

export function renderDemandReport(data) {
  const container = document.querySelector(".tab-content");
  if (!container) return;

  const sale = data.sale;
  const stock = data.stock;
  const totalSaleDays = data.totalSaleDays;

  // ----------------------------------
  // Aggregate Sales & Stock
  // ----------------------------------
  const styleSale = {};
  const styleStock = {};
  const styleSizeSale = {};
  const styleSizeStock = {};

  sale.forEach(r => {
    const style = r["Style ID"];
    const sku = r["Uniware SKU"];
    const units = Number(r["Units"] || 0);

    styleSale[style] = (styleSale[style] || 0) + units;

    if (!styleSizeSale[style]) styleSizeSale[style] = {};
    styleSizeSale[style][sku] =
      (styleSizeSale[style][sku] || 0) + units;
  });

  stock.forEach(r => {
    const style = r["Style ID"];
    const sku = r["Uniware SKU"];
    const units = Number(r["Units"] || 0);

    styleStock[style] = (styleStock[style] || 0) + units;

    if (!styleSizeStock[style]) styleSizeStock[style] = {};
    styleSizeStock[style][sku] =
      (styleSizeStock[style][sku] || 0) + units;
  });

  // ----------------------------------
  // Build Table
  // ----------------------------------
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th></th>
          <th>Style ID / SKU</th>
          <th>Sales</th>
          <th>Stock</th>
          <th>DRR</th>
          <th>SC</th>
          <th>Demand</th>
        </tr>
      </thead>
      <tbody>
  `;

  Object.keys(styleSale).forEach(style => {
    const totalSale = styleSale[style];
    const totalStock = styleStock[style] || 0;

    if (!totalSale) return;

    const drr = totalSale / totalSaleDays;
    const sc = drr > 0 ? totalStock / drr : 0;
    const targetStock = drr * 45;
    const styleDemand = Math.max(
      0,
      Math.round(targetStock - totalStock)
    );

    // ---------------- STYLE ROW ----------------
    html += `
      <tr class="style-row" data-style="${style}">
        <td class="toggle">+</td>
        <td><b>${style}</b></td>
        <td><b>${totalSale}</b></td>
        <td><b>${totalStock}</b></td>
        <td><b>${drr.toFixed(2)}</b></td>
        <td><b>${sc.toFixed(1)}</b></td>
        <td><b>${styleDemand}</b></td>
      </tr>
    `;

    // ---------------- SIZE ROWS ----------------
    const sizeSales = styleSizeSale[style] || {};
    const sizeStocks = styleSizeStock[style] || {};

    Object.keys(sizeSales).forEach(sku => {
      const skuSale = sizeSales[sku];
      const skuStock = sizeStocks[sku] || 0;

      const skuDRR = skuSale / totalSaleDays;
      const skuSC = skuDRR > 0 ? skuStock / skuDRR : 0;

      const share = skuSale / totalSale;
      const skuDemand = Math.round(styleDemand * share);

      html += `
        <tr class="size-row" data-parent="${style}" style="display:none">
          <td></td>
          <td>${sku}</td>
          <td>${skuSale}</td>
          <td>${skuStock}</td>
          <td>${skuDRR.toFixed(2)}</td>
          <td>${skuSC.toFixed(1)}</td>
          <td>${skuDemand}</td>
        </tr>
      `;
    });
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;

  // ----------------------------------
  // Expand / Collapse Logic
  // ----------------------------------
  container.querySelectorAll(".style-row").forEach(row => {
    row.addEventListener("click", () => {
      const style = row.dataset.style;
      const expanded = row.classList.toggle("expanded");
      row.querySelector(".toggle").textContent = expanded ? "–" : "+";

      container
        .querySelectorAll(`.size-row[data-parent="${style}"]`)
        .forEach(r => {
          r.style.display = expanded ? "table-row" : "none";
        });
    });
  });
}
