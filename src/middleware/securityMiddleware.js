const helmet = require('helmet');
const cors = require('cors');

// CORS Configuration
const corsOptions = {
  origin: [
    'https://knockin-frontend-71vx.vercel.app',
    'https://knockin-admin-hw7x.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

// Security middleware
const securityMiddleware = (app) => {
  // Helmet - adds security headers
  app.use(helmet());

  // CORS
  app.use(cors(corsOptions));

  // Prevent parameter pollution
  app.use((req, res, next) => {
    if (Array.isArray(req.query) || Array.isArray(req.body)) {
      return res.status(400).json({
        message: 'Invalid request format',
      });
    }
    next();
  });

  // Request logging
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const path = req.path;
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user?.id || 'anonymous';

    console.log(`[${timestamp}] ${method} ${path} - IP: ${ip} - User: ${userId}`);
    next();
  });
};

module.exports = securityMiddleware;