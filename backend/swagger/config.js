// Inline spec — tidak pakai swagger-jsdoc file scanning
// karena glob tidak bekerja di Vercel serverless environment

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AZPKEY API',
    version: '1.0.0',
    description: 'Professional API key management. Use Bearer token for dashboard endpoints, x-api-key header for protected API endpoints.',
  },
  servers: [
    { url: 'https://azpkey.biz.id', description: 'Production' },
    { url: 'http://localhost:5000', description: 'Local Dev' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication' },
    { name: 'API Keys', description: 'Key management (requires Bearer token)' },
    { name: 'Protected API', description: 'Demo endpoints (requires x-api-key)' },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', example: 'johndoe' },
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account created, returns JWT token' },
          409: { description: 'Email or username already taken' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and get JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful, returns JWT token' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'User profile' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/api/keys': {
      get: {
        tags: ['API Keys'],
        summary: 'List all your API keys',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Array of API keys' } },
      },
      post: {
        tags: ['API Keys'],
        summary: 'Generate a new API key',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'My Production Key' },
                  expiresInDays: { type: 'integer', example: 30 },
                  ipWhitelist: { type: 'string', example: '192.168.1.1, 10.0.0.1' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Key generated' }, 403: { description: 'Key limit reached for tier' } },
      },
    },
    '/api/keys/stats': {
      get: {
        tags: ['API Keys'],
        summary: 'Usage statistics and chart data',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Stats object with chart data' } },
      },
    },
    '/api/keys/logs': {
      get: {
        tags: ['API Keys'],
        summary: 'Request logs (paginated)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 25 } },
        ],
        responses: { 200: { description: 'Paginated logs array' } },
      },
    },
    '/api/keys/{id}/regenerate': {
      put: {
        tags: ['API Keys'],
        summary: 'Rotate (regenerate) an API key',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'New key value returned' } },
      },
    },
    '/api/keys/{id}/revoke': {
      put: {
        tags: ['API Keys'],
        summary: 'Revoke an API key',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Key revoked' } },
      },
    },
    '/api/keys/{id}': {
      delete: {
        tags: ['API Keys'],
        summary: 'Delete an API key',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Key deleted' } },
      },
    },
    '/api/data': {
      get: {
        tags: ['Protected API'],
        summary: 'Example protected endpoint',
        parameters: [{ in: 'header', name: 'x-api-key', required: true, schema: { type: 'string' }, description: 'Your AZPKEY API key (starts with azp_)' }],
        responses: {
          200: { description: 'Sample data with usage info' },
          401: { description: 'Missing or invalid API key' },
          403: { description: 'Key revoked, expired, or IP blocked' },
          429: { description: 'Rate limit or monthly limit exceeded' },
        },
      },
    },
    '/api/data/ping': {
      get: {
        tags: ['Protected API'],
        summary: 'Quick ping to verify API key',
        parameters: [{ in: 'header', name: 'x-api-key', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Pong — key is valid' } },
      },
    },
  },
};

module.exports = swaggerSpec;
