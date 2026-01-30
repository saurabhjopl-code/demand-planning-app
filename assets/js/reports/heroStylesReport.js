// ===================================================
// HERO STYLES – Month-wise Top 20 (V2.6 STABLE)
// ===================================================
// Rank: Based ONLY on Total Sale
// Compare with Immediate Previous Month
// Closed styles excluded
// Brokenness from Size Count logic
// Expand / Collapse Month-wise
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
    totalSaleDays
  } = data;

  // -------------------------------
  // Closed Styles
  // -------------------------------
  const closedStyles = new Set(
    styleStatus
      .filter(r => String(r["Company Remark"]).toUpperCase() === "CLOSED")
      .map(r => r["Style ID"])
  );

  // -------------------------------
  // Size Count Map
  // -------------------------------
  const sizeCountMap = {};
  sizeCount.forEach(r => {
    sizeCountMap[r["Style ID"]] = Number(r["Size Count"] || 0);
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

  const months = Object.keys(monthStyleSale).sort(); // chronological

  let html = "";

  // -------------------------------
  // Helper: Broken Count
  // -------------------------------
  function getBrokenCount(style) {
    const sizeStock = stockByStyle[style] || {};
    return Object.values(sizeStock).filter(qty => qty < 10).length;
  }

  // -------------------------------
  // Process Month-wise
  // -------------------------------
  months.forEach((month, idx) => {
    const styles = Object.entries(monthStyleSale[month])
      .map(([style, totalSale]) => ({ style, totalSale }))
      .sort((a, b) => b.totalSale - a.totalSale)
      .slice(0, 20)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    const prevMonth = months[idx - 1];
    const prevMap = {};

    if (prevMonth) {
      Object.entries(monthStyleSale[prevMonth])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([style, sale], i) => {
          prevMap[style] = {
            rank: i + 1,
            drr: sale / totalSaleDays
          };
        });
    }

    // ---- Month Header ----
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

    styles.forEach(r => {
      const prev = prevMap[r.style];
      const drr = r.totalSale / totalSaleDays;
      const stockQty = totalStockMap[r.style] || 0;
      const sc = drr ? stockQty / drr : 0;
      const broken = getBrokenCount(r.style);

      let remark = "";
      let color = "";

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
