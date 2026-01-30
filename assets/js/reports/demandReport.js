export function renderDemandReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;

  const { sale, stock, totalSaleDays, styleStatus } = data;

  // ===============================
  // CLOSED STYLE FILTER
  // ===============================
  const closedStyles = new Set(
    styleStatus
      .filter(r => String(r["Company Remark"]).toUpperCase() === "CLOSED")
      .map(r => r["Style ID"])
  );

  // ===============================
  // SALES AGGREGATION
  // ===============================
  const styleSales = {};
  const skuSales = {};

  sale.forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    const sku = r["Uniware SKU"];
    const units = Number(r["Units"] || 0);

    styleSales[style] = (styleSales[style] || 0) + units;
    skuSales[style] ??= {};
    skuSales[style][sku] = (skuSales[style][sku] || 0) + units;
  });

  // ===============================
  // STOCK AGGREGATION
  // ===============================
  const styleFC = {};
  const styleSeller = {};
  const skuFC = {};
  const skuSeller = {};

  stock.forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    const sku = r["Uniware SKU"];
    const fc = String(r["FC"] || "").toUpperCase();
    const units = Number(r["Units"] || 0);

    if (fc === "SELLER") {
      styleSeller[style] = (styleSeller[style] || 0) + units;
      skuSeller[style] ??= {};
      skuSeller[style][sku] = (skuSeller[style][sku] || 0) + units;
    } else {
      styleFC[style] = (styleFC[style] || 0) + units;
      skuFC[style] ??= {};
      skuFC[style][sku] = (skuFC[style][sku] || 0) + units;
    }
  });

  // ===============================
  // STYLE LEVEL CALCULATION
  // ===============================
  let rows = [];

  Object.keys(styleSales).forEach(style => {
    const sales = styleSales[style];
    const fc = styleFC[style] || 0;
    const seller = styleSeller[style] || 0;
    const total = fc + seller;

    const drr = sales / totalSaleDays;
    const sc = drr ? total / drr : 0;

    // ---------- DIRECT DEMAND (STYLE SUM) ----------
    let directSum = 0;
    Object.keys(skuSales[style] || {}).forEach(sku => {
      const skuSale = skuSales[style][sku];
      const skuSellerStock = (skuSeller[style] || {})[sku] || 0;
      const skuDRR = skuSale / totalSaleDays;
      const skuDirect = Math.max(
        0,
        Math.round(skuDRR * 45 - skuSellerStock)
      );
      directSum += skuDirect;
    });

    // Visibility rule
    if (directSum === 0) return;

    rows.push({
      style,
      sales,
      fc,
      seller,
      total,
      drr,
      sc,
      direct: directSum
    });
  });

  // ===============================
  // PRIORITY SORT
  // High DRR, Low SC
  // ===============================
  rows.sort((a, b) => {
    if (b.drr !== a.drr) return b.drr - a.drr;
    return a.sc - b.sc;
  });

  // ===============================
  // RENDER TABLE
  // ===============================
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th></th>
          <th>Priority</th>
          <th>Style ID / SKU</th>
          <th>Sales</th>
          <th>FC Stock</th>
          <th>Seller Stock</th>
          <th>Total Stock</th>
          <th>DRR</th>
          <th>SC</th>
          <th>Direct Demand</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach((r, idx) => {
    html += `
      <tr class="style-row" data-style="${r.style}">
        <td class="toggle">+</td>
        <td>${idx + 1}</td>
        <td><b>${r.style}</b></td>
        <td>${r.sales}</td>
        <td>${r.fc}</td>
        <td>${r.seller}</td>
        <td>${r.total}</td>
        <td>${r.drr.toFixed(2)}</td>
        <td>${r.sc.toFixed(1)}</td>
        <td><b>${r.direct}</b></td>
      </tr>
    `;

    Object.keys(skuSales[r.style] || {}).forEach(sku => {
      const skuSale = skuSales[r.style][sku];
      const skuFCStock = (skuFC[r.style] || {})[sku] || 0;
      const skuSellerStock = (skuSeller[r.style] || {})[sku] || 0;
      const skuTotal = skuFCStock + skuSellerStock;

      const skuDRR = skuSale / totalSaleDays;
      const skuSC = skuDRR ? skuTotal / skuDRR : 0;

      const skuDirect = Math.max(
        0,
        Math.round(skuDRR * 45 - skuSellerStock)
      );

      html += `
        <tr class="size-row" data-parent="${r.style}" style="display:none">
          <td></td>
          <td></td>
          <td>${sku}</td>
          <td>${skuSale}</td>
          <td>${skuFCStock}</td>
          <td>${skuSellerStock}</td>
          <td>${skuTotal}</td>
          <td>${skuDRR.toFixed(2)}</td>
          <td>${skuSC.toFixed(1)}</td>
          <td>${skuDirect}</td>
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
