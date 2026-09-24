import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' }
];

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState(() => {
    return localStorage.getItem('app_language') || 'en';
  });

  // In-memory cache: { [lang_text]: translatedText }
  const cacheRef = useRef({});

  // Helper to load cache from localStorage
  const getCachedTranslation = useCallback((text, lang) => {
    if (lang === 'en') return text;
    const cacheKey = `${lang}__${text}`;
    if (cacheRef.current[cacheKey]) {
      return cacheRef.current[cacheKey];
    }
    const stored = localStorage.getItem(`t_cache_v2_${cacheKey}`);
    if (stored) {
      cacheRef.current[cacheKey] = stored;
      return stored;
    }
    return null;
  }, []);

  const setCachedTranslation = useCallback((text, lang, translated) => {
    const cacheKey = `${lang}__${text}`;
    cacheRef.current[cacheKey] = translated;
    try {
      localStorage.setItem(`t_cache_v2_${cacheKey}`, translated);
    } catch (e) {
      // LocalStorage error or full
    }
  }, []);

  const setLanguage = (langCode) => {
    if (SUPPORTED_LANGUAGES.some(l => l.code === langCode)) {
      setCurrentLanguageState(langCode);
      localStorage.setItem('app_language', langCode);
    }
  };

  const translateText = useCallback(async (text, targetLang = currentLanguage) => {
    if (!text || typeof text !== 'string' || !text.trim()) return text;
    if (targetLang === 'en') return text;

    const cached = getCachedTranslation(text, targetLang);
    if (cached) return cached;

    try {
      const res = await axios.post(`${API_URL}/api/translate`, {
        text,
        targetLanguage: targetLang
      });

      if (res.data && res.data.translatedText) {
        const translated = res.data.translatedText;
        setCachedTranslation(text, targetLang, translated);
        return translated;
      }
    } catch (err) {
      console.error('Translation error:', err);
    }
    return text;
  }, [currentLanguage, getCachedTranslation, setCachedTranslation]);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      languages: SUPPORTED_LANGUAGES,
      translateText,
      getCachedTranslation
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/**
 * Component to render translated text reactively.
 */
export const T = ({ text, fallback }) => {
  const { currentLanguage, translateText, getCachedTranslation } = useLanguage();
  const [translatedText, setTranslatedText] = useState(() => {
    if (currentLanguage === 'en') return text;
    return getCachedTranslation(text, currentLanguage) || fallback || text;
  });

  useEffect(() => {
    let isMounted = true;
    if (currentLanguage === 'en') {
      setTranslatedText(text);
      return;
    }

    const cached = getCachedTranslation(text, currentLanguage);
    if (cached) {
      setTranslatedText(cached);
    } else {
      setTranslatedText(text); // Display original while fetching
      translateText(text, currentLanguage).then(res => {
        if (isMounted && res) {
          setTranslatedText(res);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [text, currentLanguage, translateText, getCachedTranslation]);

  return <>{translatedText}</>;
};

/**
 * Hook to translate string values reactively (for placeholders, titles, attributes)
 */
export const useTranslatedString = (text) => {
  const { currentLanguage, translateText, getCachedTranslation } = useLanguage();
  const [translated, setTranslated] = useState(() => {
    if (!text || currentLanguage === 'en') return text;
    return getCachedTranslation(text, currentLanguage) || text;
  });

  useEffect(() => {
    let isMounted = true;
    if (!text || currentLanguage === 'en') {
      setTranslated(text);
      return;
    }

    const cached = getCachedTranslation(text, currentLanguage);
    if (cached) {
      setTranslated(cached);
    } else {
      setTranslated(text);
      translateText(text, currentLanguage).then(res => {
        if (isMounted && res) {
          setTranslated(res);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [text, currentLanguage, translateText, getCachedTranslation]);

  return translated;
};

