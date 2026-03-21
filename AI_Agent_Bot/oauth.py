
"""
Google OAuth2 Handler for SecureSight AI
Handles authentication flow with Google OAuth2 service
"""

import os
import json
import base64
from authlib.integrations.flask_client import OAuth
from flask import url_for


# Initialize OAuth
oauth = OAuth()


def init_oauth(app):
    """Initialize OAuth with Flask app"""
    oauth.init_app(app)
    
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        print("WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured")
        return None
    
    # Let Authlib handle redirect_uri automatically - don't specify it here
    google = oauth.register(
        name='google',
        client_id=client_id,
        client_secret=client_secret,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )
    
    return google


def parse_token(token):
    """Parse token to extract user information from Google OAuth response"""
    try:
        # Convert token to dict if needed
        if hasattr(token, 'items'):
            token_dict = dict(token)
        else:
            token_dict = token
        
        print(f"DEBUG: Token dict keys: {list(token_dict.keys())}")
        
        result = {}
        
        # Try to decode ID token first (most reliable)
        if 'id_token' in token_dict:
            id_token = token_dict['id_token']
            parts = id_token.split('.')
            if len(parts) >= 3:  # Valid JWT has 3 parts
                payload = parts[1]
                # Add padding if needed
                payload += '=' * (4 - len(payload) % 4)
                try:
                    decoded = json.loads(base64.urlsafe_b64decode(payload))
                    print(f"DEBUG: Decoded ID token: {decoded}")
                    result = {
                        'email': decoded.get('email'),
                        'name': decoded.get('name'),
                        'google_id': decoded.get('sub'),
                        'picture': decoded.get('picture'),
                    }
                    if result.get('email'):
                        print(f"DEBUG: Successfully extracted from ID token")
                        return result
                except Exception as e:
                    print(f"Error decoding id_token: {e}")
        
        # Fallback 1: Check if token dict has userinfo directly
        if 'email' in token_dict:
            result = {
                'email': token_dict.get('email'),
                'name': token_dict.get('name'),
                'google_id': token_dict.get('sub'),
                'picture': token_dict.get('picture'),
            }
            if result.get('email'):
                print(f"DEBUG: Successfully extracted from token dict")
                return result
        
        # Fallback 2: Try userinfo key (sometimes Google puts it there)
        if 'userinfo' in token_dict:
            userinfo = token_dict['userinfo']
            result = {
                'email': userinfo.get('email'),
                'name': userinfo.get('name'),
                'google_id': userinfo.get('sub'),
                'picture': userinfo.get('picture'),
            }
            if result.get('email'):
                print(f"DEBUG: Successfully extracted from userinfo key")
                return result
        
        # Log what we got for debugging
        print(f"DEBUG: Token type: {type(token_dict)}")
        print(f"DEBUG: Token keys: {list(token_dict.keys()) if hasattr(token_dict, 'keys') else 'N/A'}")
        print(f"DEBUG: Full token content (first 200 chars): {str(token_dict)[:200]}")
        
    except Exception as e:
        print(f"Error parsing token: {e}")
        import traceback
        traceback.print_exc()
    
    return {}


# Keep the handler class for backward compatibility
class GoogleOAuthHandler:
    """Manages Google OAuth2 authentication flow"""
    
    def __init__(self, app=None):
        self.google = None
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize OAuth with Flask app"""
        self.google = init_oauth(app)


# Global instance
oauth_handler = GoogleOAuthHandler()
