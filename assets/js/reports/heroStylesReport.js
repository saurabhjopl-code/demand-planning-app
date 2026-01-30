// ===================================================
// HERO STYLES – Month-wise Top 20 (FIXED & STABLE)
// Version: V3.1.0
// ===================================================
// FIX:
// - Hero style selection uses Top-20 logic
// - Sale / DRR / SC ALWAYS shown for all months
// - Rank shown only when applicable
// - No blank sales if data exists
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
  // Sale days map
  // -------------------------------
  const saleDaysMap = {};
  saleDays.forEach(r => {
    saleDaysMap[r["Month"]] = Number(r["Days"] || 1);
  });

  // -------------------------------
  // Stock aggregation
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
    const sizeMap = stockByStyleSize[style] || {};
    return Object.values(sizeMap).filter(q => q < 10).length;
  }

  // -------------------------------
  // Sale aggregation (MONTH × STYLE)
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
  // Sorted months (Newest → Oldest)
  // -------------------------------
  const months = Object.keys(monthStyleSale).sort((a, b) => {
    const ma = parseMonth(a);
    const mb = parseMonth(b);
    return mb.year !== ma.year
      ? mb.year - ma.year
      : mb.month - ma.month;
  });

  // -------------------------------
  // Rank map (Top 20 ONLY for rank)
  // -------------------------------
  const rankMap = {};
  months.forEach(m => {
    rankMap[m] = {};
    Object.entries(monthStyleSale[m])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([style, sale], i) => {
        rankMap[m][style] = i + 1;
      });
  });

  // -------------------------------
  // Hero styles = UNION of Top-20
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
          <th rowspan="2">Stock</th>
  `;

  months.forEach(m => {
    html += `
      <th colspan="6"
          class="month-toggle"
          data-month="${m}"
          style="cursor:pointer">
        ${m}
      </th>
    `;
  });

  html += `</tr><tr>`;

  months.forEach(m => {
    html += `
      <th class="col-${m}">Rank</th>
      <th class="col-${m}">Sale</th>
      <th class="col-${m}">DRR</th>
      <th class="col-${m}">SC</th>
      <th class="col-${m}">Broken</th>
      <th class="col-${m}">Remark</th>
    `;
  });

  html += `</tr></thead><tbody>`;

  // -------------------------------
  // ROWS
  // -------------------------------
  heroStyles.forEach(style => {
    const broken = getBrokenCount(style);
    const stockQty = totalStockMap[style] || 0;

    html += `
      <tr>
        <td><b>${style}</b></td>
        <td>${stockQty}</td>
    `;

    months.forEach((m, idx) => {
      const saleQty = monthStyleSale[m]?.[style] || 0;
      const drr = saleQty / (saleDaysMap[m] || 1);
      const sc = drr ? stockQty / drr : 0;

      const rank = rankMap[m]?.[style] || "";

      const prevMonth = months[idx + 1];
      const prevSale = prevMonth
        ? monthStyleSale[prevMonth]?.[style] || 0
        : 0;
      const prevDRR = prevMonth
        ? prevSale / (saleDaysMap[prevMonth] || 1)
        : 0;
      const prevRank = prevMonth
        ? rankMap[prevMonth]?.[style]
        : null;

      let remark = "";
      let color = "";

      if (rank && !prevRank && prevMonth) {
        remark = "New Addition";
        color = "#d97706";
      } else if (rank && prevRank) {
        if (drr < prevDRR) {
          remark = "DRR Dropped";
          color = "#dc2626";
        } else if (rank > prevRank) {
          remark = "Rank Dropped";
          color = "#dc2626";
        } else if (rank < prevRank) {
          remark = "Rank Improved";
          color = "#16a34a";
        }
      }

      html += `
        <td class="col-${m}">${rank}</td>
        <td class="col-${m}">${saleQty}</td>
        <td class="col-${m}">${saleQty ? drr.toFixed(2) : ""}</td>
        <td class="col-${m}">${saleQty ? sc.toFixed(1) : ""}</td>
        <td class="col-${m}">${saleQty ? broken : ""}</td>
        <td class="col-${m}" style="color:${color};font-weight:600">
          ${remark}
        </td>
      `;
    });

    html += `</tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  // -------------------------------
  // SINGLE MONTH EXPAND / COLLAPSE
  // -------------------------------
  function showMonth(target) {
    months.forEach(m => {
      document.querySelectorAll(`.col-${m}`).forEach(c => {
        c.style.display = m === target ? "" : "none";
      });
    });
  }

  showMonth(months[0]);

  document.querySelectorAll(".month-toggle").forEach(th => {
    th.onclick = () => showMonth(th.dataset.month);
  });
}
