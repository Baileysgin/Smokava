// PM2 Ecosystem Configuration
// Usage: pm2 start ecosystem.config.js
//       pm2 save
//       pm2 startup

module.exports = {
  apps: [
    // ===========================================
    // Backend API
    // ===========================================
    {
      name: 'smokava-backend',
      script: './backend/server.js',
      cwd: '/opt/smokava',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_file: './backend/.env',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
    },

    // ===========================================
    // Frontend (Next.js) - Not needed if using standalone build
    // Next.js standalone mode includes its own server
    // This is only if you want PM2 to manage it
    // ===========================================
    // {
    //   name: 'smokava-frontend',
    //   script: './frontend/.next/standalone/server.js',
    //   cwd: '/opt/smokava',
    //   instances: 1,
    //   exec_mode: 'fork',
    //   env: {
    //     NODE_ENV: 'production',
    //     PORT: 3000,
    //   },
    //   env_file: './frontend/.env.production',
    //   error_file: './logs/frontend-error.log',
    //   out_file: './logs/frontend-out.log',
    //   log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    //   merge_logs: true,
    //   autorestart: true,
    //   max_restarts: 10,
    //   min_uptime: '10s',
    //   watch: false,
    // },
  ],
};


