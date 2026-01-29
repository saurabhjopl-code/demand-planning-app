// ===================================================
// Demand Report – 45 Days SC (FINAL FIXED VERSION)
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
  const styleSales = {};
  const styleSkuSales = {};

  sale.forEach(r => {
    const style = r["Style ID"];
    const sku = r["Uniware SKU"];
    const units = Number(r["Units"] || 0);

    styleSales[style] = (styleSales[style] || 0) + units;

    if (!styleSkuSales[style]) styleSkuSales[style] = {};
    styleSkuSales[style][sku] =
      (styleSkuSales[style][sku] || 0) + units;
  });

  // ----------------------------------
  // STOCK AGGREGATION (FIXED)
  // ----------------------------------
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
      styleSellerStock[style] =
        (styleSellerStock[style] || 0) + units;

      if (!skuSellerStock[style]) skuSellerStock[style] = {};
      skuSellerStock[style][sku] =
        (skuSellerStock[style][sku] || 0) + units;
    } else {
      styleFCStock[style] =
        (styleFCStock[style] || 0) + units;

      if (!skuFCStock[style]) skuFCStock[style] = {};
      skuFCStock[style][sku] =
        (skuFCStock[style][sku] || 0) + units;
    }
  });

  // ----------------------------------
  // BUILD STYLE LEVEL DATA
  // ----------------------------------
  const styles = Object.keys(styleSales).map(style => {
    const sales = styleSales[style];
    const fcStock = styleFCStock[style] || 0;
    const sellerStock = styleSellerStock[style] || 0;
    const totalStock = fcStock + sellerStock;

    const drr = sales / totalSaleDays;
    const sc = drr > 0 ? totalStock / drr : 0;
    const targetStock = drr * 45;
    const demand = Math.max(
      0,
      Math.round(targetStock - sellerStock)
    );

    return {
      style,
      sales,
      fcStock,
      sellerStock,
      totalStock,
      drr,
      sc,
      demand
    };
  });

  // Sort by Demand (High → Low)
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
          <th>Total Stock</th>
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
        <td><b>${s.totalStock}</b></td>
        <td><b>${s.drr.toFixed(2)}</b></td>
        <td><b>${s.sc.toFixed(1)}</b></td>
        <td><b>${s.demand}</b></td>
      </tr>
    `;

    const skuSales = styleSkuSales[s.style] || {};
    const skuFC = skuFCStock[s.style] || {};
    const skuSeller = skuSellerStock[s.style] || {};

    Object.keys(skuSales).forEach(sku => {
      const skuSale = skuSales[sku];
      const skuFCStock = skuFC[sku] || 0;
      const skuSellerStock = skuSeller[sku] || 0;
      const skuTotalStock = skuFCStock + skuSellerStock;

      const skuDRR = skuSale / totalSaleDays;
      const skuSC = skuDRR > 0 ? skuTotalStock / skuDRR : 0;

      const share = skuSale / s.sales;
      const skuDemand = Math.round(s.demand * share);

      html += `
        <tr class="size-row" data-parent="${s.style}" style="display:none">
          <td></td>
          <td>${sku}</td>
          <td>${skuSale}</td>
          <td>${skuFCStock}</td>
          <td>${skuSellerStock}</td>
          <td>${skuTotalStock}</td>
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
        .querySelectorAll(\`.size-row[data-parent="\${style}"]\`)
        .forEach(r => {
          r.style.display = expanded ? "table-row" : "none";
        });
    });
  });
}
