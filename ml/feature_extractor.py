"""
URL Feature Extractor for SecureSight AI
Extracts features from URLs for machine learning models
"""

import re
from urllib.parse import urlparse
import numpy as np

class URLFeatureExtractor:
    """Extract features from URLs for ML models"""
    
    def __init__(self):
        pass
    
    def extractFeatures(self, url):
        """
        Extract comprehensive features from a URL
        Returns a dictionary of feature names to values
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc
            path = parsed.path
            
            features = {
                # Length features
                'url_length': len(url),
                'domain_length': len(domain),
                'path_length': len(path),
                'query_length': len(parsed.query),
                
                # Protocol features
                'has_https': 1 if parsed.scheme == 'https' else 0,
                'has_http': 1 if parsed.scheme == 'http' else 0,
                
                # Domain features
                'domain_dots': domain.count('.'),
                'domain_hyphens': domain.count('-'),
                'is_ip_address': self._is_ip(domain),
                
                # Path features
                'path_dots': path.count('.'),
                'path_slashes': path.count('/'),
                
                # Character distribution
                'uppercase_count': sum(1 for c in url if c.isupper()),
                'digit_count': sum(1 for c in url if c.isdigit()),
                'special_char_count': sum(1 for c in url if not c.isalnum() and c not in './-:?=&'),
                
                # Keyword detection
                'has_login': 1 if any(kw in url.lower() for kw in ['login', 'signin', 'auth']) else 0,
                'has_verify': 1 if 'verify' in url.lower() else 0,
                'has_account': 1 if 'account' in url.lower() else 0,
                'has_secure': 1 if 'secure' in url.lower() else 0,
                'has_update': 1 if 'update' in url.lower() else 0,
                'has_confirm': 1 if 'confirm' in url.lower() else 0,
                
                # Suspicious patterns
                'has_double_slash': 1 if '//' in url[len(parsed.scheme)+1:] else 0,
                'has_redirect': 1 if 'redirect' in url.lower() else 0,
                'has_obfuscation': 1 if any(x in url for x in ['%2F', '%3A', '%3D']) else 0,
                
                # URL structure
                'subdomain_count': (domain.count('.') - 1) if domain.count('.') > 0 else 0,
                'has_port': 1 if ':' in domain else 0,
            }
            
            return features
        except:
            # Return default features if parsing fails
            return {
                'url_length': len(url),
                'domain_length': 0,
                'path_length': 0,
                'query_length': 0,
                'has_https': 0,
                'has_http': 0,
                'domain_dots': 0,
                'domain_hyphens': 0,
                'is_ip_address': 0,
                'path_dots': 0,
                'path_slashes': 0,
                'uppercase_count': 0,
                'digit_count': 0,
                'special_char_count': 0,
                'has_login': 0,
                'has_verify': 0,
                'has_account': 0,
                'has_secure': 0,
                'has_update': 0,
                'has_confirm': 0,
                'has_double_slash': 0,
                'has_redirect': 0,
                'has_obfuscation': 0,
                'subdomain_count': 0,
                'has_port': 0,
            }
    
    def _is_ip(self, domain):
        """Check if domain is an IP address"""
        ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        return 1 if re.match(ip_pattern, domain) else 0
