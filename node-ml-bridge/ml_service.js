// node-ml-bridge/ml_service.js - ADD THIS
const { spawn } = require('child_process');

class MLService {
  async predict(features) {
    return new Promise((resolve, reject) => {
      const python = spawn('python', ['ml/inference/predict.py']);
      // Send features to Python
      python.stdin.write(JSON.stringify(features));
      python.stdin.end();
      
      // Get prediction back
      let result = '';
      python.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      python.on('close', () => {
        resolve(JSON.parse(result));
      });
    });
  }
}
module.exports = new MLService();