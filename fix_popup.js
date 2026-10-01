const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/MapPage.jsx', 'utf8');

content = content.replace(
  '{!isPopup && (isNgo || isDonor) && item.city && (',
  '{(isNgo || isDonor) && item.description && ('
);

fs.writeFileSync('frontend/src/components/MapPage.jsx', content);
console.log('Popup description updated');
