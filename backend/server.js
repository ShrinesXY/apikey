require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUI = require('swagger-ui-express');

const connectDB = require('./config/db');
const { globalRateLimit } = require('./middleware/apiKeyMiddleware');
const swaggerSpec = require('./swagger/config');

const app = express();

// Trust Vercel's proxy (required for rate limiting + IP detection)
app.set('trust proxy', 1);

// Connect DB
connectDB();

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize());
app.use(globalRateLimit);

// CORS
app.use(cors({ origin: '*', credentials: true }));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/keys', require('./routes/keys'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/data', require('./routes/data'));

// Swagger Docs
app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec, {
  customCss: `.swagger-ui .topbar { background: #0f0f0f; }`,
  customSiteTitle: 'AZPKEY API Docs',
}));

// 404 handler untuk API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Non-API routes — di Vercel di-handle oleh @vercel/static
// Di local dev, serve dari express.static
if (process.env.NODE_ENV !== 'production') {
  const path = require('path');
  const frontendPath = path.join(__dirname, '..', 'frontend', 'public');
  app.use(require('express').static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Local dev only — Vercel handles listen sendiri
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n  ✅ AZPKEY running → http://localhost:${PORT}\n  📖 Docs → http://localhost:${PORT}/api/docs\n`);
  });
}

module.exports = app;
