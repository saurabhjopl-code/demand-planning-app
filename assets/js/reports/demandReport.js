// ===================================================
// Demand Report – Demand vs Production (V3.2 FINAL)
// ===================================================

export function renderDemandReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;
  container.innerHTML = "";

  const {
    sale,
    stock,
    styleStatus,
    sizeCount,
    totalSaleDays
  } = data;

  // ===============================
  // SIZE NORMALIZATION (LOCKED)
  // ===============================
  const SIZE_ORDER = [
    "FS","XS","S","M","L","XL","XXL",
    "3XL","4XL","5XL","6XL","7XL","8XL","9XL","10XL"
  ];

  function normalizeSize(size) {
    const s = String(size || "").toUpperCase();
    return SIZE_ORDER.includes(s) ? s : "FS";
  }

  function sizeIndex(size) {
    const i = SIZE_ORDER.indexOf(size);
    return i === -1 ? 999 : i;
  }

  // ===============================
  // BUY BUCKET (PENDANCY BASED)
  // ===============================
  function getBucket(pendancy) {
    if (pendancy < 0) return { label: "Over Production", color: "#2563eb" };
    if (pendancy > 500) return { label: "Urgent", color: "#dc2626" };
    if (pendancy >= 100) return { label: "Medium", color: "#d97706" };
    return { label: "Low", color: "#16a34a" };
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
  const skuSales = {};
  const styleSales = {};

  sale.forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    const sku = r["Uniware SKU"];
    const units = Number(r["Units"] || 0);

    skuSales[sku] = (skuSales[sku] || 0) + units;
    styleSales[style] = (styleSales[style] || 0) + units;
  });

  // ===============================
  // SELLER STOCK (SKU LEVEL)
  // ===============================
  const skuSellerStock = {};
  const styleSellerStock = {};

  stock.forEach(r => {
    if (String(r["FC"]).toUpperCase() !== "SELLER") return;

    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    const sku = r["Uniware SKU"];
    const units = Number(r["Units"] || 0);

    skuSellerStock[sku] = (skuSellerStock[sku] || 0) + units;
    styleSellerStock[style] =
      (styleSellerStock[style] || 0) + units;
  });

  // ===============================
  // PRODUCTION DATA (NEW)
  // ===============================
  const skuProduction = {};
  const styleProduction = {};

  sizeCount.forEach(r => {
    const sku = r["Uniware SKU"];
    const prod = Number(r["In Production"] || 0);

    skuProduction[sku] = prod;

    const style = String(sku || "").split("-")[0];
    styleProduction[style] =
      (styleProduction[style] || 0) + prod;
  });

  // ===============================
  // ALL SKUs (SALE + PRODUCTION)
  // ===============================
  const allSkus = new Set([
    ...Object.keys(skuSales),
    ...Object.keys(skuProduction)
  ]);

  // ===============================
  // BUILD SKU LEVEL ROWS
  // ===============================
  const skuRows = [];
  const styleMap = {};

  allSkus.forEach(sku => {
    const parts = String(sku).split("-");
    const style = parts[0];
    const size = normalizeSize(parts.slice(1).join("-"));

    if (closedStyles.has(style)) return;

    const saleUnits = skuSales[sku] || 0;
    const sellerStock = skuSellerStock[sku] || 0;
    const inProd = skuProduction[sku] || 0;

    const skuDRR = totalSaleDays > 0
      ? saleUnits / totalSaleDays
      : 0;

    const directDemand =
      Math.round(skuDRR * 45 - sellerStock);

    const pendancy = directDemand - inProd;
    const bucket = getBucket(pendancy);

    if (!styleMap[style]) {
      styleMap[style] = {
        style,
        sales: styleSales[style] || 0,
        seller: styleSellerStock[style] || 0,
        production: styleProduction[style] || 0,
        direct: 0,
        pendancy: 0,
        skus: []
      };
    }

    styleMap[style].direct += Math.max(0, directDemand);
    styleMap[style].pendancy += pendancy;

    styleMap[style].skus.push({
      sku,
      size,
      saleUnits,
      sellerStock,
      inProd,
      directDemand,
      pendancy,
      bucket
    });
  });

  // ===============================
  // STYLE ROWS
  // ===============================
  const rows = Object.values(styleMap)
    .filter(r => r.direct !== 0 || r.production !== 0)
    .sort((a, b) => b.pendancy - a.pendancy);

  // ===============================
  // RENDER TABLE
  // ===============================
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th></th>
          <th>Style / SKU</th>
          <th>Sales</th>
          <th>Seller Stock</th>
          <th>In Production</th>
          <th>Direct Demand</th>
          <th>Pendancy</th>
          <th>Buy Bucket</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach(styleRow => {
    const bucket = getBucket(styleRow.pendancy);

    html += `
      <tr class="style-row" data-style="${styleRow.style}">
        <td class="toggle">+</td>
        <td><b>${styleRow.style}</b></td>
        <td>${styleRow.sales}</td>
        <td>${styleRow.seller}</td>
        <td>${styleRow.production}</td>
        <td><b>${styleRow.direct}</b></td>
        <td><b>${styleRow.pendancy}</b></td>
        <td style="color:${bucket.color};font-weight:700">
          ${bucket.label}
        </td>
      </tr>
    `;

    styleRow.skus
      .sort((a, b) => sizeIndex(a.size) - sizeIndex(b.size))
      .forEach(s => {
        html += `
          <tr class="size-row" data-parent="${styleRow.style}" style="display:none">
            <td></td>
            <td>${s.sku}</td>
            <td>${s.saleUnits}</td>
            <td>${s.sellerStock}</td>
            <td>${s.inProd}</td>
            <td>${s.directDemand}</td>
            <td>${s.pendancy}</td>
            <td style="color:${s.bucket.color};font-weight:600">
              ${s.bucket.label}
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
