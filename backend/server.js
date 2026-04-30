require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUI = require('swagger-ui-express');
const path = require('path');

const connectDB = require('./config/db');
const { globalRateLimit } = require('./middleware/apiKeyMiddleware');
const swaggerSpec = require('./swagger/config');

const app = express();

// Trust Vercel proxy
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

// Swagger
app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec, {
  customCss: `.swagger-ui .topbar { background: #0f0f0f; }`,
  customSiteTitle: 'AZPKEY API Docs',
}));

// Serve frontend dari /public di root project
// Di Vercel: root/public otomatis jadi static
// Di local: serve manual
const frontendPath = path.join(__dirname, '..', 'public');
app.use(express.static(frontendPath));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n  ✅ AZPKEY → http://localhost:${PORT}\n`);
  });
}

module.exports = app;
