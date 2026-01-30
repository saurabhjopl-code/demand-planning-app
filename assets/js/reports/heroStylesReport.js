export function renderHeroStylesReport(data) {
  const container = document.getElementById("report-content");
  if (!container) return;
  container.innerHTML = "";

  const { sale, stock, styleStatus, saleDays } = data;

  // ===============================
  // MONTH PARSER
  // ===============================
  const MONTH_INDEX = {
    JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,
    JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12
  };

  function parseMonth(m) {
    const [mon, yr] = m.split("-");
    return { year:+yr, month:MONTH_INDEX[mon.toUpperCase()] };
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
  // SALE DAYS MAP
  // ===============================
  const saleDaysMap = {};
  saleDays.forEach(r => {
    saleDaysMap[r["Month"]] = Number(r["Days"] || 1);
  });

  // ===============================
  // STOCK AGGREGATION
  // ===============================
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

  // ===============================
  // SALES BY MONTH + STYLE
  // ===============================
  const monthStyleSale = {};
  sale.forEach(r => {
    const m = r["Month"];
    const style = r["Style ID"];
    if (closedStyles.has(style)) return;

    monthStyleSale[m] ??= {};
    monthStyleSale[m][style] =
      (monthStyleSale[m][style] || 0) + Number(r["Units"] || 0);
  });

  // ===============================
  // SORTED MONTHS (NEWEST → OLDEST)
  // ===============================
  const months = Object.keys(monthStyleSale).sort((a, b) => {
    const ma = parseMonth(a);
    const mb = parseMonth(b);
    return mb.year !== ma.year
      ? mb.year - ma.year
      : mb.month - ma.month;
  });

  // ===============================
  // RANK MAP (TOP 20 PER MONTH)
  // ===============================
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

  // ===============================
  // UNION OF ALL HERO STYLES
  // ===============================
  const heroStyles = new Set();
  months.forEach(m => {
    Object.keys(rankMap[m]).forEach(s => heroStyles.add(s));
  });

  // ===============================
  // TABLE HEADER
  // ===============================
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th rowspan="2">Style ID</th>
          <th rowspan="2">Stock</th>
  `;

  months.forEach(m => {
    html += `
      <th colspan="6" class="month-toggle" data-month="${m}" style="cursor:pointer">
        ${m}
      </th>`;
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

  // ===============================
  // ROWS
  // ===============================
  heroStyles.forEach(style => {
    const broken = getBrokenCount(style);
    const stockQty = totalStockMap[style] || 0;

    html += `<tr><td><b>${style}</b></td><td>${stockQty}</td>`;

    months.forEach((m, idx) => {
      const cur = rankMap[m][style];
      const prev = rankMap[months[idx + 1]]?.[style];

      const saleQty = cur ? cur.sale : 0;
      const drr = cur ? cur.drr : 0;
      const sc = drr ? (stockQty / drr).toFixed(1) : "";

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
        <td class="col-${m}">${cur ? cur.rank : "—"}</td>
        <td class="col-${m}">${saleQty}</td>
        <td class="col-${m}">${drr ? drr.toFixed(2) : "0.00"}</td>
        <td class="col-${m}">${sc}</td>
        <td class="col-${m}">${broken}</td>
        <td class="col-${m}" style="color:${color};font-weight:600">
          ${remark}
        </td>
      `;
    });

    html += `</tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  // ===============================
  // SINGLE MONTH TOGGLE
  // ===============================
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
