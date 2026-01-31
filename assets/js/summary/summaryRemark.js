// ===================================================
// Summary 5: Company Remark-wise Sale (FINAL + GRAND TOTAL)
// Table:
// Company Remark | Total Units Sold | DRR | Total Stock | SC
//
// Sorted by business priority (LOCKED ORDER)
// ===================================================

export function renderSummaryRemark(data) {
  const container = document.getElementById("summary-5");
  if (!container) return;

  const sale = data.sale;
  const stock = data.stock;
  const styleStatus = data.styleStatus;
  const totalSaleDays = data.totalSaleDays;

  // -------------------------------
  // Style ID → Company Remark
  // -------------------------------
  const styleRemarkMap = {};
  styleStatus.forEach(row => {
    const style = row["Style ID"];
    const remark = row["Company Remark"] || "Blank";
    styleRemarkMap[style] = remark;
  });

  // -------------------------------
  // Remark → Sale Units
  // -------------------------------
  const remarkSaleMap = {};
  sale.forEach(row => {
    const style = row["Style ID"];
    const units = Number(row["Units"] || 0);
    const remark = styleRemarkMap[style] || "Blank";

    remarkSaleMap[remark] = (remarkSaleMap[remark] || 0) + units;
  });

  // -------------------------------
  // Remark → Stock Units
  // -------------------------------
  const remarkStockMap = {};
  stock.forEach(row => {
    const style = row["Style ID"];
    const units = Number(row["Units"] || 0);
    const remark = styleRemarkMap[style] || "Blank";

    remarkStockMap[remark] = (remarkStockMap[remark] || 0) + units;
  });

  // -------------------------------
  // Business Priority Order (LOCKED)
  // -------------------------------
  const priorityOrder = [
    "Diamond A",
    "Diamond B",
    "Diamond C",
    "Platinum A",
    "Platinum B",
    "Platinum C",
    "New Listing",
    "Closed"
  ];

  // -------------------------------
  // Build Rows + Grand Totals
  // -------------------------------
  const rows = [];

  let grandSale = 0;
  let grandStock = 0;

  Object.keys(remarkSaleMap).forEach(remark => {
    const totalUnitsSold = remarkSaleMap[remark];
    const totalStock = remarkStockMap[remark] || 0;

    const drr =
      totalSaleDays > 0 ? totalUnitsSold / totalSaleDays : 0;

    let sc = 0;
    if (drr === 0 && totalStock > 0) {
      sc = "∞";
    } else if (drr > 0) {
      sc = (totalStock / drr).toFixed(0);
    }

    grandSale += totalUnitsSold;
    grandStock += totalStock;

    rows.push({
      remark,
      totalUnitsSold,
      drr: drr.toFixed(2),
      totalStock,
      sc
    });
  });

  // -------------------------------
  // Sort by Priority Order
  // -------------------------------
  rows.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.remark);
    const bIndex = priorityOrder.indexOf(b.remark);

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });

  // -------------------------------
  // Grand Total Calculations
  // -------------------------------
  const grandDRR =
    totalSaleDays > 0 ? (grandSale / totalSaleDays).toFixed(2) : "0.00";

  let grandSC = 0;
  if (grandDRR === "0.00" && grandStock > 0) {
    grandSC = "∞";
  } else if (Number(grandDRR) > 0) {
    grandSC = (grandStock / Number(grandDRR)).toFixed(0);
  }

  // -------------------------------
  // Build Table HTML
  // -------------------------------
  let html = `
    <h3>Company Remark-wise Sale</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Company Remark</th>
          <th>Total Units Sold</th>
          <th>DRR</th>
          <th>Total Stock</th>
          <th>SC</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach(r => {
    html += `
      <tr>
        <td>${r.remark}</td>
        <td>${r.totalUnitsSold}</td>
        <td>${r.drr}</td>
        <td>${r.totalStock}</td>
        <td>${r.sc}</td>
      </tr>
    `;
  });

  // -------------------------------
  // Grand Total Row
  // -------------------------------
  html += `
      <tr style="font-weight:700;background:#f8fafc">
        <td>Grand Total</td>
        <td>${grandSale}</td>
        <td>${grandDRR}</td>
        <td>${grandStock}</td>
        <td>${grandSC}</td>
      </tr>
    </tbody>
    </table>
  `;

  container.innerHTML = html;
}
