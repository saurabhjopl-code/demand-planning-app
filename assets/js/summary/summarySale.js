// ===================================================
// Summary 1: Sale Details
// Table: Month | Total Units Sold | DRR
// DRR = Total Units Sold / GLOBAL Total Sale Days
// ===================================================

export function renderSummarySale(data) {
  const container = document.getElementById("summary-1");
  if (!container) return;

  const sale = data.sale;
  const totalSaleDays = data.totalSaleDays;

  // -------------------------------
  // Group Sale by Month
  // -------------------------------
  const monthMap = {};

  sale.forEach(row => {
    const month = row["Month"];
    const units = Number(row["Units"] || 0);

    if (!monthMap[month]) {
      monthMap[month] = 0;
    }
    monthMap[month] += units;
  });

  // -------------------------------
  // Build Table HTML
  // -------------------------------
  let html = `
    <h3>Sale Details</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Total Units Sold</th>
          <th>DRR</th>
        </tr>
      </thead>
      <tbody>
  `;

  Object.keys(monthMap).forEach(month => {
    const totalUnits = monthMap[month];
    const drr =
      totalSaleDays > 0 ? (totalUnits / totalSaleDays).toFixed(2) : "0.00";

    html += `
      <tr>
        <td>${month}</td>
        <td>${totalUnits}</td>
        <td>${drr}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
