// ===================================================
// HERO STYLES REPORT – FLAT EXCEL FORMAT
// Version: V3.1.2 (SC = SELLER STOCK)
// ===================================================
// - ONLY styles appearing in Top-20 of ANY month
// - Sale shown for all months (0 if no sale)
// - Rank only if in Top-20
// - DRR month-wise using Sale Days
// - SC calculated on SELLER STOCK (NOT total stock)
// - Broken Count (<10 units per size)
// - Closed styles excluded
// ===================================================

export function renderHeroStylesReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;
  container.innerHTML = "";

  const { sale, stock, styleStatus, saleDays } = data;

  // -------------------------------
  // CLOSED STYLES
  // -------------------------------
  const closed = new Set(
    styleStatus
      .filter(r => String(r["Company Remark"]).toUpperCase() === "CLOSED")
      .map(r => r["Style ID"])
  );

  // -------------------------------
  // SALE DAYS MAP
  // -------------------------------
  const saleDaysMap = {};
  saleDays.forEach(r => {
    saleDaysMap[r["Month"]] = Number(r["Days"] || 1);
  });

  // -------------------------------
  // MONTH SORT (OLD → NEW)
  // -------------------------------
  const monthIndex = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
    JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
  };

  function parseMonth(m) {
    const [mon, yr] = m.split("-");
    return { year: +yr, month: monthIndex[mon.toUpperCase()] };
  }

  const months = [...new Set(sale.map(r => r["Month"]))].sort((a, b) => {
    const ma = parseMonth(a);
    const mb = parseMonth(b);
    return ma.year !== mb.year
      ? ma.year - mb.year
      : ma.month - mb.month;
  });

  const latestMonth = months[months.length - 1];

  // -------------------------------
  // SALES BY MONTH + STYLE
  // -------------------------------
  const saleMap = {};
  sale.forEach(r => {
    const m = r["Month"];
    const style = r["Style ID"];
    if (closed.has(style)) return;

    saleMap[m] ??= {};
    saleMap[m][style] =
      (saleMap[m][style] || 0) + Number(r["Units"] || 0);
  });

  // -------------------------------
  // RANK MAP (TOP 20 PER MONTH)
  // -------------------------------
  const rankMap = {};
  months.forEach(m => {
    rankMap[m] = {};
    Object.entries(saleMap[m] || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([style], i) => {
        rankMap[m][style] = i + 1;
      });
  });

  // -------------------------------
  // HERO STYLES = UNION OF TOP-20
  // -------------------------------
  const heroStyles = new Set();
  months.forEach(m => {
    Object.keys(rankMap[m]).forEach(style => heroStyles.add(style));
  });

  // -------------------------------
  // STOCK MAPS (SELLER + SIZE)
  // -------------------------------
  const sellerStockMap = {};
  const stockByStyleSize = {};

  stock.forEach(r => {
    const style = r["Style ID"];
    if (closed.has(style)) return;

    const fc = String(r["FC"] || "").toUpperCase();
    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    stockByStyleSize[style] ??= {};
    stockByStyleSize[style][size] =
      (stockByStyleSize[style][size] || 0) + units;

    if (fc === "SELLER") {
      sellerStockMap[style] =
        (sellerStockMap[style] || 0) + units;
    }
  });

  function brokenCount(style) {
    const sizes = stockByStyleSize[style] || {};
    return Object.values(sizes).filter(q => q < 10).length;
  }

  // -------------------------------
  // TABLE HEADER
  // -------------------------------
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th rowspan="2">Style ID</th>
          <th colspan="${months.length}">Sale</th>
          <th colspan="${months.length}">Rank</th>
          <th colspan="${months.length}">DRR</th>
          <th rowspan="2">SC<br>(Seller)</th>
          <th rowspan="2">Broken<br>Count</th>
          <th rowspan="2">Remark</th>
        </tr>
        <tr>
  `;

  months.forEach(m => (html += `<th>${m}</th>`));
  months.forEach(m => (html += `<th>${m}</th>`));
  months.forEach(m => (html += `<th>${m}</th>`));
  html += `</tr></thead><tbody>`;

  // -------------------------------
  // ROWS
  // -------------------------------
  [...heroStyles].forEach(style => {
    html += `<tr><td><b>${style}</b></td>`;

    // Sale
    months.forEach(m => {
      html += `<td>${saleMap[m]?.[style] || 0}</td>`;
    });

    // Rank
    months.forEach(m => {
      html += `<td>${rankMap[m]?.[style] || ""}</td>`;
    });

    // DRR
    months.forEach(m => {
      const s = saleMap[m]?.[style] || 0;
      const drr = s / (saleDaysMap[m] || 1);
      html += `<td>${drr ? drr.toFixed(2) : "0.00"}</td>`;
    });

    // SC (SELLER STOCK ONLY)
    const latestSale = saleMap[latestMonth]?.[style] || 0;
    const latestDRR =
      latestSale / (saleDaysMap[latestMonth] || 1);
    const sellerStock = sellerStockMap[style] || 0;
    const sc =
      latestDRR ? sellerStock / latestDRR : 0;

    // Remark logic (unchanged)
    let remark = "";
    let color = "";

    const idx = months.length - 1;
    const curRank = rankMap[months[idx]]?.[style];
    const prevRank = rankMap[months[idx - 1]]?.[style];
    const prevSale = saleMap[months[idx - 1]]?.[style] || 0;
    const prevDRR =
      prevSale / (saleDaysMap[months[idx - 1]] || 1);

    if (curRank && !prevRank) {
      remark = "New Addition";
      color = "#d97706";
    } else if (latestDRR < prevDRR) {
      remark = "DRR Dropped";
      color = "#dc2626";
    } else if (curRank && prevRank && curRank > prevRank) {
      remark = "Rank Dropped";
      color = "#dc2626";
    } else if (curRank && prevRank && curRank < prevRank) {
      remark = "Rank Improved";
      color = "#16a34a";
    }

    html += `
      <td>${sc.toFixed(1)}</td>
      <td>${brokenCount(style)}</td>
      <td style="color:${color};font-weight:600">${remark}</td>
    </tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}
