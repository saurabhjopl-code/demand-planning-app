export function renderSizeCurveReport(data) {
  const container = document.getElementById("report-content");

  const sale = data.sale;
  const stock = data.stock;

  // ===============================
  // SALES BY STYLE & SIZE
  // ===============================
  const saleByStyleSize = {};
  const styleSales = {};

  sale.forEach(r => {
    const style = r["Style ID"];
    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    styleSales[style] = (styleSales[style] || 0) + units;

    if (!saleByStyleSize[style]) saleByStyleSize[style] = {};
    saleByStyleSize[style][size] =
      (saleByStyleSize[style][size] || 0) + units;
  });

  // ===============================
  // STOCK BY STYLE & SIZE
  // ===============================
  const stockByStyleSize = {};
  const styleStock = {};

  stock.forEach(r => {
    const style = r["Style ID"];
    const size = r["Size"];
    const units = Number(r["Units"] || 0);

    styleStock[style] = (styleStock[style] || 0) + units;

    if (!stockByStyleSize[style]) stockByStyleSize[style] = {};
    stockByStyleSize[style][size] =
      (stockByStyleSize[style][size] || 0) + units;
  });

  // ===============================
  // BUILD STYLE DATA
  // ===============================
  const styles = Object.keys(styleSales)
    .map(style => {
      const totalSales = styleSales[style];
      const totalStock = styleStock[style] || 0;

      let maxVariance = 0;

      Object.keys(saleByStyleSize[style] || {}).forEach(size => {
        const saleQty = saleByStyleSize[style][size];
        const stockQty =
          (stockByStyleSize[style] || {})[size] || 0;

        const salePct = totalSales ? saleQty / totalSales : 0;
        const stockPct = totalStock ? stockQty / totalStock : 0;
        const variance = Math.abs(stockPct - salePct);

        maxVariance = Math.max(maxVariance, variance);
      });

      return { style, totalSales, totalStock, maxVariance };
    })
    .sort((a, b) => b.maxVariance - a.maxVariance);

  // ===============================
  // RENDER TABLE
  // ===============================
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th></th>
          <th>Style ID / Size</th>
          <th>Sales</th>
          <th>Sales %</th>
          <th>Total Stock</th>
          <th>Stock %</th>
          <th>Variance %</th>
        </tr>
      </thead>
      <tbody>
  `;

  styles.forEach(s => {
    html += `
      <tr class="style-row" data-style="${s.style}">
        <td class="toggle">+</td>
        <td>${s.style}</td>
        <td>${s.totalSales}</td>
        <td>100%</td>
        <td>${s.totalStock}</td>
        <td>100%</td>
        <td>${(s.maxVariance * 100).toFixed(1)}%</td>
      </tr>
    `;

    const sizes = saleByStyleSize[s.style] || {};
    Object.keys(sizes).forEach(size => {
      const saleQty = sizes[size];
      const stockQty =
        (stockByStyleSize[s.style] || {})[size] || 0;

      const salePct = s.totalSales
        ? (saleQty / s.totalSales) * 100
        : 0;
      const stockPct = s.totalStock
        ? (stockQty / s.totalStock) * 100
        : 0;

      html += `
        <tr class="size-row" data-parent="${s.style}" style="display:none">
          <td></td>
          <td>${size}</td>
          <td>${saleQty}</td>
          <td>${salePct.toFixed(1)}%</td>
          <td>${stockQty}</td>
          <td>${stockPct.toFixed(1)}%</td>
          <td>${(stockPct - salePct).toFixed(1)}%</td>
        </tr>
      `;
    });
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  // ===============================
  // EXPAND / COLLAPSE
  // ===============================
  container.querySelectorAll(".style-row").forEach(row => {
    row.onclick = () => {
      const style = row.dataset.style;
      const expanded = row.classList.toggle("expanded");
      row.querySelector(".toggle").textContent = expanded ? "−" : "+";

      container
        .querySelectorAll(`.size-row[data-parent="${style}"]`)
        .forEach(r => {
          r.style.display = expanded ? "table-row" : "none";
        });
    };
  });
}
