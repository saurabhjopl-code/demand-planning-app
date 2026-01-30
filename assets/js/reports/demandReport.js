export function renderDemandReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;

  const { sale, stock, totalSaleDays, styleStatus } = data;

  // ===============================
  // SIZE ORDER (LOCKED)
  // ===============================
  const SIZE_ORDER = [
    "FS","XS","S","M","L","XL","XXL",
    "3XL","4XL","5XL","6XL","7XL","8XL","9XL","10XL"
  ];

  function sizeIndex(size) {
    const idx = SIZE_ORDER.indexOf(String(size || "").toUpperCase());
    return idx === -1 ? 999 : idx;
  }

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
  const skuSizeMap = {};

  stock.forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    const sku = r["Uniware SKU"];
    const size = r["Size"];
    const fc = String(r["FC"] || "").toUpperCase();
    const units = Number(r["Units"] || 0);

    skuSizeMap[sku] = size;

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
    const sc = drr ? seller / drr : 0;

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
  // ===============================
  rows.sort((a, b) => {
    if (b.drr !== a.drr) return b.drr - a.drr;
    return a.sc - b.sc;
  });

  // ===============================
  // BUY BUCKET
  // ===============================
  function getBucket(sc) {
    if (sc < 15) return { label: "Urgent", color: "#dc2626" };
    if (sc <= 30) return { label: "Medium", color: "#d97706" };
    return { label: "Low", color: "#16a34a" };
  }

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
          <th>Buy Bucket</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach((r, idx) => {
    const bucket = getBucket(r.sc);

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
        <td style="color:${bucket.color};font-weight:700">
          ${bucket.label}
        </td>
      </tr>
    `;

    const skus = Object.keys(skuSales[r.style] || {}).sort(
      (a, b) => sizeIndex(skuSizeMap[a]) - sizeIndex(skuSizeMap[b])
    );

    skus.forEach(sku => {
      const skuSale = skuSales[r.style][sku];
      const skuFCStock = (skuFC[r.style] || {})[sku] || 0;
      const skuSellerStock = (skuSeller[r.style] || {})[sku] || 0;
      const skuTotal = skuFCStock + skuSellerStock;

      const skuDRR = skuSale / totalSaleDays;
      const skuSC = skuDRR ? skuSellerStock / skuDRR : 0;
      const skuDirect = Math.max(
        0,
        Math.round(skuDRR * 45 - skuSellerStock)
      );

      const skuBucket = getBucket(skuSC);

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
          <td style="color:${skuBucket.color};font-weight:600">
            ${skuBucket.label}
          </td>
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
