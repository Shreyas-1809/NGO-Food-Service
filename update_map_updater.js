const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/MapPage.jsx', 'utf8');

const mapUpdaterOld = `// Auto-resize Map when container size changes
const MapUpdater = () => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timer);
  }, [map]);
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
};`;

const mapUpdaterNew = `// Auto-resize Map when container size changes
const MapUpdater = ({ visibleCoords }) => {
  const map = useMap();
  
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timer);
  }, [map]);
  
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (visibleCoords && visibleCoords.length > 0) {
      const bounds = L.latLngBounds(visibleCoords);
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1 });
      }
    } else {
      map.flyTo([18.5204, 73.8567], 12, { duration: 1 });
    }
  }, [map, visibleCoords]);

  return null;
};`;

content = content.replace(mapUpdaterOld, mapUpdaterNew);
content = content.replace('<MapUpdater />', '<MapUpdater visibleCoords={visibleCoords} />');

fs.writeFileSync('frontend/src/components/MapPage.jsx', content);
console.log('MapUpdater replaced successfully');
