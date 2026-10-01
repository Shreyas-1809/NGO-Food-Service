const fs = require('fs');
let content = fs.readFileSync('frontend/src/index.css', 'utf8');

const additionalCss = `
.custom-leaflet-marker {
  display: block;
  filter: none !important;
}
.custom-leaflet-marker div {
  filter: none !important;
}
.leaflet-marker-pane, .leaflet-popup-pane {
  filter: none !important;
}
`;

if (!content.includes('.custom-leaflet-marker')) {
  content += additionalCss;
  fs.writeFileSync('frontend/src/index.css', content);
  console.log('Appended marker CSS to index.css');
} else {
  console.log('Marker CSS already present');
}
