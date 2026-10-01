const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/MapPage.jsx', 'utf8');

const oldHandleNavigateAndRenderItemCard = content.substring(
  content.indexOf('  const handleNavigate = (item) => {'),
  content.indexOf('  const hasNoResults =')
);

const newItemCard = `
  const ItemCard = ({ item, isPopup = false }) => {
    const [travelMode, setTravelMode] = useState('driving');
    
    const isSurplus = item.type === 'surplus';
    const isDonor = item.type === 'donor';
    const isNgo = item.type === 'ngo';
    
    const handleNavigation = (e) => {
      e.stopPropagation();
      const dest = \`\${item.location.lat},\${item.location.lng}\`;
      let url = \`https://www.google.com/maps/dir/?api=1&destination=\${dest}&travelmode=\${travelMode}\`;
      if (item.name || item.title) {
        url += \`&destination_place_id=\${encodeURIComponent(item.name || item.title)}\`;
      }
      if (!locationError && userLocation && isValidCoord(userLocation.lat, userLocation.lng)) {
        url += \`&origin=\${userLocation.lat},\${userLocation.lng}\`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleGoogleMapsLink = (e) => {
      e.stopPropagation();
      const dest = \`\${item.location.lat},\${item.location.lng}\`;
      const url = \`https://www.google.com/maps/search/?api=1&query=\${dest}\`;
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
      <div className={\`\${isPopup ? 'w-72 -m-4 p-5' : 'p-5 hover:border-emerald-500 h-full flex flex-col'} bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors text-slate-900 dark:text-white\`}>
        {isPopup && (
           <h3 className="font-bold text-sm leading-tight pr-4 mb-2">
             {item.title || item.name}
           </h3>
        )}
        {!isPopup && (
           <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{item.name || item.title}</h3>
        )}
        
        {isPopup && item.area && (
           <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">{item.area}</p>
        )}
        {isPopup && item.locality && !item.area && (
           <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">{item.locality}</p>
        )}
        
        <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 flex-1 flex flex-col">
          {item.quantity && (
            <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
              {item.quantity} {item.unit}
            </p>
          )}
          {item.distanceKm !== undefined ? (
            <p className="flex items-center font-medium">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              ~{item.distanceKm.toFixed(1)} km <T text="Distance" />
            </p>
          ) : (
            <p className="flex items-center font-medium text-slate-400">
              <MapPinOff className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              <T text="Location unavailable" />
            </p>
          )}
          
          {isSurplus && calculateListingUrgency(item).level !== 'EXPIRED' && (
            <div className="mt-2 pt-1">
              {(() => {
                const urgencyInfo = calculateListingUrgency(item);
                return (
                  <span className={\`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold \${
                    urgencyInfo.level === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800' :
                    urgencyInfo.level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }\`}>
                    <T text={urgencyInfo.level} /> <T text="URGENCY" /> - <T text={urgencyInfo.text} />
                  </span>
                );
              })()}
            </div>
          )}
          
          {(isNgo || isDonor) && item.verified && (
            <div className="mt-2 pt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <ShieldCheck className="w-3 h-3 mr-1 shrink-0" /> <T text="VERIFIED PARTNER" />
              </span>
            </div>
          )}
          
          {(isNgo || isDonor) && item.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{item.description}</p>
          )}
        </div>
        
        <div className={\`mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col space-y-2 \${isPopup ? '' : 'mt-auto'}\`}>
          <button className={\`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex justify-center items-center shadow-sm \${
            isSurplus
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : isNgo ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }\`}>
            {isSurplus ? <T text="Claim Listing" /> : isNgo ? <T text="Donate" /> : <T text="View Profile" />}
            <ArrowRight className="w-3 h-3 ml-1.5 shrink-0" />
          </button>
          
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={(e) => { e.stopPropagation(); setTravelMode('driving'); }}
              className={\`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors \${travelMode === 'driving' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}\`}
            >
              <T text="Driving" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setTravelMode('walking'); }}
              className={\`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors \${travelMode === 'walking' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}\`}
            >
              <T text="Walking" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setTravelMode('transit'); }}
              className={\`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors \${travelMode === 'transit' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}\`}
            >
              <T text="Transit" />
            </button>
          </div>

          <button 
            onClick={handleNavigation}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex justify-center items-center shadow-sm"
          >
            <Navigation className="w-3 h-3 mr-1.5 shrink-0" />
            <T text="Navigate" />
          </button>
          
          {isPopup && (
            <button 
              onClick={handleGoogleMapsLink}
              className="w-full py-1.5 text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors text-center"
            >
              <T text="Open in Google Maps" />
            </button>
          )}
        </div>
      </div>
    );
  };
`;

content = content.replace(oldHandleNavigateAndRenderItemCard, newItemCard + '\n');
content = content.replace(/{renderItemCard\(item, true\)}/g, '<ItemCard item={item} isPopup={true} />');
content = content.replace(/{renderItemCard\(item, false\)}/g, '<ItemCard item={item} isPopup={false} />');

fs.writeFileSync('frontend/src/components/MapPage.jsx', content);
console.log('Done');
