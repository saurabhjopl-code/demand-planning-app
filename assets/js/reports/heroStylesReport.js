// ===================================================
// HERO STYLES – Consolidated Month-wise Top 20
// Version: V2.7 FINAL
// ===================================================
// - Top 20 per month (by Sale)
// - Consolidated (union of all months)
// - Excel-style column layout
// - NO expand / collapse
// ===================================================

export function renderHeroStylesReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;
  container.innerHTML = "";

  const { sale, stock, styleStatus, saleDays } = data;

  // -------------------------------
  // Month helpers
  // -------------------------------
  const monthIndex = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4,
    MAY: 5, JUN: 6, JUL: 7, AUG: 8,
    SEP: 9, OCT: 10, NOV: 11, DEC: 12
  };

  function parseMonth(m) {
    const [mon, yr] = m.split("-");
    return { year: +yr, month: monthIndex[mon.toUpperCase()] };
  }

  // -------------------------------
  // Closed styles
  // -------------------------------
  const closedStyles = new Set(
    styleStatus
      .filter(r => String(r["Company Remark"]).toUpperCase() === "CLOSED")
      .map(r => r["Style ID"])
  );

  // -------------------------------
  // Sale Days map
  // -------------------------------
  const saleDaysMap = {};
  saleDays.forEach(r => {
    saleDaysMap[r["Month"]] = Number(r["Days"] || 1);
  });

  // -------------------------------
  // Stock & broken count
  // -------------------------------
  const stockByStyleSize = {};
  const totalStockMap = {};

  stock.forEach(r => {
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    stockByStyleSize[style] ??= {};
    stockByStyleSize[style][size] =
      (stockByStyleSize[style][size] || 0) + units;

    totalStockMap[style] =
      (totalStockMap[style] || 0) + units;
  });

  function getBrokenCount(style) {
    const sizes = stockByStyleSize[style] || {};
    return Object.values(sizes).filter(q => q < 10).length;
  }

  // -------------------------------
  // Sale grouped by Month + Style
  // -------------------------------
  const monthStyleSale = {};
  sale.forEach(r => {
    const m = r["Month"];
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    monthStyleSale[m] ??= {};
    monthStyleSale[m][style] =
      (monthStyleSale[m][style] || 0) + Number(r["Units"] || 0);
  });

  // -------------------------------
  // Sorted months (oldest → newest)
  // -------------------------------
  const months = Object.keys(monthStyleSale).sort((a, b) => {
    const ma = parseMonth(a);
    const mb = parseMonth(b);
    return ma.year !== mb.year
      ? ma.year - mb.year
      : ma.month - mb.month;
  });

  const latestMonth = months[months.length - 1];

  // -------------------------------
  // Rank map (Top 20 per month)
  // -------------------------------
  const rankMap = {};
  months.forEach(m => {
    rankMap[m] = {};
    Object.entries(monthStyleSale[m])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([style, sale], i) => {
        rankMap[m][style] = {
          sale,
          rank: i + 1,
          drr: sale / (saleDaysMap[m] || 1)
        };
      });
  });

  // -------------------------------
  // Union of all hero styles
  // -------------------------------
  const heroStyles = new Set();
  months.forEach(m => {
    Object.keys(rankMap[m]).forEach(s => heroStyles.add(s));
  });

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
          <th rowspan="2">SC<br>(Latest)</th>
          <th rowspan="2">Broken<br>Count</th>
          <th rowspan="2">Remark</th>
        </tr>
        <tr>
  `;

  months.forEach(m => html += `<th>${m}</th>`);
  months.forEach(m => html += `<th>${m}</th>`);
  months.forEach(m => html += `<th>${m}</th>`);

  html += `</tr></thead><tbody>`;

  // -------------------------------
  // ROWS
  // -------------------------------
  heroStyles.forEach(style => {
    const broken = getBrokenCount(style);

    // Latest month metrics
    const latest = rankMap[latestMonth][style];
    const sc =
      latest && latest.drr
        ? (totalStockMap[style] / latest.drr).toFixed(1)
        : "";

    // Remark logic (priority)
    let remark = "";
    let color = "";

    for (let i = months.length - 1; i > 0; i--) {
      const cur = rankMap[months[i]][style];
      const prev = rankMap[months[i - 1]][style];

      if (cur && !prev) {
        remark = "New Addition";
        color = "#d97706";
        break;
      }
      if (cur && prev) {
        if (cur.drr < prev.drr) {
          remark = "DRR Dropped";
          color = "#dc2626";
          break;
        }
        if (cur.rank > prev.rank) {
          remark = "Rank Dropped";
          color = "#dc2626";
          break;
        }
        if (cur.rank < prev.rank) {
          remark = "Rank Improved";
          color = "#16a34a";
          break;
        }
      }
    }

    html += `<tr><td><b>${style}</b></td>`;

    months.forEach(m => {
      html += `<td>${rankMap[m][style]?.sale || ""}</td>`;
    });
    months.forEach(m => {
      html += `<td>${rankMap[m][style]?.rank || ""}</td>`;
    });
    months.forEach(m => {
      html += `<td>${rankMap[m][style]?.drr?.toFixed(2) || ""}</td>`;
    });

    html += `
      <td>${sc}</td>
      <td>${broken}</td>
      <td style="color:${color};font-weight:600">${remark}</td>
    </tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}
