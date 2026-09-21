require('dotenv').config();

const app = require('./app');
const { checkDatabaseConnection } = require('./db');

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await checkDatabaseConnection();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start backend:', error);
    process.exit(1);
  }
}

startServer();
