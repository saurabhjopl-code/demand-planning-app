// ===================================================
// Demand Report – 45 Days SC (V1.3.1 LOCKED)
// ===================================================

export function renderDemandReport(data) {
  const container = document.querySelector(".tab-content");
  if (!container) return;

  const sale = data.sale;
  const stock = data.stock;
  const totalSaleDays = data.totalSaleDays;

  // ----------------------------------
  // SALES AGGREGATION
  // ----------------------------------
  const styleSale = {};
  const styleSizeSale = {};

  sale.forEach(r => {
    const style = r["Style ID"];
    const sku = r["Uniware SKU"];
    const units = Number(r["Units"] || 0);

    styleSale[style] = (styleSale[style] || 0) + units;

    if (!styleSizeSale[style]) styleSizeSale[style] = {};
    styleSizeSale[style][sku] =
      (styleSizeSale[style][sku] || 0) + units;
  });

  // ----------------------------------
  // STOCK AGGREGATION (FC vs SELLER)
  // ----------------------------------
  const styleSellerStock = {};
  const styleFCStock = {};
  const styleSizeSellerStock = {};
  const styleSizeFCStock = {};

  stock.forEach(r => {
    const style = r["Style ID"];
    const sku = r["Uniware SKU"];
    const fc = r["FC"];
    const units = Number(r["Units"] || 0);

    if (fc === "Seller") {
      styleSellerStock[style] =
        (styleSellerStock[style] || 0) + units;

      if (!styleSizeSellerStock[style])
        styleSizeSellerStock[style] = {};
      styleSizeSellerStock[style][sku] =
        (styleSizeSellerStock[style][sku] || 0) + units;
    } else {
      styleFCStock[style] =
        (styleFCStock[style] || 0) + units;

      if (!styleSizeFCStock[style])
        styleSizeFCStock[style] = {};
      styleSizeFCStock[style][sku] =
        (styleSizeFCStock[style][sku] || 0) + units;
    }
  });

  // ----------------------------------
  // BUILD & SORT STYLES
  // ----------------------------------
  const styles = Object.keys(styleSale).map(style => {
    const sales = styleSale[style];
    const sellerStock = styleSellerStock[style] || 0;
    const fcStock = styleFCStock[style] || 0;

    const drr = sales / totalSaleDays;
    const sc = drr > 0 ? sellerStock / drr : 0;
    const targetStock = drr * 45;
    const demand = Math.max(
      0,
      Math.round(targetStock - sellerStock)
    );

    return {
      style,
      sales,
      sellerStock,
      fcStock,
      drr,
      sc,
      demand
    };
  });

  styles.sort((a, b) => b.demand - a.demand);

  // ----------------------------------
  // RENDER TABLE
  // ----------------------------------
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th></th>
          <th>Style ID / SKU</th>
          <th>Sales</th>
          <th>FC Stock</th>
          <th>Seller Stock</th>
          <th>DRR</th>
          <th>SC</th>
          <th>Demand</th>
        </tr>
      </thead>
      <tbody>
  `;

  styles.forEach(s => {
    html += `
      <tr class="style-row" data-style="${s.style}">
        <td class="toggle">+</td>
        <td><b>${s.style}</b></td>
        <td><b>${s.sales}</b></td>
        <td><b>${s.fcStock}</b></td>
        <td><b>${s.sellerStock}</b></td>
        <td><b>${s.drr.toFixed(2)}</b></td>
        <td><b>${s.sc.toFixed(1)}</b></td>
        <td><b>${s.demand}</b></td>
      </tr>
    `;

    const sizeSales = styleSizeSale[s.style] || {};
    const sizeSellerStocks = styleSizeSellerStock[s.style] || {};
    const sizeFCStocks = styleSizeFCStock[s.style] || {};

    Object.keys(sizeSales).forEach(sku => {
      const skuSale = sizeSales[sku];
      const skuSellerStock = sizeSellerStocks[sku] || 0;
      const skuFCStock = sizeFCStocks[sku] || 0;

      const skuDRR = skuSale / totalSaleDays;
      const skuSC = skuDRR > 0 ? skuSellerStock / skuDRR : 0;
      const share = skuSale / s.sales;
      const skuDemand = Math.round(s.demand * share);

      html += `
        <tr class="size-row" data-parent="${s.style}" style="display:none">
          <td></td>
          <td>${sku}</td>
          <td>${skuSale}</td>
          <td>${skuFCStock}</td>
          <td>${skuSellerStock}</td>
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
  // EXPAND / COLLAPSE
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
