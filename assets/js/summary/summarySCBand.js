// ===================================================
// Summary 3: SC Band Summary
// Table:
// Band | Styles | Total Units Sold | Total Stock
//
// Style-level calculation
// DRR = Style Sale / GLOBAL Total Sale Days
// SC  = Style Stock / DRR
// ===================================================

export function renderSummarySCBand(data) {
  const container = document.getElementById("summary-3");
  if (!container) return;

  const sale = data.sale;
  const stock = data.stock;
  const totalSaleDays = data.totalSaleDays;

  // -------------------------------
  // Style → Sale Units
  // -------------------------------
  const styleSaleMap = {};
  sale.forEach(row => {
    const style = row["Style ID"];
    const units = Number(row["Units"] || 0);

    if (!styleSaleMap[style]) styleSaleMap[style] = 0;
    styleSaleMap[style] += units;
  });

  // -------------------------------
  // Style → Stock Units
  // -------------------------------
  const styleStockMap = {};
  stock.forEach(row => {
    const style = row["Style ID"];
    const units = Number(row["Units"] || 0);

    if (!styleStockMap[style]) styleStockMap[style] = 0;
    styleStockMap[style] += units;
  });

  // -------------------------------
  // Initialize Bands
  // -------------------------------
  const bands = {
    "0–30": { styles: 0, sale: 0, stock: 0 },
    "30–60": { styles: 0, sale: 0, stock: 0 },
    "60–120": { styles: 0, sale: 0, stock: 0 },
    "120+": { styles: 0, sale: 0, stock: 0 }
  };

  // -------------------------------
  // Style-level SC Calculation
  // -------------------------------
  const allStyles = new Set([
    ...Object.keys(styleSaleMap),
    ...Object.keys(styleStockMap)
  ]);

  allStyles.forEach(style => {
    const totalSale = styleSaleMap[style] || 0;
    const totalStock = styleStockMap[style] || 0;

    const drr =
      totalSaleDays > 0 ? totalSale / totalSaleDays : 0;

    let scBand = "120+";

    if (drr > 0) {
      const sc = totalStock / drr;

      if (sc < 30) scBand = "0–30";
      else if (sc < 60) scBand = "30–60";
      else if (sc < 120) scBand = "60–120";
      else scBand = "120+";
    }

    bands[scBand].styles += 1;
    bands[scBand].sale += totalSale;
    bands[scBand].stock += totalStock;
  });

  // -------------------------------
  // Build Table HTML
  // -------------------------------
  let html = `
    <h3>SC Band Summary</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Band</th>
          <th>Styles</th>
          <th>Total Units Sold</th>
          <th>Total Stock</th>
        </tr>
      </thead>
      <tbody>
  `;

  Object.keys(bands).forEach(band => {
    html += `
      <tr>
        <td>${band}</td>
        <td>${bands[band].styles}</td>
        <td>${bands[band].sale}</td>
        <td>${bands[band].stock}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
