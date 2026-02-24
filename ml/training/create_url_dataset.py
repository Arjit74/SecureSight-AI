"""
SecureSight AI - URL Dataset Creator
Creates a comprehensive dataset of malicious and benign URLs for ML training.
Author: Arjit Sharma
"""

import pandas as pd
import numpy as np
import requests
import zipfile
import io
import re
import os
import time
from datetime import datetime, timedelta
from urllib.parse import urlparse
import warnings
warnings.filterwarnings('ignore')

class URLDatasetCreator:
    def __init__(self, output_dir='E:\gardian_link\SecureSight\datasets'):
        self.output_dir = output_dir
        self.malicious_urls = []
        self.benign_urls = []
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
    def fetch_phish_tank(self, limit=50000):
        """Fetch phishing URLs from PhishTank"""
        print("📥 Fetching from PhishTank...")
        try:
            # PhishTank data URL (you may need to register for an API key for large downloads)
            url = "https://data.phishtank.com/data/online-valid.csv"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                # Read CSV content
                content = response.content.decode('utf-8')
                lines = content.split('\n')
                
                # Parse CSV (simple parsing)
                urls = []
                for line in lines[1:]:  # Skip header
                    if line.strip() and len(urls) < limit:
                        parts = line.split(',')
                        if len(parts) > 1:
                            url = parts[1].strip('"')
                            if url and url.startswith('http'):
                                urls.append(url)
                
                print(f"  ✅ Got {len(urls)} URLs from PhishTank")
                return urls
            else:
                print(f"  ⚠️  PhishTank returned status {response.status_code}")
                return []
                
        except Exception as e:
            print(f"  ❌ Error fetching PhishTank: {e}")
            return []
    
    def fetch_urlhaus(self, limit=30000):
        """Fetch malware URLs from URLhaus"""
        print("📥 Fetching from URLhaus...")
        try:
            url = "https://urlhaus.abuse.ch/downloads/csv_recent/"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                content = response.content.decode('utf-8', errors='ignore')
                lines = content.split('\n')
                
                urls = []
                for line in lines:
                    if line.startswith('http') and len(urls) < limit:
                        # URLhaus CSV format: first column is often the URL
                        parts = line.split(',')
                        if parts:
                            url = parts[0].strip('"')
                            if self.validate_url(url):
                                urls.append(url)
                
                print(f"  ✅ Got {len(urls)} URLs from URLhaus")
                return urls
                
        except Exception as e:
            print(f"  ❌ Error fetching URLhaus: {e}")
            return []
    
    def fetch_openphish(self, limit=20000):
        """Fetch phishing URLs from OpenPhish"""
        print("📥 Fetching from OpenPhish...")
        try:
            url = "https://openphish.com/feed.txt"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                urls = []
                for line in response.text.split('\n'):
                    line = line.strip()
                    if line.startswith('http') and len(urls) < limit:
                        urls.append(line)
                
                print(f"  ✅ Got {len(urls)} URLs from OpenPhish")
                return urls
                
        except Exception as e:
            print(f"  ❌ Error fetching OpenPhish: {e}")
            return []
    
    def fetch_malware_traffic_analysis(self, limit=10000):
        """Fetch from Malware Traffic Analysis (additional source)"""
        print("📥 Fetching from Malware Traffic Analysis...")
        try:
            # This site posts daily malware URLs - we'll simulate with some known patterns
            # In production, you'd parse their actual feed
            base_urls = [
                "http://malware-traffic-analysis.net/2024/",
                "http://malware-traffic-analysis.net/2023/",
            ]
            
            urls = []
            # These are example patterns - real implementation would parse their blog
            for i in range(min(100, limit)):
                urls.append(f"http://malware-traffic-analysis.net/sample-{i}.exe")
                urls.append(f"https://malicious-domain-{i}.xyz/payload.bin")
            
            print(f"  ✅ Added {len(urls)} simulated malware URLs")
            return urls[:limit]
            
        except Exception as e:
            print(f"  ⚠️  Could not fetch MTA: {e}")
            return []
    
    def fetch_malware_domains(self, limit=20000):
        """Fetch from MalwareDomains.com"""
        print("📥 Fetching from MalwareDomains...")
        try:
            # Alternative malware URL source
            urls = []
            # Generate sample malicious URLs
            for i in range(min(1000, limit)):
                urls.append(f"http://malware-{i}.xyz/payload.exe")
                urls.append(f"https://phish-{i}.tk/login.html")
            print(f"  ✅ Added {len(urls)} simulated malware URLs")
            return urls
        except Exception as e:
            print(f"  ⚠️  Error: {e}")
            return []
    
    def load_benign_urls(self, sources=None, limit=100000):
        """
        Load benign URLs from trusted sources.
        Note: You'll need to manually download and place these files in the data directory.
        """
        print("📥 Loading benign URLs...")
        benign_urls = []
        
        # Source 1: Use manually downloaded Alexa/Tranco list
        alexa_path = os.path.join(self.output_dir, 'top-1m.csv')
        if os.path.exists(alexa_path):
            try:
                df = pd.read_csv(alexa_path, header=None, names=['rank', 'domain'])
                for domain in df['domain'].head(limit//2):
                    benign_urls.append(f'https://{domain}')
                    benign_urls.append(f'https://www.{domain}')
                    # Add some common paths
                    benign_urls.append(f'https://{domain}/about')
                    benign_urls.append(f'https://{domain}/contact')
                print(f"  ✅ Added {len(benign_urls)} from Alexa list")
            except Exception as e:
                print(f"  ⚠️  Error reading Alexa list: {e}")
        
        # Source 2: Curated list of trusted domains
        trusted_domains = [
            'google.com', 'github.com', 'wikipedia.org', 'mozilla.org',
            'microsoft.com', 'apple.com', 'linuxfoundation.org', 'python.org',
            'stackoverflow.com', 'w3.org', 'ietf.org', 'arxiv.org',
            'washingtonpost.com', 'nytimes.com', 'bbc.com', 'reuters.com',
            'youtube.com', 'vimeo.com', 'ted.com', 'khanacademy.org',
            'github.io', 'gitlab.com', 'bitbucket.org', 'npmjs.com',
            'docker.com', 'kubernetes.io', 'cloudflare.com', 'akamai.com'
        ]
        
        for domain in trusted_domains:
            benign_urls.append(f'https://{domain}')
            benign_urls.append(f'https://www.{domain}')
        
        # Source 3: Generate variations of trusted domains
        variations = ['about', 'contact', 'privacy', 'terms', 'help', 'support',
                     'blog', 'news', 'articles', 'docs', 'api', 'download']
        
        for domain in trusted_domains[:50]:  # First 50 domains
            for variation in variations[:5]:  # First 5 variations
                benign_urls.append(f'https://{domain}/{variation}')
                benign_urls.append(f'https://www.{domain}/{variation}')
        
        # Limit and deduplicate
        benign_urls = list(set(benign_urls))[:limit]
        print(f"  ✅ Total benign URLs: {len(benign_urls)}")
        
        return benign_urls
    
    def validate_url(self, url):
        """Basic URL validation"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False
    
    def clean_url(self, url):
        """Clean and normalize URL"""
        url = url.strip()
        url = re.sub(r'\s+', '', url)  # Remove whitespace
        
        # Remove common tracking parameters
        tracking_params = ['utm_', 'fbclid', 'gclid', 'msclkid']
        for param in tracking_params:
            url = re.sub(f'[?&]{param}[^&]*', '', url)
        
        # Ensure proper format
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        return url
    
    def augment_dataset(self, urls, label, augmentation_factor=2):
        """Augment dataset with variations (for training robustness)"""
        if label == 'malicious':
            # For malicious URLs, add common variations
            augmented = []
            for url in urls:
                augmented.append(url)
                
                # Add HTTP version if HTTPS
                if url.startswith('https://'):
                    augmented.append(url.replace('https://', 'http://'))
                
                # Add with common malicious paths
                malicious_paths = ['/login', '/verify', '/account', '/secure', '/admin']
                for path in malicious_paths[:2]:  # Add 2 variations
                    parsed = urlparse(url)
                    augmented.append(f"{parsed.scheme}://{parsed.netloc}{path}")
            
            return list(set(augmented))[:len(urls) * augmentation_factor]
        
        else:  # benign
            # For benign URLs, add common subdomains and paths
            augmented = []
            for url in urls:
                augmented.append(url)
                
                parsed = urlparse(url)
                domain = parsed.netloc
                
                # Add common subdomains
                if not domain.startswith('www.'):
                    augmented.append(f"{parsed.scheme}://www.{domain}")
                
                # Add common paths
                common_paths = ['/index.html', '/home', '/main', '/default']
                for path in common_paths[:2]:
                    augmented.append(f"{parsed.scheme}://{domain}{path}")
            
            return list(set(augmented))[:len(urls) * augmentation_factor]
    
    def extract_basic_features(self, url):
        """Extract basic features for dataset analysis"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc
            
            return {
                'url_length': len(url),
                'domain_length': len(domain),
                'has_https': 1 if parsed.scheme == 'https' else 0,
                'has_ip': 1 if re.match(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', domain) else 0,
                'subdomain_count': domain.count('.'),
                'digit_count': sum(c.isdigit() for c in url),
                'special_char_count': sum(not c.isalnum() for c in url),
                'is_phishing_keyword': 1 if any(kw in url.lower() for kw in 
                    ['login', 'verify', 'account', 'secure', 'update']) else 0
            }
        except:
            return {}
    
    def create_dataset(self, malicious_limit=100000, benign_limit=100000):
        """Main method to create the complete dataset"""
        print("=" * 60)
        print("🔨 CREATING SECURESIGHT AI URL DATASET")
        print("=" * 60)
        
        # Step 1: Collect malicious URLs
        print("\n📊 COLLECTING MALICIOUS URLS")
        print("-" * 40)
        
        phish_tank_urls = self.fetch_phish_tank(limit=malicious_limit//3)
        urlhaus_urls = self.fetch_urlhaus(limit=malicious_limit//3)
        openphish_urls = self.fetch_openphish(limit=malicious_limit//4)
        mta_urls = self.fetch_malware_traffic_analysis(limit=malicious_limit//6)
        malware_domains_urls = self.fetch_malware_domains(limit=malicious_limit//6)
        
        # Combine all malicious sources
        all_malicious = phish_tank_urls + urlhaus_urls + openphish_urls + mta_urls + malware_domains_urls
        
        # Clean and deduplicate
        all_malicious = [self.clean_url(url) for url in all_malicious if self.validate_url(url)]
        all_malicious = list(set(all_malicious))
        
        print(f"\n📈 Malicious URLs collected: {len(all_malicious)}")
        print(f"   - PhishTank: {len(phish_tank_urls)}")
        print(f"   - URLhaus: {len(urlhaus_urls)}")
        print(f"   - OpenPhish: {len(openphish_urls)}")
        print(f"   - MTA: {len(mta_urls)}")
        print(f"   - MalwareDomains: {len(malware_domains_urls)}")
        
        # Step 2: Collect benign URLs
        print("\n📊 COLLECTING BENIGN URLS")
        print("-" * 40)
        
        all_benign = self.load_benign_urls(limit=benign_limit)
        all_benign = [self.clean_url(url) for url in all_benign if self.validate_url(url)]
        all_benign = list(set(all_benign))
        
        print(f"\n📈 Benign URLs collected: {len(all_benign)}")
        
        # Step 3: Augment datasets (optional, for better training)
        print("\n🔄 AUGMENTING DATASETS")
        print("-" * 40)
        
        augmented_malicious = self.augment_dataset(all_malicious, 'malicious', augmentation_factor=2)
        augmented_benign = self.augment_dataset(all_benign, 'benign', augmentation_factor=2)
        
        print(f"   Malicious URLs after augmentation: {len(augmented_malicious)}")
        print(f"   Benign URLs after augmentation: {len(augmented_benign)}")
        
        # Step 4: Balance datasets
        print("\n⚖️ BALANCING DATASETS")
        print("-" * 40)
        
        min_samples = min(len(augmented_malicious), len(augmented_benign))
        balanced_malicious = augmented_malicious[:min_samples]
        balanced_benign = augmented_benign[:min_samples]
        
        print(f"   Balanced to {min_samples} samples each")
        print(f"   Total dataset size: {min_samples * 2} URLs")
        
        # Step 5: Create final DataFrame
        print("\n💾 CREATING FINAL DATASET")
        print("-" * 40)
        
        # Prepare data
        urls = balanced_malicious + balanced_benign
        labels = [1] * len(balanced_malicious) + [0] * len(balanced_benign)
        sources = ['malicious'] * len(balanced_malicious) + ['benign'] * len(balanced_benign)
        
        # Create DataFrame
        df = pd.DataFrame({
            'url': urls,
            'label': labels,
            'source': sources,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
        
        # Shuffle the dataset
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)
        
        # Step 6: Save datasets
        print("\n💿 SAVING DATASETS")
        print("-" * 40)
        
        # Save main dataset
        dataset_path = os.path.join(self.output_dir, 'url_dataset.csv')
        df.to_csv(dataset_path, index=False)
        print(f"✅ Main dataset saved to: {dataset_path}")
        print(f"   Rows: {len(df)}, Columns: {len(df.columns)}")
        
        # Save separate files for malicious/benign
        malicious_df = df[df['label'] == 1]
        benign_df = df[df['label'] == 0]
        
        malicious_df.to_csv(os.path.join(self.output_dir, 'malicious_urls.csv'), index=False)
        benign_df.to_csv(os.path.join(self.output_dir, 'benign_urls.csv'), index=False)
        
        print(f"✅ Malicious URLs saved: {len(malicious_df)} rows")
        print(f"✅ Benign URLs saved: {len(benign_df)} rows")
        
        # Step 7: Dataset statistics
        print("\n📊 DATASET STATISTICS")
        print("-" * 40)
        
        print(f"   Total URLs: {len(df)}")
        print(f"   Malicious URLs: {len(malicious_df)} ({len(malicious_df)/len(df)*100:.1f}%)")
        print(f"   Benign URLs: {len(benign_df)} ({len(benign_df)/len(df)*100:.1f}%)")
        
        # Extract sample features for analysis
        sample_features = []
        for url in df['url'].head(100):
            sample_features.append(self.extract_basic_features(url))
        
        if sample_features:
            feature_df = pd.DataFrame(sample_features)
            print(f"\n📈 Sample URL Features Analysis:")
            print(f"   Average URL length: {feature_df['url_length'].mean():.1f}")
            print(f"   HTTPS URLs: {(feature_df['has_https'].mean() * 100):.1f}%")
            print(f"   IP-based URLs: {(feature_df['has_ip'].mean() * 100):.1f}%")
            print(f"   URLs with phishing keywords: {(feature_df['is_phishing_keyword'].mean() * 100):.1f}%")
        
        # Save dataset info
        info = {
            'created_at': datetime.now().isoformat(),
            'total_samples': len(df),
            'malicious_samples': len(malicious_df),
            'benign_samples': len(benign_df),
            'sources': list(df['source'].unique()),
            'dataset_path': dataset_path
        }
        
        import json
        with open(os.path.join(self.output_dir, 'dataset_info.json'), 'w') as f:
            json.dump(info, f, indent=2)
        
        print(f"\n✅ Dataset info saved to: {os.path.join(self.output_dir, 'dataset_info.json')}")
        
        return df
    
    def create_synthetic_dataset(self, num_samples=10000):
        """Create synthetic dataset if live sources fail"""
        print("🔧 Creating synthetic dataset for testing...")
        
        synthetic_malicious = []
        synthetic_benign = []
        
        # Generate malicious patterns
        malicious_patterns = [
            "http://paypal-verify-{}.com/login",
            "https://google-security-{}.tk/account",
            "http://{}.{}.{}.{}/admin.php",
            "https://amazon-update-{}.ga/billing",
            "http://facebook-confirm-{}.cf/secure"
        ]
        
        # Generate benign patterns
        benign_patterns = [
            "https://company-{}.com/about",
            "https://blog-{}.com/articles",
            "https://service-{}.net/contact",
            "https://project-{}.org/docs",
            "https://api-{}.io/v1"
        ]
        
        for i in range(num_samples // 2):
            for pattern in malicious_patterns:
                if len(synthetic_malicious) < num_samples // 2:
                    # Insert random numbers
                    import random
                    rand_num = random.randint(1000, 9999)
                    ip_parts = [str(random.randint(1, 255)) for _ in range(4)]
                    ip = '.'.join(ip_parts)
                    
                    url = pattern.format(rand_num).replace('{}', str(rand_num))
                    url = url.replace('{}.{}.{}.{}', ip)
                    synthetic_malicious.append(url)
        
        for i in range(num_samples // 2):
            for pattern in benign_patterns:
                if len(synthetic_benign) < num_samples // 2:
                    rand_num = random.randint(1, 1000)
                    url = pattern.format(rand_num)
                    synthetic_benign.append(url)
        
        # Create DataFrame
        df = pd.DataFrame({
            'url': synthetic_malicious + synthetic_benign,
            'label': [1] * len(synthetic_malicious) + [0] * len(synthetic_benign),
            'source': ['synthetic_malicious'] * len(synthetic_malicious) + 
                     ['synthetic_benign'] * len(synthetic_benign)
        })
        
        # Save
        output_path = os.path.join(self.output_dir, 'synthetic_dataset.csv')
        df.to_csv(output_path, index=False)
        
        print(f"✅ Synthetic dataset created: {output_path}")
        print(f"   Samples: {len(df)} ({len(synthetic_malicious)} malicious, {len(synthetic_benign)} benign)")
        
        return df

def main():
    """Main execution function"""
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║             SECURESIGHT AI - DATASET CREATOR             ║
    ║                  Advanced URL Collection                 ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    # Initialize creator
    creator = URLDatasetCreator(output_dir='ml_training/data')
    
    try:
        # Try to create real dataset
        dataset = creator.create_dataset(
            malicious_limit=50000,  # Adjust based on your needs
            benign_limit=50000
        )
        
        print("\n" + "=" * 60)
        print("🎉 DATASET CREATION COMPLETE!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Train the model: python train_url_model.py")
        print("2. Check dataset quality in ml_training/data/")
        print("3. For better results, manually add more trusted domains")
        
    except Exception as e:
        print(f"\n⚠️  Error creating real dataset: {e}")
        print("Creating synthetic dataset for testing...")
        
        # Fallback to synthetic data
        dataset = creator.create_synthetic_dataset(num_samples=10000)
        
        print("\n⚠️  NOTE: Using synthetic data for testing.")
        print("   For production, manually add real malicious/benign URLs.")
        print("   Place CSV files in ml_training/data/")

if __name__ == "__main__":
    main()