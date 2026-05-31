export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    path: process.env.DATABASE_PATH ?? './data/db.sqlite',
  },
  frontend: {
    url: process.env.FRONTEND_URL ?? 'http://localhost:3001',
  },
});
