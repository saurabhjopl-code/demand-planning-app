export function renderOverstockReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;

  const { sale, stock, totalSaleDays, saleDays } = data;

  // ===============================
  // SIZE ORDER (DEFENSIVE)
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
  // MONTH PARSER
  // ===============================
  const MONTH_INDEX = {
    JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,
    JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12
  };

  function parseMonth(m) {
    const [mon, yr] = m.split("-");
    return {
      year: Number(yr),
      month: MONTH_INDEX[mon.toUpperCase()]
    };
  }

  // ===============================
  // SALE DAYS MAP
  // ===============================
  const saleDaysMap = {};
  saleDays.forEach(r => {
    saleDaysMap[r["Month"]] = Number(r["Days"] || 1);
  });

  // ===============================
  // SALES AGGREGATION
  // ===============================
  const styleSales = {};
  const skuSales = {};
  const monthStyleSales = {};

  sale.forEach(r => {
    const style = r["Style ID"];
    const sku = r["Uniware SKU"];
    const month = r["Month"];
    const units = Number(r["Units"] || 0);

    styleSales[style] = (styleSales[style] || 0) + units;

    skuSales[style] ??= {};
    skuSales[style][sku] = (skuSales[style][sku] || 0) + units;

    monthStyleSales[style] ??= {};
    monthStyleSales[style][month] =
      (monthStyleSales[style][month] || 0) + units;
  });

  // ===============================
  // STOCK AGGREGATION
  // ===============================
  const styleFCStock = {};
  const styleSellerStock = {};
  const skuFCStock = {};
  const skuSellerStock = {};
  const skuSizeMap = {};

  stock.forEach(r => {
    const style = r["Style ID"];
    const sku = r["Uniware SKU"];
    const size = r["Size"];
    const fc = String(r["FC"] || "").toUpperCase();
    const units = Number(r["Units"] || 0);

    skuSizeMap[sku] = size;

    if (fc === "SELLER") {
      styleSellerStock[style] = (styleSellerStock[style] || 0) + units;
      skuSellerStock[style] ??= {};
      skuSellerStock[style][sku] =
        (skuSellerStock[style][sku] || 0) + units;
    } else {
      styleFCStock[style] = (styleFCStock[style] || 0) + units;
      skuFCStock[style] ??= {};
      skuFCStock[style][sku] =
        (skuFCStock[style][sku] || 0) + units;
    }
  });

  // ===============================
  // STYLE LEVEL DATA
  // ===============================
  const rows = Object.keys(styleSales)
    .map(style => {
      const sales = styleSales[style];
      const fc = styleFCStock[style] || 0;
      const seller = styleSellerStock[style] || 0;
      const total = fc + seller;

      const drr = sales / totalSaleDays;
      const sc = drr ? total / drr : 0;
      const excess = Math.round(total - drr * 45);

      // -------- Month-wise DRR --------
      const monthDRR = {};
      Object.entries(monthStyleSales[style] || {}).forEach(
        ([m, s]) => {
          monthDRR[m] = s / (saleDaysMap[m] || 1);
        }
      );

      const months = Object.keys(monthDRR).sort((a, b) => {
        const ma = parseMonth(a);
        const mb = parseMonth(b);
        return mb.year !== ma.year
          ? mb.year - ma.year
          : mb.month - ma.month;
      });

      let remark = "";
      if (months.length >= 2) {
        const latest = months[0];
        const previous = months[1];
        if (monthDRR[latest] < monthDRR[previous]) {
          remark = months
            .reverse()
            .map(m => `${m} DRR - ${monthDRR[m].toFixed(2)}`)
            .join(", ");
        }
      }

      return {
        style,
        sales,
        fc,
        seller,
        total,
        drr,
        sc,
        excess,
        remark
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
          <th>Excess</th>
          <th>Remark</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach(r => {
    html += `
      <tr class="style-row" data-style="${r.style}">
        <td class="toggle">+</td>
        <td><b>${r.style}</b></td>
        <td>${r.sales}</td>
        <td>${r.fc}</td>
        <td>${r.seller}</td>
        <td>${r.total}</td>
        <td>${r.drr.toFixed(2)}</td>
        <td>${r.sc.toFixed(1)}</td>
        <td>${r.excess}</td>
        <td style="color:#dc2626;font-weight:600">${r.remark}</td>
      </tr>
    `;

    const skus = Object.keys(skuSales[r.style] || {}).sort(
      (a, b) => sizeIndex(skuSizeMap[a]) - sizeIndex(skuSizeMap[b])
    );

    skus.forEach(sku => {
      const skuSale = skuSales[r.style][sku];
      const skuFC = (skuFCStock[r.style] || {})[sku] || 0;
      const skuSeller = (skuSellerStock[r.style] || {})[sku] || 0;
      const skuTotal = skuFC + skuSeller;

      const skuDRR = skuSale / totalSaleDays;
      const skuSC = skuDRR ? skuTotal / skuDRR : 0;
      const share = skuTotal / r.total;
      const skuExcess = Math.round(r.excess * share);

      html += `
        <tr class="size-row" data-parent="${r.style}" style="display:none">
          <td></td>
          <td>${sku}</td>
          <td>${skuSale}</td>
          <td>${skuFC}</td>
          <td>${skuSeller}</td>
          <td>${skuTotal}</td>
          <td>${skuDRR.toFixed(2)}</td>
          <td>${skuSC.toFixed(1)}</td>
          <td>${skuExcess}</td>
          <td></td>
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
