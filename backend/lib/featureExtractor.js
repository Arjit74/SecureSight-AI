// backend/lib/featureExtractor.js - COMPLETE VERSION
class URLFeatureExtractor {
  extractFeatures(url) {
    try {
      // Parse URL
      let parsed;
      try {
        parsed = new URL(url.includes('://') ? url : `https://${url}`);
      } catch {
        // If URL is invalid, extract features from string
        return this.extractFeaturesFromString(url);
      }
      
      const hostname = parsed.hostname;
      const pathname = parsed.pathname;
      const search = parsed.search;
      const hash = parsed.hash;
      const protocol = parsed.protocol;
      
      // Feature extraction
      return {
        // ===== URL STRUCTURE FEATURES (15) =====
        url_length: url.length,
        domain_length: hostname.length,
        path_length: pathname.length,
        query_length: search.length,
        fragment_length: hash.length,
        subdomain_count: Math.max(0, hostname.split('.').length - 2),
        path_depth: pathname.split('/').filter(p => p).length,
        param_count: (search.match(/[&=]/g) || []).length,
        is_https: protocol === 'https:' ? 1 : 0,
        has_port: parsed.port !== '' ? 1 : 0,
        has_query: search.length > 0 ? 1 : 0,
        has_fragment: hash.length > 0 ? 1 : 0,
        has_at_symbol: url.includes('@') ? 1 : 0,
        has_double_slash: url.includes('//') && !url.includes('://') ? 1 : 0,
        is_ip_format: /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) ? 1 : 0,
        
        // ===== CHARACTER DISTRIBUTION (15) =====
        digit_count: (url.match(/\d/g) || []).length,
        digit_ratio: (url.match(/\d/g) || []).length / Math.max(1, url.length),
        letter_count: (url.match(/[a-zA-Z]/g) || []).length,
        letter_ratio: (url.match(/[a-zA-Z]/g) || []).length / Math.max(1, url.length),
        special_char_count: (url.match(/[^a-zA-Z0-9]/g) || []).length,
        special_char_ratio: (url.match(/[^a-zA-Z0-9]/g) || []).length / Math.max(1, url.length),
        dot_count: (url.match(/\./g) || []).length,
        hyphen_count: (url.match(/-/g) || []).length,
        underscore_count: (url.match(/_/g) || []).length,
        slash_count: (url.match(/\//g) || []).length,
        equal_count: (url.match(/=/g) || []).length,
        amp_count: (url.match(/&/g) || []).length,
        question_count: (url.match(/\?/g) || []).length,
        percent_count: (url.match(/%/g) || []).length,
        colon_count: (url.match(/:/g) || []).length,
        
        // ===== ENTROPY & RANDOMNESS (5) =====
        url_entropy: this.calculateEntropy(url),
        domain_entropy: this.calculateEntropy(hostname),
        path_entropy: this.calculateEntropy(pathname),
        query_entropy: this.calculateEntropy(search),
        avg_entropy: this.calculateAvgEntropy(url),
        
        // ===== DOMAIN SPECIFIC (15) =====
        tld_length: hostname.split('.').pop().length,
        tld_type: this.getTLDType(hostname),
        is_common_tld: this.isCommonTLD(hostname) ? 1 : 0,
        is_suspicious_tld: this.isSuspiciousTLD(hostname) ? 1 : 0,
        domain_token_count: hostname.split(/[.-]/).length,
        longest_token_length: Math.max(...hostname.split(/[.-]/).map(t => t.length)),
        shortest_token_length: Math.min(...hostname.split(/[.-]/).map(t => t.length)),
        avg_token_length: hostname.split(/[.-]/).reduce((a, b) => a + b.length, 0) / hostname.split(/[.-]/).length,
        vowel_count: (hostname.match(/[aeiou]/gi) || []).length,
        consonant_count: (hostname.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length,
        vowel_ratio: (hostname.match(/[aeiou]/gi) || []).length / Math.max(1, hostname.length),
        consecutive_consonants: this.maxConsecutiveConsonants(hostname),
        consecutive_digits: this.maxConsecutiveDigits(hostname),
        has_www: hostname.startsWith('www.') ? 1 : 0,
        has_punycode: hostname.startsWith('xn--') ? 1 : 0,
        
        // ===== SUSPICIOUS PATTERNS (15) =====
        has_ip_address: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url) ? 1 : 0,
        has_hex_encoding: /%[0-9a-f]{2}/i.test(url) ? 1 : 0,
        has_unicode: /[^\x00-\x7F]/.test(url) ? 1 : 0,
        has_redirect_keywords: /redirect|redir|goto|out|away/i.test(url) ? 1 : 0,
        has_login_keywords: /login|signin|verify|account|secure|auth/i.test(url) ? 1 : 0,
        has_banking_keywords: /bank|pay|wallet|transaction|transfer/i.test(url) ? 1 : 0,
        has_social_keywords: /facebook|twitter|instagram|linkedin|google/i.test(url) ? 1 : 0,
        has_suspicious_keywords: this.hasSuspiciousKeywords(url) ? 1 : 0,
        brand_in_domain: this.containsBrandName(hostname) ? 1 : 0,
        typosquatting_score: this.detectTyposquatting(hostname),
        suspicious_file_extension: /\.(exe|scr|bat|cmd|vbs|js|jar|apk)$/i.test(pathname) ? 1 : 0,
        common_file_extension: /\.(html|htm|php|asp|jsp|pdf|doc|txt)$/i.test(pathname) ? 1 : 0,
        has_obfuscated_path: /\/[0-9a-f]{16,}\//i.test(url) ? 1 : 0,
        long_number_in_path: /\d{6,}/.test(pathname) ? 1 : 0,
        repeated_chars: this.hasRepeatedChars(hostname) ? 1 : 0,
        
        // ===== QUERY ANALYSIS (5) =====
        query_has_url: /https?%3A%2F%2F/i.test(search) ? 1 : 0,
        query_has_suspicious: /password|token|key|session|secret/i.test(search) ? 1 : 0,
        query_has_redirect: /redirect|url|goto|return/i.test(search) ? 1 : 0,
        query_has_email: /email|mail|user/i.test(search) ? 1 : 0,
        query_has_id: /id|uid|userid/i.test(search) ? 1 : 0,
        
        // ===== STATISTICAL FEATURES (5) =====
        char_freq_std: this.charFrequencyStd(url),
        digit_freq_std: this.digitFrequencyStd(url),
        special_freq_std: this.specialCharFrequencyStd(url),
        length_ratio: url.length / Math.max(1, hostname.length),
        domain_to_path_ratio: hostname.length / Math.max(1, pathname.length)
      };
    } catch (error) {
      console.error('Error extracting URL features:', error);
      return this.extractFeaturesFromString(url);
    }
  }

  extractFeaturesFromString(url) {
    // Fallback for invalid URLs
    return {
      url_length: url.length,
      digit_ratio: (url.match(/\d/g) || []).length / Math.max(1, url.length),
      special_char_ratio: (url.match(/[^a-zA-Z0-9]/g) || []).length / Math.max(1, url.length),
      entropy: this.calculateEntropy(url),
      has_at_symbol: url.includes('@') ? 1 : 0,
      has_ip_address: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url) ? 1 : 0,
      is_ip_format: /^(?:\d{1,3}\.){3}\d{1,3}$/.test(url) ? 1 : 0,
      has_suspicious_keywords: this.hasSuspiciousKeywords(url) ? 1 : 0,
      // Default values for other features
      domain_length: 0,
      path_length: 0,
      subdomain_count: 0,
      is_https: 0,
      tld_type: 0,
      is_common_tld: 0,
      is_suspicious_tld: 0,
      domain_entropy: 0,
      path_entropy: 0,
      avg_entropy: this.calculateEntropy(url),
      brand_in_domain: 0,
      typosquatting_score: 0
    };
  }

  // ===== HELPER FUNCTIONS =====
  
  calculateEntropy(str) {
    if (!str || str.length === 0) return 0;
    
    const freq = {};
    for (let char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    
    let entropy = 0;
    const len = str.length;
    for (let char in freq) {
      const p = freq[char] / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  calculateAvgEntropy(str) {
    if (str.length < 3) return this.calculateEntropy(str);
    
    let totalEntropy = 0;
    const windowSize = 3;
    
    for (let i = 0; i <= str.length - windowSize; i++) {
      const window = str.substring(i, i + windowSize);
      totalEntropy += this.calculateEntropy(window);
    }
    
    return totalEntropy / Math.max(1, str.length - windowSize + 1);
  }

  isCommonTLD(domain) {
    const commonTLDs = ['com', 'org', 'net', 'edu', 'gov', 'co', 'io', 'ai', 'in', 'uk', 'de', 'fr', 'jp'];
    const tld = domain.split('.').pop().toLowerCase();
    return commonTLDs.includes(tld) ? 1 : 0;
  }

  isSuspiciousTLD(domain) {
    const suspiciousTLDs = ['tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'work', 'click', 'link', 'bid', 'win', 'review', 'stream'];
    const tld = domain.split('.').pop().toLowerCase();
    return suspiciousTLDs.includes(tld) ? 1 : 0;
  }

  getTLDType(domain) {
    const tld = domain.split('.').pop().toLowerCase();
    
    if (['com', 'org', 'net'].includes(tld)) return 1; // Generic
    if (['edu', 'gov', 'mil'].includes(tld)) return 2; // Sponsored
    if (['uk', 'de', 'fr', 'jp', 'in'].includes(tld)) return 3; // Country code
    if (['io', 'ai', 'co', 'tv'].includes(tld)) return 4; // Modern/Tech
    if (['xyz', 'top', 'online', 'site'].includes(tld)) return 5; // New gTLD
    return 0; // Unknown
  }

  hasSuspiciousKeywords(url) {
    const keywords = [
      'verify', 'account', 'update', 'confirm', 'login', 'signin', 
      'banking', 'secure', 'ebayisapi', 'webscr', 'password', 
      'suspend', 'restricted', 'alert', 'notification', 'security',
      'authenticate', 'validation', 'click', 'update', 'billing'
    ];
    const lowerURL = url.toLowerCase();
    return keywords.some(kw => lowerURL.includes(kw)) ? 1 : 0;
  }

  containsBrandName(hostname) {
    const brands = [
      'paypal', 'amazon', 'google', 'microsoft', 'apple', 'facebook',
      'netflix', 'instagram', 'twitter', 'linkedin', 'ebay', 'bank',
      'wellsfargo', 'chase', 'citi', 'hsbc', 'appleid', 'microsoftonline'
    ];
    const lowerDomain = hostname.toLowerCase();
    return brands.some(brand => lowerDomain.includes(brand)) ? 1 : 0;
  }

  detectTyposquatting(domain) {
    const legitimateDomains = {
      'google': ['g00gle', 'gooogle', 'googl3', 'goog1e', 'goggle'],
      'paypal': ['paypai', 'paypa1', 'paypa11', 'paypai', 'papyal'],
      'amazon': ['amaz0n', 'amazom', 'arnazon', 'amzon'],
      'microsoft': ['micros0ft', 'rnicrosoft', 'micorsoft'],
      'facebook': ['faceb00k', 'facebok', 'facebo0k', 'facbook'],
      'apple': ['app1e', 'appie', 'aple'],
      'netflix': ['netf1ix', 'netflx', 'netfllx']
    };

    const lowerDomain = domain.toLowerCase();
    let score = 0;
    
    for (let [brand, typos] of Object.entries(legitimateDomains)) {
      if (lowerDomain.includes(brand)) {
        // Contains real brand name
        score += 1;
      }
      if (typos.some(typo => lowerDomain.includes(typo))) {
        // Contains typo version
        score += 2;
      }
    }
    
    return Math.min(score, 3) / 3; // Normalize to 0-1
  }

  maxConsecutiveConsonants(str) {
    const matches = str.match(/[bcdfghjklmnpqrstvwxyz]{2,}/gi) || [];
    return matches.length > 0 ? Math.max(...matches.map(m => m.length)) : 0;
  }

  maxConsecutiveDigits(str) {
    const matches = str.match(/\d{2,}/g) || [];
    return matches.length > 0 ? Math.max(...matches.map(m => m.length)) : 0;
  }

  hasRepeatedChars(str) {
    return /(.)\1{2,}/.test(str) ? 1 : 0; // Same character repeated 3+ times
  }

  charFrequencyStd(str) {
    if (str.length === 0) return 0;
    const freqs = {};
    for (let char of str) {
      freqs[char] = (freqs[char] || 0) + 1;
    }
    const values = Object.values(freqs);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  digitFrequencyStd(str) {
    const digits = str.match(/\d/g) || [];
    if (digits.length === 0) return 0;
    const freq = {};
    for (let digit of digits) {
      freq[digit] = (freq[digit] || 0) + 1;
    }
    const values = Object.values(freq);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  specialCharFrequencyStd(str) {
    const special = str.match(/[^a-zA-Z0-9]/g) || [];
    if (special.length === 0) return 0;
    const freq = {};
    for (let char of special) {
      freq[char] = (freq[char] || 0) + 1;
    }
    const values = Object.values(freq);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

module.exports = new URLFeatureExtractor();