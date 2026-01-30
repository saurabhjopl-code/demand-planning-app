// ===================================================
// HERO STYLES – Month-wise Top 20 (V2.6)
// ===================================================
// Month order: Newest → Oldest
// Rank: Total Sale DESC (per month)
// DRR: Month Sale / Month Days
// SC: Current Stock / Month DRR
// Remarks: MoM comparison
// ===================================================

export function renderHeroStylesReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;
  container.innerHTML = "";

  const {
    sale,
    stock,
    styleStatus,
    sizeCount,
    saleDays
  } = data;

  // -------------------------------
  // Helpers
  // -------------------------------
  const monthIndex = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4,
    MAY: 5, JUN: 6, JUL: 7, AUG: 8,
    SEP: 9, OCT: 10, NOV: 11, DEC: 12
  };

  function parseMonth(m) {
    const [mon, yr] = m.split("-");
    return { year: Number(yr), month: monthIndex[mon.toUpperCase()] };
  }

  // -------------------------------
  // Closed Styles
  // -------------------------------
  const closedStyles = new Set(
    styleStatus
      .filter(r => String(r["Company Remark"]).toUpperCase() === "CLOSED")
      .map(r => r["Style ID"])
  );

  // -------------------------------
  // Sale Days Map
  // -------------------------------
  const saleDaysMap = {};
  saleDays.forEach(r => {
    saleDaysMap[r["Month"]] = Number(r["Days"] || 0);
  });

  // -------------------------------
  // Stock by Style & Size
  // -------------------------------
  const stockByStyle = {};
  const totalStockMap = {};

  stock.forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    stockByStyle[style] ??= {};
    stockByStyle[style][size] =
      (stockByStyle[style][size] || 0) + units;

    totalStockMap[style] =
      (totalStockMap[style] || 0) + units;
  });

  // -------------------------------
  // Broken Count
  // -------------------------------
  function getBrokenCount(style) {
    const sizes = stockByStyle[style] || {};
    return Object.values(sizes).filter(q => q < 10).length;
  }

  // -------------------------------
  // Sale grouped by Month + Style
  // -------------------------------
  const monthStyleSale = {};
  sale.forEach(r => {
    const month = r["Month"];
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    monthStyleSale[month] ??= {};
    monthStyleSale[month][style] =
      (monthStyleSale[month][style] || 0) + Number(r["Units"] || 0);
  });

  // -------------------------------
  // Sort Months (Newest → Oldest)
  // -------------------------------
  const months = Object.keys(monthStyleSale).sort((a, b) => {
    const ma = parseMonth(a);
    const mb = parseMonth(b);
    return mb.year !== ma.year
      ? mb.year - ma.year
      : mb.month - ma.month;
  });

  let html = "";

  // -------------------------------
  // Build Month-wise Blocks
  // -------------------------------
  months.forEach((month, idx) => {
    const days = saleDaysMap[month] || 1;

    const ranked = Object.entries(monthStyleSale[month])
      .map(([style, totalSale]) => ({
        style,
        totalSale
      }))
      .sort((a, b) => b.totalSale - a.totalSale)
      .slice(0, 20)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    // Previous month lookup
    const prevMonth = months[idx + 1];
    const prevMap = {};

    if (prevMonth) {
      const prevDays = saleDaysMap[prevMonth] || 1;
      Object.entries(monthStyleSale[prevMonth] || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([style, sale], i) => {
          prevMap[style] = {
            rank: i + 1,
            drr: sale / prevDays
          };
        });
    }

    // -------------------------------
    // Month Header
    // -------------------------------
    html += `
      <div class="style-row" onclick="this.nextElementSibling.classList.toggle('hidden')">
        📅 <b>${month}</b>
      </div>
      <div class="month-block hidden">
        <table class="summary-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Style ID</th>
              <th>Total Sale</th>
              <th>DRR</th>
              <th>SC</th>
              <th>Stock</th>
              <th>Brokenness</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
    `;

    ranked.forEach(r => {
      const drr = r.totalSale / days;
      const stockQty = totalStockMap[r.style] || 0;
      const sc = drr ? stockQty / drr : 0;
      const broken = getBrokenCount(r.style);

      let remark = "";
      let color = "";

      const prev = prevMap[r.style];
      if (!prev) {
        remark = "New Addition";
        color = "#d97706"; // Amber
      } else if (drr < prev.drr) {
        remark = "DRR Dropped";
        color = "#dc2626"; // Red
      } else if (r.rank > prev.rank) {
        remark = "Rank Dropped";
        color = "#dc2626"; // Red
      } else if (r.rank < prev.rank) {
        remark = "Rank Improved";
        color = "#16a34a"; // Green
      }

      html += `
        <tr>
          <td>${r.rank}</td>
          <td><b>${r.style}</b></td>
          <td>${r.totalSale}</td>
          <td>${drr.toFixed(2)}</td>
          <td>${sc.toFixed(1)}</td>
          <td>${stockQty}</td>
          <td>${broken}</td>
          <td style="font-weight:600;color:${color}">
            ${remark}
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  });

  container.innerHTML = html;
}
