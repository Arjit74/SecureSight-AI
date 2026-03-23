const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SecureSight-AI Backend API',
      description: 'A comprehensive malware detection and URL security API with real-time monitoring, advanced analytics, and machine learning-powered threat detection.',
      version: '1.0.0',
      contact: {
        name: 'SecureSight-AI Team',
        email: 'support@securesight-ai.dev',
        url: 'https://github.com/securesight-ai/backend'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      },
      {
        url: 'https://api.securesight-ai.dev',
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            username: {
              type: 'string',
              example: 'john_doe'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'analyst'],
              example: 'user'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ScanResult: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com'
            },
            verdict: {
              type: 'string',
              enum: ['safe', 'suspicious', 'malicious'],
              example: 'safe'
            },
            score: {
              type: 'number',
              format: 'float',
              minimum: 0,
              maximum: 100,
              example: 85.5
            },
            threats: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['phishing', 'malware']
            },
            ml_verdict: {
              type: 'string',
              example: 'benign'
            },
            confidence: {
              type: 'number',
              format: 'float',
              example: 0.95
            },
            scanTimestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Report: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            user_id: {
              type: 'integer'
            },
            title: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            total_scans: {
              type: 'integer'
            },
            malicious_count: {
              type: 'integer'
            },
            suspicious_count: {
              type: 'integer'
            },
            safe_count: {
              type: 'integer'
            },
            average_score: {
              type: 'number',
              format: 'float'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            statusCode: {
              type: 'integer',
              example: 400
            },
            message: {
              type: 'string',
              example: 'Invalid request'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Scanning',
        description: 'URL and file scanning endpoints'
      },
      {
        name: 'Reporting',
        description: 'Report generation and analytics endpoints'
      },
      {
        name: 'Health',
        description: 'System health and monitoring endpoints'
      }
    ]
  },
  apis: [
    './routes/authRoutes.js',
    './routes/scanRoutes.js',
    './routes/reportRoutes.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
