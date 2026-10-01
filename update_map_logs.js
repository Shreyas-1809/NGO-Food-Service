const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/MapPage.jsx', 'utf8');

const regexDonations = /(if \(minQty\) resultDons = resultDons\.filter\(item => item\.quantity >= parseInt\(minQty, 10\)\);\s*)(setFilteredDonations\(resultDons\);)/;
const injectDonationsLog = `
    const skippedDonations = donations.filter(d => !resultDons.some(rd => rd.id === d.id));
    console.log(\`[DEV-MAP-LOG] SURPLUS: \${donations.length} loaded, \${resultDons.length} rendered. Skipped: \${skippedDonations.length}.\`);
    if (skippedDonations.length > 0) {
      console.log('[DEV-MAP-LOG] SURPLUS SKIPPED REASONS:');
      skippedDonations.forEach(d => {
        let reason = [];
        if (!getCoords(d)) reason.push('Missing/invalid coordinates');
        if (showSurplus === false && !isDonorUser) reason.push('Hidden by toggle (showSurplus is off)');
        if (category !== 'All' && !((d.category || '').toLowerCase() === category.toLowerCase() || (d.foodType || '').toLowerCase() === category.toLowerCase())) reason.push('Filtered by category');
        if (urgency !== 'All' && calculateListingUrgency(d).level !== urgency) reason.push('Filtered by urgency');
        if (status !== 'All' && d.status !== status) reason.push('Filtered by status');
        if (minQty && d.quantity < parseInt(minQty, 10)) reason.push('Filtered by minQty');
        console.log(\`  - \${d.id} (\${d.title || d.itemName}): \${reason.join(', ')}\`);
      });
    }
`;
content = content.replace(regexDonations, "$1" + injectDonationsLog + "\n    $2");

const regexNgos = /(if \(ngoStatus !== 'All'\) {\s*const isVerified = ngoStatus === 'Verified';\s*resultNgos = resultNgos\.filter\(item => item\.verified === isVerified\);\s*}\s*)(setFilteredNgos\(resultNgos\);)/;
const injectNgosLog = `
    const skippedNgos = ngos.filter(n => !resultNgos.some(rn => rn.id === n.id));
    console.log(\`[DEV-MAP-LOG] NGOs: \${ngos.length} loaded, \${resultNgos.length} rendered. Skipped: \${skippedNgos.length}.\`);
    if (skippedNgos.length > 0) {
      console.log('[DEV-MAP-LOG] NGO SKIPPED REASONS:');
      skippedNgos.forEach(n => {
        let reason = [];
        if (!getCoords(n)) reason.push('Missing/invalid coordinates');
        const isShelter = isShelterOrOrphanage(n);
        if (isShelter && !showShelters) reason.push('Hidden by toggle (showShelters is off)');
        if (!isShelter && !showNgos) reason.push('Hidden by toggle (showNgos is off)');
        if (radius !== 'All' && n.distanceKm > parseInt(radius, 10)) reason.push('Filtered by radius');
        if (ngoCategory !== 'All' && !(n.foodTypesAccepted || []).includes(ngoCategory) && !(n.areasOfSupport || []).includes(ngoCategory)) reason.push('Filtered by category');
        if (ngoStatus !== 'All' && n.verified !== (ngoStatus === 'Verified')) reason.push('Filtered by status');
        console.log(\`  - \${n.id} (\${n.name}): \${reason.join(', ')}\`);
      });
    }
`;
content = content.replace(regexNgos, "$1" + injectNgosLog + "\n    $2");

const regexDonors = /(if \(radius !== 'All'\) {\s*const maxDist = parseInt\(radius, 10\);\s*resultDonors = resultDonors\.filter\(item => item\.distanceKm !== undefined && item\.distanceKm <= maxDist\);\s*}\s*)(setFilteredDonors\(resultDonors\);)/;
const injectDonorsLog = `
    const skippedDonors = donors.filter(d => !resultDonors.some(rd => rd.id === d.id));
    console.log(\`[DEV-MAP-LOG] DONORS: \${donors.length} loaded, \${resultDonors.length} rendered. Skipped: \${skippedDonors.length}.\`);
    if (skippedDonors.length > 0) {
      console.log('[DEV-MAP-LOG] DONOR SKIPPED REASONS:');
      skippedDonors.forEach(d => {
        let reason = [];
        if (!getCoords(d)) reason.push('Missing/invalid coordinates');
        if (!showDonors) reason.push('Hidden by toggle (showDonors is off)');
        if (radius !== 'All' && d.distanceKm > parseInt(radius, 10)) reason.push('Filtered by radius');
        console.log(\`  - \${d.id} (\${d.name}): \${reason.join(', ')}\`);
      });
    }
`;
content = content.replace(regexDonors, "$1" + injectDonorsLog + "\n    $2");

fs.writeFileSync('frontend/src/components/MapPage.jsx', content);
console.log('Added dev logs to MapPage.jsx');
