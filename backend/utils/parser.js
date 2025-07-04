// File: utils/parser.js

const { JSDOM } = require('jsdom');

function parseHtmlFile(buffer) {
  const html = buffer.toString();
  const dom = new JSDOM(html);
  const rows = dom.window.document.querySelectorAll("table tr");
  const playersData = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll("td");
    if (cells.length > 90) { // Đảm bảo hàng có đủ dữ liệu
        let valueText = cells[94]?.textContent || '0';
        let value = 0;
        if (valueText.includes('M')) {
            value = parseFloat(valueText.replace('€', '').replace('M', ''));
        } else if (valueText.includes('K')) {
            value = parseFloat(valueText.replace('€', '').replace('K', '')) / 1000;
        }

        playersData.push({
            name: cells[1]?.textContent || 'N/A',
            position: cells[2]?.textContent || '',
            morale: cells[7]?.textContent || '-',
            matches: cells[9]?.textContent.split(' ')[0] || '0',
            goals: parseInt(cells[10]?.textContent) || 0,
            assists: parseInt(cells[11]?.textContent) || 0,
            workRate: parseInt(cells[13]?.textContent) || 0,
            technique: parseInt(cells[16]?.textContent) || 0,
            pace: parseInt(cells[27]?.textContent) || 0,
            personality: cells[60]?.textContent || '-',
            nation: cells[62]?.textContent || '',
            dorsal: parseInt(cells[64]?.textContent) || null,
            age: parseInt(cells[66]?.textContent) || 0,
            value: value,
            avgRating: parseFloat(cells[72]?.textContent) || 0,
            ca: parseInt(cells[92]?.textContent) || 0,
            pa: parseInt(cells[93]?.textContent) || 0,
        });
    }
  }
  return playersData;
}

module.exports = { parseHtmlFile };