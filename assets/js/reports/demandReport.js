// ===================================================
// Demand vs Production Report – FINAL (V3.2.4)
// ===================================================

export function renderDemandReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;
  container.innerHTML = "";

  const {
    sale,
    stock,
    production,
    totalSaleDays,
    styleStatus
  } = data;

  // ===============================
  // SIZE NORMALIZATION
  // ===============================
  const ALLOWED_SIZES = [
    "XS","S","M","L","XL","XXL",
    "3XL","4XL","5XL","6XL",
    "7XL","8XL","9XL","10XL"
  ];

  function normalizeSize(size) {
    const s = String(size || "").toUpperCase();
    return ALLOWED_SIZES.includes(s) ? s : "FS";
  }

  // ===============================
  // BUY BUCKET (PENDANCY BASED)
  // ===============================
  function getBucket(p) {
    if (p < 0) return { label: "Over Production", color: "#2563eb" };
    if (p > 500) return { label: "Urgent", color: "#dc2626" };
    if (p >= 100) return { label: "Medium", color: "#d97706" };
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
  // SALES
  // ===============================
  const skuSales = {};
  sale.forEach(r => {
    if (closedStyles.has(r["Style ID"])) return;
    const sku = r["Uniware SKU"];
    skuSales[sku] = (skuSales[sku] || 0) + Number(r["Units"] || 0);
  });

  // ===============================
  // SELLER STOCK
  // ===============================
  const skuSellerStock = {};
  stock.forEach(r => {
    if (closedStyles.has(r["Style ID"])) return;
    if (String(r["FC"]).toUpperCase() !== "SELLER") return;
    const sku = r["Uniware SKU"];
    skuSellerStock[sku] =
      (skuSellerStock[sku] || 0) + Number(r["Units"] || 0);
  });

  // ===============================
  // PRODUCTION MAP
  // ===============================
  const skuProduction = {};
  production.forEach(r => {
    const sku = r["Uniware SKU"];
    skuProduction[sku] =
      (skuProduction[sku] || 0) + Number(r["In Production"] || 0);
  });

  // ===============================
  // SKU MASTER SET
  // ===============================
  const allSkus = new Set([
    ...Object.keys(skuSales),
    ...Object.keys(skuProduction)
  ]);

  // ===============================
  // AGGREGATE BY STYLE
  // ===============================
  const styleMap = {};

  allSkus.forEach(sku => {
    const [styleRaw, sizeRaw] = sku.split("-");
    const style = styleRaw;
    if (closedStyles.has(style)) return;

    const size = normalizeSize(sizeRaw);
    const sales = skuSales[sku] || 0;
    const seller = skuSellerStock[sku] || 0;
    const inProd = skuProduction[sku] || 0;

    const drr = sales / totalSaleDays;
    const direct = Math.round(drr * 45 - seller);
    const pending = direct - inProd;

    styleMap[style] ??= {
      style,
      skus: [],
      sales: 0,
      seller: 0,
      production: 0,
      direct: 0,
      pending: 0
    };

    styleMap[style].skus.push({
      sku,
      size,
      sales,
      seller,
      inProd,
      direct,
      pending,
      bucket: getBucket(pending)
    });

    styleMap[style].sales += sales;
    styleMap[style].seller += seller;
    styleMap[style].production += inProd;
    styleMap[style].direct += direct;
    styleMap[style].pending += pending;
  });

  // ===============================
  // BUILD TABLE
  // ===============================
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th></th>
          <th>Style / SKU</th>
          <th>Sales</th>
          <th>Seller Stock</th>
          <th>Direct Demand</th>
          <th>In Production</th>
          <th>Pendancy</th>
          <th>Buy Bucket</th>
        </tr>
      </thead>
      <tbody>
  `;

  Object.values(styleMap).forEach(style => {
    const bucket = getBucket(style.pending);

    html += `
      <tr class="style-row" data-style="${style.style}">
        <td class="toggle">+</td>
        <td><b>${style.style}</b></td>
        <td>${style.sales}</td>
        <td>${style.seller}</td>
        <td>${style.direct}</td>
        <td>${style.production}</td>
        <td><b>${style.pending}</b></td>
        <td style="color:${bucket.color};font-weight:700">
          ${bucket.label}
        </td>
      </tr>
    `;

    style.skus.forEach(s => {
      html += `
        <tr class="size-row" data-parent="${style.style}" style="display:none">
          <td></td>
          <td>${s.sku}</td>
          <td>${s.sales}</td>
          <td>${s.seller}</td>
          <td>${s.direct}</td>
          <td>${s.inProd}</td>
          <td>${s.pending}</td>
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
