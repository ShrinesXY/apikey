require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUI = require('swagger-ui-express');

const connectDB = require('./config/db');
const { globalRateLimit } = require('./middleware/apiKeyMiddleware');
const swaggerSpec = require('./swagger/config');

const app = express();

app.set('trust proxy', 1);
connectDB();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize());
app.use(globalRateLimit);
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/keys', require('./routes/keys'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/data', require('./routes/data'));

app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec, {
  customSiteTitle: 'AZPKEY API Docs',
}));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`✅ API running → http://localhost:${PORT}/api`));
}

module.exports = app;
