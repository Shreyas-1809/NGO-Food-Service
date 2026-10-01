const fs = require('fs');
const path = 'frontend/src/i18n/translations.js';
let content = fs.readFileSync(path, 'utf8');

const newKeys = {
  'Navigate': { 'en': 'Navigate', 'hi': 'नेविगेट करें', 'mr': 'नेव्हिगेट करा', 'gu': 'નેવિગેટ કરો', 'ta': 'வழிசெலுத்து', 'te': 'నావిగేట్ చేయండి' },
  'Open in Google Maps': { 'en': 'Open in Google Maps', 'hi': 'Google Maps में खोलें', 'mr': 'Google Maps मध्ये उघडा', 'gu': 'Google Maps માં ખોલો', 'ta': 'Google Maps-ல் திற', 'te': 'Google Maps లో తెరవండి' },
  'Driving': { 'en': 'Driving', 'hi': 'ड्राइविंग', 'mr': 'ड्रायव्हिंग', 'gu': 'ડ્રાઇવિંગ', 'ta': 'ஓட்டுதல்', 'te': 'డ్రైవింగ్' },
  'Walking': { 'en': 'Walking', 'hi': 'पैदल', 'mr': 'चालत', 'gu': 'ચાલતા', 'ta': 'நடப்பது', 'te': 'నడక' },
  'Transit': { 'en': 'Transit', 'hi': 'सार्वजनिक परिवहन', 'mr': 'सार्वजनिक वाहतूक', 'gu': 'જાહેર પરિવહન', 'ta': 'பொதுப் போக்குவரத்து', 'te': 'రవాణా' },
  'Distance': { 'en': 'Distance', 'hi': 'दूरी', 'mr': 'अंतर', 'gu': 'અંતર', 'ta': 'தூரம்', 'te': 'దూరం' }
};

let objMatch = content.match(/export\s+const\s+landingTranslations\s*=\s*({[\s\S]*});/);
if (objMatch) {
  let strObj = objMatch[1];
  let obj = eval('(' + strObj + ')');
  
  for (const lang of Object.keys(obj)) {
    for (const [key, vals] of Object.entries(newKeys)) {
      if (!obj[lang][key]) {
        obj[lang][key] = vals[lang] || vals['en'];
      }
    }
  }
  
  let newStrObj = JSON.stringify(obj, null, 2);
  content = content.replace(strObj, newStrObj);
  fs.writeFileSync(path, content);
  console.log('Updated translations.js');
} else {
  console.log('Match failed');
}
