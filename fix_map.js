const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/MapPage.jsx', 'utf8');

content = content.replace(
  "            /            {/* SURPLUS LISTINGS (NGO sees all if showSurplus; Donor sees ONLY their own) */}",
  "            />\n            {/* SURPLUS LISTINGS (NGO sees all if showSurplus; Donor sees ONLY their own) */}"
);
content = content.replace(
  "            )} )}",
  "            )}"
);

fs.writeFileSync('frontend/src/components/MapPage.jsx', content);
console.log('Fixed MapPage.jsx syntax');
