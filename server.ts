import { createApp } from './server.mjs';

createApp({ dbPath: ':memory:', adminPassword: '', persistApplications: false })
  .listen(Number(process.env.PORT || 3000), '0.0.0.0');
