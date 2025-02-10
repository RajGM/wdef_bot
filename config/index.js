// Load environment variables from the .env file.
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  // Matrix server settings
  matrixServerUrl: process.env.MATRIX_SERVER_URL || 'https://matrix-client.matrix.org',
  matrixUsername: process.env.MATRIX_USERNAME || 'testbot6',
  matrixPassword: process.env.MATRIX_PASSWORD || 'Gaurav@ms2',
  // OpenAI settings
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o'
};
