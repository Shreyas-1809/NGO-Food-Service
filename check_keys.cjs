const fs = require('fs');
const path = require('path');
const keysInCode = new Set();
function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            // <T text=\"...\" />
            let re = /<T\s+text=["']([^"']+)["']/g;
            let m;
            while ((m = re.exec(content)) !== null) {
                keysInCode.add(m[1]);
            }
            // <T text={'...'} />
            re = /<T\s+text=\{["'`]?([^"'`\}]+)["'`]?\}/g;
            while ((m = re.exec(content)) !== null) {
                if (!m[1].includes('$')) keysInCode.add(m[1]);
            }
            // useTranslatedString('...')
            re = /useTranslatedString\(["']([^"']+)["']\)/g;
            while ((m = re.exec(content)) !== null) {
                keysInCode.add(m[1]);
            }
        }
    }
}
searchDir('frontend/src');

import('file:///' + path.resolve('frontend/src/i18n/translations.js').replace(/\\/g, '/')).then(module => {
    const translations = module.landingTranslations;
    const langs = ['en', 'hi', 'mr', 'gu', 'ta', 'te'];
    let allMissing = [];

    for (const lang of langs) {
        const dict = translations[lang] || {};
        for (const key of keysInCode) {
            // ONLY consider strings that look like 'category.veg' or 'tab.label'
            // We ignore spaces, variables, etc.
            if (key.includes('.') && !key.includes(' ') && !key.includes('$')) {
                if (!dict[key]) {
                    allMissing.push(key);
                }
            }
        }
    }

    const uniqueMissingRaw = [...new Set(allMissing)];
    console.log('Missing raw keys in UI:');
    console.log(uniqueMissingRaw);
}).catch(console.error);
