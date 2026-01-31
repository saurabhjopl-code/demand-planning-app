// ===================================================
// Summary 1: Sale Details
// Table: Month | Total Units Sold | DRR
// DRR = Monthly Units / Monthly Sale Days
// Grand Total DRR = Total Units / Total Sale Days
// ===================================================

export function renderSummarySale(data) {
  const container = document.getElementById("summary-1");
  if (!container) return;

  const sale = data.sale;
  const saleDays = data.saleDays;

  // -------------------------------
  // Month helper for sorting
  // -------------------------------
  const monthIndex = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4,
    MAY: 5, JUN: 6, JUL: 7, AUG: 8,
    SEP: 9, OCT: 10, NOV: 11, DEC: 12
  };

  function parseMonth(monthStr) {
    const [mon, year] = monthStr.split("-");
    return {
      year: Number(year),
      month: monthIndex[mon.toUpperCase()] || 0
    };
  }

  // -------------------------------
  // Build Month → Sale Days Map
  // -------------------------------
  const saleDaysMap = {};
  let totalSaleDays = 0;

  saleDays.forEach(row => {
    const month = row["Month"];
    const days = Number(row["Days"] || 0);
    saleDaysMap[month] = days;
    totalSaleDays += days;
  });

  // -------------------------------
  // Group Sale by Month
  // -------------------------------
  const monthMap = {};

  sale.forEach(row => {
    const month = row["Month"];
    const units = Number(row["Units"] || 0);

    monthMap[month] = (monthMap[month] || 0) + units;
  });

  // -------------------------------
  // Sort Months Chronologically
  // -------------------------------
  const sortedMonths = Object.keys(monthMap).sort((a, b) => {
    const ma = parseMonth(a);
    const mb = parseMonth(b);

    return ma.year !== mb.year
      ? ma.year - mb.year
      : ma.month - mb.month;
  });

  // -------------------------------
  // Build Table HTML
  // -------------------------------
  let grandTotalUnits = 0;

  let html = `
    <h3>Sale Details</h3>
    <table class="summary-table center">
      <thead>
        <tr>
          <th>Month</th>
          <th>Total Units Sold</th>
          <th>DRR</th>
        </tr>
      </thead>
      <tbody>
  `;

  sortedMonths.forEach(month => {
    const totalUnits = monthMap[month];
    const days = saleDaysMap[month] || 0;
    const drr = days > 0 ? (totalUnits / days).toFixed(2) : "0.00";

    grandTotalUnits += totalUnits;

    html += `
      <tr>
        <td>${month}</td>
        <td>${totalUnits}</td>
        <td>${drr}</td>
      </tr>
    `;
  });

  // -------------------------------
  // Grand Total Row
  // -------------------------------
  const grandDRR =
    totalSaleDays > 0
      ? (grandTotalUnits / totalSaleDays).toFixed(2)
      : "0.00";

  html += `
      <tr style="font-weight:700;background:#f8fafc">
        <td>Grand Total</td>
        <td>${grandTotalUnits}</td>
        <td>${grandDRR}</td>
      </tr>
    </tbody>
    </table>
  `;

  container.innerHTML = html;
}
