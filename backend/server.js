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

// Connect DB
connectDB();

// Security
app.use(helmet({
  contentSecurityPolicy: false, // disabled to serve frontend
}));
app.use(mongoSanitize());
app.use(globalRateLimit);

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://azpkey.biz.id', 'https://www.azpkey.biz.id']
    : '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Logging
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
  customCss: `
    .swagger-ui .topbar { background: #0f0f0f; }
    .swagger-ui .topbar-wrapper img { content: url(''); }
    .swagger-ui .topbar-wrapper::before { content: 'AZPKEY'; color: #e5e5e5; font-size: 20px; font-weight: 700; }
  `,
  customSiteTitle: 'AZPKEY API Docs',
}));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Catch-all: serve index.html for SPA routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
  }
});

// 404 for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║          AZPKEY Server v1.0           ║
  ║          since 2025                   ║
  ╠═══════════════════════════════════════╣
  ║  Port    : ${PORT}                       ║
  ║  Mode    : ${process.env.NODE_ENV || 'development'}                 ║
  ║  Docs    : http://localhost:${PORT}/api/docs ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
