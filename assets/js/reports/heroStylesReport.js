// ===================================================
// HERO STYLES – Month-wise Top 20 (Columns, Expand/Collapse)
// Version: V2.6.1 (Brokenness Restored)
// Built on V2.5 STABLE
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
  // Sale Days Map
  // -------------------------------
  const saleDaysMap = {};
  saleDays.forEach(r => {
    saleDaysMap[r["Month"]] = Number(r["Days"] || 1);
  });

  // -------------------------------
  // Stock by Style & Size (for Brokenness)
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

  // -------------------------------
  // Brokenness Count
  // -------------------------------
  function getBrokenCount(style) {
    const sizeMap = stockByStyleSize[style] || {};
    return Object.values(sizeMap).filter(qty => qty < 10).length;
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
  // Sorted Months (Newest → Oldest)
  // -------------------------------
  const months = Object.keys(monthStyleSale).sort((a, b) => {
    const ma = parseMonth(a);
    const mb = parseMonth(b);
    return mb.year !== ma.year
      ? mb.year - ma.year
      : mb.month - ma.month;
  });

  // -------------------------------
  // Rank map per month (Top 20 only)
  // -------------------------------
  const rankMap = {};
  months.forEach(m => {
    rankMap[m] = {};
    Object.entries(monthStyleSale[m])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([style, sale], i) => {
        rankMap[m][style] = {
          rank: i + 1,
          sale,
          drr: sale / (saleDaysMap[m] || 1)
        };
      });
  });

  // -------------------------------
  // Union of all Hero Styles
  // -------------------------------
  const heroStyles = new Set();
  months.forEach(m => {
    Object.keys(rankMap[m]).forEach(s => heroStyles.add(s));
  });

  // -------------------------------
  // Table Header
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
  // Rows
  // -------------------------------
  heroStyles.forEach(style => {
    const broken = getBrokenCount(style);

    html += `
      <tr>
        <td><b>${style}</b></td>
        <td>${totalStockMap[style] || 0}</td>
    `;

    months.forEach((m, idx) => {
      const cur = rankMap[m][style];
      const prev = rankMap[months[idx + 1]]?.[style];

      let remark = "";
      let color = "";

      if (cur && !prev && idx < months.length - 1) {
        remark = "New Addition";
        color = "#d97706";
      } else if (cur && prev) {
        if (cur.drr < prev.drr) {
          remark = "DRR Dropped";
          color = "#dc2626";
        } else if (cur.rank > prev.rank) {
          remark = "Rank Dropped";
          color = "#dc2626";
        } else if (cur.rank < prev.rank) {
          remark = "Rank Improved";
          color = "#16a34a";
        }
      }

      html += `
        <td class="col-${m}">${cur ? cur.rank : ""}</td>
        <td class="col-${m}">${cur ? cur.sale : ""}</td>
        <td class="col-${m}">${cur ? cur.drr.toFixed(2) : ""}</td>
        <td class="col-${m}">
          ${cur && cur.drr ? (totalStockMap[style] / cur.drr).toFixed(1) : ""}
        </td>
        <td class="col-${m}">${cur ? broken : ""}</td>
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
  // Expand / Collapse Logic
  // -------------------------------
  months.forEach((m, i) => {
    if (i !== 0) {
      document
        .querySelectorAll(`.col-${m}`)
        .forEach(c => (c.style.display = "none"));
    }
  });

  document.querySelectorAll(".month-toggle").forEach(th => {
    th.onclick = () => {
      const m = th.dataset.month;
      document
        .querySelectorAll(`.col-${m}`)
        .forEach(c => {
          c.style.display =
            c.style.display === "none" ? "" : "none";
        });
    };
  });
}
