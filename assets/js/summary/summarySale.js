// ===================================================
// Summary 1: Sale Details
// Table: Month | Total Units Sold | Sale Days | DRR
// DRR = Monthly Units / Monthly Sale Days
// ===================================================

export function renderSummarySale(data) {
  const container = document.getElementById("summary-1");
  if (!container) return;

  const sale = data.sale;
  const saleDays = data.saleDays;

  // -------------------------------
  // Build Month → Sale Days Map
  // -------------------------------
  const saleDaysMap = {};
  saleDays.forEach(row => {
    const month = row["Month"];
    const days = Number(row["Days"] || 0);
    saleDaysMap[month] = days;
  });

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
          <th>Sale Days</th>
          <th>DRR</th>
        </tr>
      </thead>
      <tbody>
  `;

  Object.keys(monthMap).forEach(month => {
    const totalUnits = monthMap[month];
    const days = saleDaysMap[month] || 0;
    const drr = days > 0 ? (totalUnits / days).toFixed(2) : "0.00";

    html += `
      <tr>
        <td>${month}</td>
        <td>${totalUnits}</td>
        <td>${days}</td>
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
