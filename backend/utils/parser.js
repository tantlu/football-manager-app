// File: backend/utils/parser.js
const { JSDOM } = require('jsdom');

function parseHtmlFile(buffer) {
  const html = buffer.toString();
  const dom = new JSDOM(html);
  const rows = dom.window.document.querySelectorAll("table tr");
  const playersData = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll("td");
    if (cells.length > 90) {
        let valueText = cells[94]?.textContent || '0';
        let value = 0;
        if (valueText.includes('M')) value = parseFloat(valueText.replace('€', '').replace('M', ''));
        else if (valueText.includes('K')) value = parseFloat(valueText.replace('€', '').replace('K', '')) / 1000;

        playersData.push({
            name: cells[1]?.textContent || 'N/A',
            position: cells[2]?.textContent || '',
            morale: cells[7]?.textContent || '-',
            matches: cells[9]?.textContent.split(' ')[0] || '0',
            goals: parseInt(cells[10]?.textContent) || 0,
            assists: parseInt(cells[11]?.textContent) || 0,
            personality: cells[60]?.textContent || '-',
            nation: cells[62]?.textContent || '',
            dorsal: parseInt(cells[64]?.textContent) || null,
            age: parseInt(cells[66]?.textContent) || 0,
            value: value,
            avgRating: parseFloat(cells[72]?.textContent) || 0,
            ca: parseInt(cells[92]?.textContent) || 0,
            pa: parseInt(cells[93]?.textContent) || 0,
            height: parseInt(cells[81]?.textContent) || null,
            weight: parseInt(cells[82]?.textContent) || null,
            leftFoot: cells[79]?.textContent || '',
            rightFoot: cells[78]?.textContent || '',
            // Technical
            corners: parseInt(cells[6]?.textContent) || 0,
            crossing: parseInt(cells[11]?.textContent) || 0,
            dribbling: parseInt(cells[8]?.textContent) || 0,
            finishing: parseInt(cells[43]?.textContent) || 0,
            firstTouch: parseInt(cells[42]?.textContent) || 0,
            freeKick: parseInt(cells[40]?.textContent) || 0,
            heading: parseInt(cells[37]?.textContent) || 0,
            longShots: parseInt(cells[34]?.textContent) || 0,
            longThrows: parseInt(cells[32]?.textContent) || 0,
            marking: parseInt(cells[31]?.textContent) || 0,
            passing: parseInt(cells[26]?.textContent) || 0,
            penalty: parseInt(cells[25]?.textContent) || 0,
            tackling: parseInt(cells[18]?.textContent) || 0,
            technique: parseInt(cells[16]?.textContent) || 0,
            // Mental
            aggression: parseInt(cells[57]?.textContent) || 0,
            anticipation: parseInt(cells[55]?.textContent) || 0,
            bravery: parseInt(cells[53]?.textContent) || 0,
            composure: parseInt(cells[51]?.textContent) || 0,
            concentration: parseInt(cells[49]?.textContent) || 0,
            decisions: parseInt(cells[47]?.textContent) || 0,
            determination: parseInt(cells[46]?.textContent) || 0,
            flair: parseInt(cells[41]?.textContent) || 0,
            leadership: parseInt(cells[35]?.textContent) || 0,
            offTheBall: parseInt(cells[29]?.textContent) || 0,
            positioning: parseInt(cells[24]?.textContent) || 0,
            teamwork: parseInt(cells[17]?.textContent) || 0,
            vision: parseInt(cells[14]?.textContent) || 0,
            workRate: parseInt(cells[13]?.textContent) || 0,
            // Physical
            acceleration: parseInt(cells[12]?.textContent) || 0,
            agility: parseInt(cells[56]?.textContent) || 0,
            balance: parseInt(cells[54]?.textContent) || 0,
            jumping: parseInt(cells[36]?.textContent) || 0,
            naturalFit: parseInt(cells[30]?.textContent) || 0,
            pace: parseInt(cells[27]?.textContent) || 0,
            stamina: parseInt(cells[20]?.textContent) || 0,
            strength: parseInt(cells[19]?.textContent) || 0,
        });
    }
  }
  return playersData;
}
module.exports = { parseHtmlFile };