// ===================================================
// Demand Report – FINAL (V3.1.4 SAFE)
// - Buy Bucket Summary (Top Section)
// - Seller-stock based SC
// - Size-wise bucket contribution
// - Closed styles excluded
// - FULL SYNTAX SAFE (NO APP BREAK)
// ===================================================

export function renderDemandReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;
  container.innerHTML = "";

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
  // CLOSED STYLES
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
  // BUY BUCKET LOGIC
  // ===============================
  function getBucket(sc) {
    if (sc < 15) return "Urgent";
    if (sc <= 30) return "Medium";
    return "Low";
  }

  const bucketSummary = {
    Urgent: { styles: new Set(), skus: 0, demand: 0 },
    Medium: { styles: new Set(), skus: 0, demand: 0 },
    Low: { styles: new Set(), skus: 0, demand: 0 }
  };

  // ===============================
  // STYLE LEVEL ROWS
  // ===============================
  const rows = [];

  Object.keys(styleSales).forEach(style => {
    let directSum = 0;
    let styleBuckets = new Set();

    Object.keys(skuSales[style] || {}).forEach(sku => {
      const skuSale = skuSales[style][sku];
      const sellerStock = (skuSeller[style] || {})[sku] || 0;

      const skuDRR = skuSale / totalSaleDays;
      const skuSC = skuDRR ? sellerStock / skuDRR : 0;
      const skuDemand = Math.max(0, Math.round(skuDRR * 45 - sellerStock));

      if (skuDemand > 0) {
        const bucket = getBucket(skuSC);
        styleBuckets.add(bucket);
        bucketSummary[bucket].styles.add(style);
        bucketSummary[bucket].skus += 1;
        bucketSummary[bucket].demand += skuDemand;
        directSum += skuDemand;
      }
    });

    if (directSum === 0) return;

    const sales = styleSales[style];
    const seller = styleSeller[style] || 0;
    const drr = sales / totalSaleDays;
    const sc = drr ? seller / drr : 0;

    rows.push({
      style,
      sales,
      drr,
      sc,
      seller,
      fc: styleFC[style] || 0,
      total: (styleFC[style] || 0) + seller,
      direct: directSum,
      bucket: getBucket(sc)
    });
  });

  // ===============================
  // SORT PRIORITY
  // ===============================
  rows.sort((a, b) => {
    if (b.drr !== a.drr) return b.drr - a.drr;
    return a.sc - b.sc;
  });

  // ===============================
  // BUY BUCKET SUMMARY TABLE
  // ===============================
  let html = `
    <h3>Buy Bucket Summary</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Buy Bucket</th>
          <th># of Styles</th>
          <th># of SKUs</th>
          <th>Total Demand</th>
        </tr>
      </thead>
      <tbody>
  `;

  ["Urgent","Medium","Low"].forEach(b => {
    html += `
      <tr>
        <td><b>${b}</b></td>
        <td>${bucketSummary[b].styles.size}</td>
        <td>${bucketSummary[b].skus}</td>
        <td>${bucketSummary[b].demand}</td>
      </tr>
    `;
  });

  html += `</tbody></table><br/>`;

  // ===============================
  // MAIN DEMAND TABLE
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
        <td><b>${r.direct}</b></td>
        <td><b>${r.bucket}</b></td>
      </tr>
    `;

    const skus = Object.keys(skuSales[r.style] || {}).sort(
      (a, b) => sizeIndex(skuSizeMap[a]) - sizeIndex(skuSizeMap[b])
    );

    skus.forEach(sku => {
      const skuSale = skuSales[r.style][sku];
      const skuSellerStock = (skuSeller[r.style] || {})[sku] || 0;
      const skuFCStock = (skuFC[r.style] || {})[sku] || 0;

      const skuDRR = skuSale / totalSaleDays;
      const skuSC = skuDRR ? skuSellerStock / skuDRR : 0;
      const skuDemand = Math.max(0, Math.round(skuDRR * 45 - skuSellerStock));

      if (skuDemand === 0) return;

      html += `
        <tr class="size-row" data-parent="${r.style}" style="display:none">
          <td></td>
          <td></td>
          <td>${sku}</td>
          <td>${skuSale}</td>
          <td>${skuFCStock}</td>
          <td>${skuSellerStock}</td>
          <td>${skuFCStock + skuSellerStock}</td>
          <td>${skuDRR.toFixed(2)}</td>
          <td>${skuSC.toFixed(1)}</td>
          <td>${skuDemand}</td>
          <td>${getBucket(skuSC)}</td>
        </tr>
      `;
    });
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  // ===============================
  // EXPAND / COLLAPSE (SAFE)
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
