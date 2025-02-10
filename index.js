require('dotenv').config();
require('module-alias/register');

const express = require('express');
const cors = require('cors');
const config = require('./config/index');
const { createMatrixClient } = require('./services/matrixClient');

const app = express();

// Apply middleware.
app.use(cors());
app.use(express.json());

// (Optional) Define your REST API endpoints here.
// e.g., app.get('/', (req, res) => res.send('Hello World!'));

async function startServer() {
  // Start the Express server.
  app.listen(config.port, () => {
    console.log(`Express server listening on port ${config.port}`);
  });

  try {
    // Create and start the Matrix client.
    const matrixClient = await createMatrixClient();
    await matrixClient.start();
    console.log("Matrix Bot started!");
  } catch (error) {
    console.error("Failed to start Matrix Bot:", error);
    process.exit(1);
  }
}

startServer();
