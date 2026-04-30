const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AZPKEY API',
      version: '1.0.0',
      description: `
## AZPKEY — API Key Management System

Professional API key management for developers. Generate, manage, and monitor your API keys.

### Authentication
Most endpoints require a **Bearer JWT token** obtained from the login endpoint.
Protected API endpoints require an **x-api-key** header with your API key.

### Rate Limits
- **Free**: 1,000 req/month, 10 req/second
- **Pro**: 50,000 req/month, 60 req/second  
- **Premium**: 500,000 req/month, 300 req/second
      `,
      contact: {
        name: 'AZPKEY Support',
        url: 'https://azpkey.biz.id',
        email: 'support@azpkey.biz.id',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'https://azpkey.biz.id',
        description: 'Production',
      },
      {
        url: 'http://localhost:5000',
        description: 'Local Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'API Keys', description: 'Manage your API keys' },
      { name: 'Protected API', description: 'Example protected endpoints' },
    ],
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsDoc(options);
