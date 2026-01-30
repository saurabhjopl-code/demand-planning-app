// ===================================================
// HERO STYLES REPORT – FLAT EXCEL FORMAT
// Version: V3.1 (FINAL, STABLE)
// ===================================================
// - Flat columns (NO colspan, NO expand)
// - Sale shown for ALL months (0 if no sale)
// - Rank only if in Top-20 of that month
// - DRR month-wise using Sale Days
// - SC only for latest month
// - Broken Count from stock (<10 units per size)
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
      .forEach(([style, units], i) => {
        rankMap[m][style] = i + 1;
      });
  });

  // -------------------------------
  // UNION OF HERO STYLES
  // -------------------------------
  const heroStyles = new Set();
  months.forEach(m => {
    Object.keys(saleMap[m] || {}).forEach(s => heroStyles.add(s));
  });

  // -------------------------------
  // STOCK + BROKEN COUNT
  // -------------------------------
  const stockByStyleSize = {};
  const totalStock = {};

  stock.forEach(r => {
    const style = r["Style ID"];
    if (closed.has(style)) return;

    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    stockByStyleSize[style] ??= {};
    stockByStyleSize[style][size] =
      (stockByStyleSize[style][size] || 0) + units;

    totalStock[style] = (totalStock[style] || 0) + units;
  });

  function brokenCount(style) {
    const m = stockByStyleSize[style] || {};
    return Object.values(m).filter(q => q < 10).length;
  }

  // -------------------------------
  // BUILD TABLE
  // -------------------------------
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th rowspan="2">Style ID</th>
          <th colspan="${months.length}">Sale</th>
          <th colspan="${months.length}">Rank</th>
          <th colspan="${months.length}">DRR</th>
          <th rowspan="2">SC<br>(Latest)</th>
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

    // SALE
    months.forEach(m => {
      html += `<td>${saleMap[m]?.[style] || 0}</td>`;
    });

    // RANK
    months.forEach(m => {
      html += `<td>${rankMap[m]?.[style] || ""}</td>`;
    });

    // DRR
    months.forEach(m => {
      const s = saleMap[m]?.[style] || 0;
      const drr = s / (saleDaysMap[m] || 1);
      html += `<td>${drr ? drr.toFixed(2) : "0.00"}</td>`;
    });

    // SC (LATEST)
    const latestSale = saleMap[latestMonth]?.[style] || 0;
    const latestDRR =
      latestSale / (saleDaysMap[latestMonth] || 1);
    const sc =
      latestDRR ? (totalStock[style] || 0) / latestDRR : 0;

    // REMARK (PRIORITY BASED)
    let remark = "";
    let color = "";

    const idx = months.length - 1;
    const curRank = rankMap[months[idx]]?.[style];
    const prevRank = rankMap[months[idx - 1]]?.[style];
    const curDRR = latestDRR;
    const prevSale = saleMap[months[idx - 1]]?.[style] || 0;
    const prevDRR =
      prevSale / (saleDaysMap[months[idx - 1]] || 1);

    if (curRank && !prevRank) {
      remark = "New Addition";
      color = "#d97706";
    } else if (curDRR < prevDRR) {
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
    </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}
