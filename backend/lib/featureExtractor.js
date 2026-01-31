// backend/lib/featureExtractor.js
class FeatureExtractor {
  async extractFromFile(fileBuffer) {
    return {
      // Static features (example)
      file_size: fileBuffer.length,
      entropy: this.calculateEntropy(fileBuffer),
      has_pe_header: this.hasPEHeader(fileBuffer),
      suspicious_strings: this.findSuspiciousStrings(fileBuffer),
      // Add 50+ more features for ML
    };
  }
  
  calculateEntropy(buffer) {
    // Simple entropy calculation
    const len = buffer.length;
    const frequencies = new Array(256).fill(0);
    
    for (let i = 0; i < len; i++) {
      frequencies[buffer[i]]++;
    }
    
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
      const p = frequencies[i] / len;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  }
  
  hasPEHeader(buffer) {
    // Check for 'MZ' magic bytes
    return buffer.length > 2 && 
           buffer[0] === 0x4D && buffer[1] === 0x5A;
  }
  
  findSuspiciousStrings(buffer) {
    // Look for suspicious patterns
    const suspicious = [
      'CreateRemoteThread',
      'VirtualAlloc',
      'powershell',
      'cmd.exe',
      'eval('
    ];
    const str = buffer.toString('ascii', 0, Math.min(10000, buffer.length));
    return suspicious.filter(s => str.toLowerCase().includes(s.toLowerCase()));
  }
}

module.exports = new FeatureExtractor();