const fs = require('fs');

const js = fs.readFileSync('app.js', 'utf8');
const ids = new Set();
const regex = /getElementById\(['"]([a-zA-Z0-9_\-]+)['"]\)/g;
let m;
while ((m = regex.exec(js)) !== null) {
  const id = m[1];
  if (id.toLowerCase().includes('driver') || id.toLowerCase().includes('cockpit') || id.toLowerCase().includes('trip') || id.toLowerCase().includes('halt') || id.toLowerCase().includes('manifest')) {
    ids.add(id);
  }
}

const list = Array.from(ids).sort();
console.log('Total driver-related IDs found in app.js:', list.length);
fs.writeFileSync('scratch/driver_ids.json', JSON.stringify(list, null, 2));
console.log('Saved to scratch/driver_ids.json');
