const { MatrixClient, SimpleFsStorageProvider, AutojoinRoomsMixin, MatrixAuth } = require("matrix-bot-sdk");
const config = require('@config/index');
const { delegateTask } = require('@services/openai');

/**
 * Returns a command handler bound to the given Matrix client.
 * This ensures that when a message is received, the client instance is available.
 * 
 * @param {MatrixClient} client - The initialized Matrix client.
 * @returns {Function} - The event handler for room messages.
 */
function createCommandHandler(client) {
  return async (roomId, event) => {
    // Avoid handling messages sent by the bot itself.
    if (event.sender === `@${config.matrixUsername}:matrix.org`) return;
    if(roomId!=='!UqgtiggSVFfIpnorGI:matrix.org') return;

    // You might add additional checks (e.g., event type or redaction checks) here.
    console.log(`Message received in room ${roomId} from ${event.sender}`);

    try {
      // Generate an answer using the OpenAI service.
      const answer = await delegateTask([], event.content.body);
      
      // Send a reply in the room.
      //await client.replyNotice(roomId, event, answer);
    } catch (error) {
      console.error("Error handling command:", error);
    }
  };
}

/**
 * Creates and configures the Matrix client.
 * @returns {Promise<MatrixClient>}
 */
async function createMatrixClient() {
  const auth = new MatrixAuth(config.matrixServerUrl);
  // Log in using the provided credentials.
  const clientLogin = await auth.passwordLogin(config.matrixUsername, config.matrixPassword);
  const accessToken = clientLogin.accessToken;

  // Use a file-based storage provider to persist state.
  const storage = new SimpleFsStorageProvider("hello-bot.json");

  // Create the Matrix client instance.
  const client = new MatrixClient(config.matrixServerUrl, accessToken, storage);
  
  // Automatically join rooms when invited.
  AutojoinRoomsMixin.setupOnClient(client);

  // Register the command handler.
  client.on("room.message", createCommandHandler(client));

  return client;
}

module.exports = {
  createMatrixClient,
};
