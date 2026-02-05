import fetch from 'node-fetch';

/**
 * Translation Service using Google Translate API (Free Tier)
 * Uses the free Google Translate API endpoint
 */

// Detect language of text
async function detectLanguage(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Extract detected language from response
    const detectedLang = data[2] || 'en';
    return detectedLang;
  } catch (error) {
    return 'en'; // Default to English
  }
}

// Translate text to target language
async function translateText(text, targetLang = 'en', sourceLang = 'auto') {
  try {
    // If target is same as source, return original
    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      return { translatedText: text, detectedSourceLanguage: sourceLang };
    }
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Extract translated text
    let translatedText = '';
    if (data && data[0]) {
      data[0].forEach(item => {
        if (item && item[0]) {
          translatedText += item[0];
        }
      });
    }
    
    // Extract detected source language
    const detectedSourceLanguage = data[2] || sourceLang;
    
    return {
      translatedText: translatedText || text,
      detectedSourceLanguage
    };
  } catch (error) {
    return { translatedText: text, detectedSourceLanguage: 'unknown', error: error.message };
  }
}

// Get city from coordinates using reverse geocoding
async function getCityFromCoordinates(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      { headers: { 'User-Agent': 'YouTube-Clone-Comment-Service' } }
    );
    const data = await response.json();
    
    const city = data.address?.city || 
                 data.address?.town || 
                 data.address?.village || 
                 data.address?.county ||
                 'Unknown';
    
    return city;
  } catch (error) {
    return 'Unknown';
  }
}

// Get city from IP address
async function getCityFromIP(ip) {
  try {
    // Use a free IP geolocation service
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    return data.city || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

// Supported languages
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'hi': 'Hindi',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'ru': 'Russian',
  'pt': 'Portuguese',
  'it': 'Italian',
  'ta': 'Tamil',
  'te': 'Telugu',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'bn': 'Bengali',
  'mr': 'Marathi',
  'gu': 'Gujarati',
  'pa': 'Punjabi'
};

export {
  detectLanguage,
  translateText,
  getCityFromCoordinates,
  getCityFromIP,
  SUPPORTED_LANGUAGES
};
