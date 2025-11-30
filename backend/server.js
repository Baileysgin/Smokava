require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const mongoose = require('mongoose');

const app = express();

// Middleware - CORS must be first
app.use(cors({
  origin: function (origin, callback) {
    // Development origins (only in development)
    // Use environment variables if provided, otherwise use localhost defaults
    const devOrigins = process.env.NODE_ENV === 'development'
      ? (process.env.DEV_ORIGINS
          ? process.env.DEV_ORIGINS.split(',').map(url => url.trim())
          : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'])
      : [];

    // Production origins from environment variables
    const prodOrigins = [];

    // Add individual frontend URLs if specified
    if (process.env.FRONTEND_URL) prodOrigins.push(process.env.FRONTEND_URL);
    if (process.env.ADMIN_PANEL_URL) prodOrigins.push(process.env.ADMIN_PANEL_URL);
    if (process.env.OPERATOR_PANEL_URL) prodOrigins.push(process.env.OPERATOR_PANEL_URL);

    // Add HTTPS versions
    if (process.env.FRONTEND_URL) {
      const httpsUrl = process.env.FRONTEND_URL.replace('http://', 'https://');
      if (httpsUrl !== process.env.FRONTEND_URL) prodOrigins.push(httpsUrl);
    }
    if (process.env.ADMIN_PANEL_URL) {
      const httpsUrl = process.env.ADMIN_PANEL_URL.replace('http://', 'https://');
      if (httpsUrl !== process.env.ADMIN_PANEL_URL) prodOrigins.push(httpsUrl);
    }

    // Add from ALLOWED_ORIGINS (comma-separated)
    if (process.env.ALLOWED_ORIGINS) {
      prodOrigins.push(...process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim()));
      // Also add HTTPS versions
      process.env.ALLOWED_ORIGINS.split(',').forEach(url => {
        const trimmed = url.trim();
        const httpsUrl = trimmed.replace('http://', 'https://');
        if (httpsUrl !== trimmed) prodOrigins.push(httpsUrl);
      });
    }

    const allowedOrigins = [...devOrigins, ...prodOrigins];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow all origins for easier testing
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, check against allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// Enable compression middleware (gzip)
app.use(compression({
  level: 6, // Compression level (1-9, 6 is good balance)
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter
    return compression.filter(req, res);
  }
}));

app.use(express.json({ limit: '50mb' })); // Increase limit for large images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Smokava API Server is running',
    endpoints: {
      auth: '/api/auth',
      packages: '/api/packages',
      restaurants: '/api/restaurants',
      feed: '/api/feed',
      users: '/api/users',
      admin: '/api/admin',
      operator: '/api/operator',
      rating: '/api/rating'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const fs = require('fs');
  const path = require('path');

  let lastBackup = null;
  const backupPath = process.env.BACKUP_PATH || '/var/backups/smokava';
  const lastBackupFile = path.join(backupPath, 'last_backup.txt');

  try {
    if (fs.existsSync(lastBackupFile)) {
      const timestamp = fs.readFileSync(lastBackupFile, 'utf8').trim();
      lastBackup = timestamp;
    }
  } catch (error) {
    // Ignore errors reading backup file
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    lastBackup: lastBackup
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/operator', require('./routes/operator'));
app.use('/api/rating', require('./routes/ratings'));

// Connect to MongoDB
// MONGODB_URI must be set in production
const mongoUri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production'
  ? null
  : 'mongodb://localhost:27017/smokava');

if (!mongoUri) {
  console.error('❌ MONGODB_URI environment variable is required in production');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('MongoDB connected');

    // Ensure admin user exists and is protected
    try {
      const { ensureAdmin } = require('./scripts/ensureAdminFunction');
      await ensureAdmin();
    } catch (err) {
      console.warn('⚠️  Could not ensure admin user:', err.message);
      // Continue server startup - admin can be created manually if needed
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
