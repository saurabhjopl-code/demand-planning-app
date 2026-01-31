// ===================================================
// Demand Report – FINAL (V3.3.0)
// - Production integrated (SAFE ADDITION)
// - Existing tables & columns preserved
// - ONLY 2 columns added: In Production, Pendancy
// ===================================================

export function renderDemandReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;
  container.innerHTML = "";

  const {
    sale,
    stock,
    totalSaleDays,
    styleStatus,
    production   // ✅ NEW DATASET
  } = data;

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
  // BUY BUCKET COLORS (UPDATED)
  // ===============================
  const BUCKET_COLOR = {
    Urgent: "#dc2626",
    Medium: "#d97706",
    Low: "#16a34a",
    "Over Production": "#2563eb"
  };

  function getBucketByPending(p) {
    if (p < 0) return "Over Production";
    if (p > 500) return "Urgent";
    if (p >= 100) return "Medium";
    return "Low";
  }

  // ===============================
  // CLOSED STYLES
  // ===============================
  const closedStyles = new Set(
    styleStatus
      .filter(r => String(r["Company Remark"]).toUpperCase() === "CLOSED")
      .map(r => r["Style ID"])
  );

  // ===============================
  // PRODUCTION MAP (SKU → Qty)
  // ===============================
  const productionMap = {};
  (production || []).forEach(r => {
    const sku = r["Uniware SKU"];
    const qty = Number(r["In Production"] || 0);
    productionMap[sku] = qty;
  });

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
  // BUILD ROWS + BUCKET SUMMARY
  // ===============================
  const rows = [];
  const bucketSummary = {
    Urgent: { styles: new Set(), skus: 0, demand: 0 },
    Medium: { styles: new Set(), skus: 0, demand: 0 },
    Low: { styles: new Set(), skus: 0, demand: 0 },
    "Over Production": { styles: new Set(), skus: 0, demand: 0 }
  };

  Object.keys(styleSales).forEach(style => {
    let styleDirect = 0;
    let styleProduction = 0;

    Object.keys(skuSales[style] || {}).forEach(sku => {
      const skuSale = skuSales[style][sku];
      const sellerStock = (skuSeller[style] || {})[sku] || 0;
      const inProd = productionMap[sku] || 0;

      const skuDRR = skuSale / totalSaleDays;
      const skuDirect = Math.round(skuDRR * 45 - sellerStock);
      const skuPending = skuDirect - inProd;

      const bucket = getBucketByPending(skuPending);

      bucketSummary[bucket].styles.add(style);
      bucketSummary[bucket].skus += 1;
      bucketSummary[bucket].demand += skuPending;

      styleDirect += skuDirect;
      styleProduction += inProd;
    });

    const stylePending = styleDirect - styleProduction;
    if (stylePending === 0) return;

    const sales = styleSales[style];
    const seller = styleSeller[style] || 0;
    const fc = styleFC[style] || 0;
    const total = fc + seller;

    const drr = sales / totalSaleDays;
    const sc = drr ? seller / drr : 0;

    rows.push({
      style,
      sales,
      fc,
      seller,
      total,
      drr,
      sc,
      direct: styleDirect,
      production: styleProduction,
      pending: stylePending,
      bucket: getBucketByPending(stylePending)
    });
  });

  // ===============================
  // SORT PRIORITY
  // ===============================
  rows.sort((a, b) => b.pending - a.pending);

  // ===============================
  // BUY BUCKET SUMMARY TABLE (UNCHANGED)
  // ===============================
  let html = `
    <h3>Buy Bucket Summary</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Buy Bucket</th>
          <th># of Styles</th>
          <th># of SKUs</th>
          <th>Total Pendancy</th>
        </tr>
      </thead>
      <tbody>
  `;

  Object.keys(bucketSummary).forEach(b => {
    html += `
      <tr>
        <td style="color:${BUCKET_COLOR[b]};font-weight:700">${b}</td>
        <td>${bucketSummary[b].styles.size}</td>
        <td>${bucketSummary[b].skus}</td>
        <td>${bucketSummary[b].demand}</td>
      </tr>
    `;
  });

  html += `</tbody></table><br/>`;

  // ===============================
  // MAIN DEMAND TABLE (ONLY 2 COLS ADDED)
  // ===============================
  html += `
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
          <th>In Production</th>
          <th>Pendancy</th>
          <th>Buy Bucket</th>
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
        <td>${r.direct}</td>
        <td>${r.production}</td>
        <td><b>${r.pending}</b></td>
        <td style="color:${BUCKET_COLOR[r.bucket]};font-weight:700">
          ${r.bucket}
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  // ===============================
  // EXPAND / COLLAPSE (UNCHANGED)
  // ===============================
  container.querySelectorAll(".style-row").forEach(row => {
    row.addEventListener("click", () => {
      const style = row.dataset.style;
      const expanded = row.classList.toggle("expanded");
      row.querySelector(".toggle").textContent = expanded ? "−" : "+";
    });
  });
}
