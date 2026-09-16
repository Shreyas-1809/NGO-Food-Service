const express = require('express');
const router = express.Router();

/**
 * POST /api/translate
 * Payload: { text: string | string[], targetLanguage: string }
 * Uses free MyMemory API (no key needed).
 */
router.post('/', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and targetLanguage are required.' });
    }

    const supportedLanguages = ['en', 'hi', 'mr', 'gu', 'ta', 'te'];
    if (!supportedLanguages.includes(targetLanguage)) {
      return res.status(400).json({ error: 'Unsupported target language.' });
    }

    // If English, return input unchanged
    if (targetLanguage === 'en') {
      return res.json({ translatedText: text });
    }

    // Global translation queue to enforce strict rate limiting (4 req/sec) across all requests
    const translateSingle = async (str) => {
      if (!str || typeof str !== 'string' || !str.trim()) return str;
      
      return new Promise((resolve) => {
        global.translationQueue = global.translationQueue || [];
        
        global.translationQueue.push({
          str,
          targetLanguage,
          resolve
        });
        
        if (!global.isProcessingTranslationQueue) {
          global.isProcessingTranslationQueue = true;
          
          (async function processQueue() {
            while (global.translationQueue.length > 0) {
              const job = global.translationQueue.shift();
              try {
                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(job.str.trim())}&langpair=en|${job.targetLanguage}&de=hello@foodbridge.com`;
                const response = await fetch(url);
                
                if (response.ok) {
                  const data = await response.json();
                  if (data && data.responseData && data.responseData.translatedText) {
                    // Check if it returned a quota error in the response body (MyMemory quirk)
                    if (!data.responseData.translatedText.includes('MYMEMORY WARNING')) {
                      job.resolve(data.responseData.translatedText);
                    } else {
                      job.resolve(job.str);
                    }
                  } else {
                    job.resolve(job.str);
                  }
                } else {
                  job.resolve(job.str);
                }
              } catch (err) {
                console.error('MyMemory Translation error:', err.message);
                job.resolve(job.str);
              }
              
              // Wait 250ms before next request (max 4 req/sec)
              await new Promise(r => setTimeout(r, 250));
            }
            global.isProcessingTranslationQueue = false;
          })();
        }
      });
    };

    if (Array.isArray(text)) {
      const results = await Promise.all(text.map(t => translateSingle(t)));
      return res.json({ translatedText: results });
    } else {
      const result = await translateSingle(text);
      return res.json({ translatedText: result });
    }
  } catch (error) {
    console.error('Translation endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error during translation' });
  }
});

module.exports = router;
