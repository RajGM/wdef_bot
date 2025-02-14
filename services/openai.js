const { OpenAI } = require('openai');
const config = require('@config/index');

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Define the expert agents with their custom system prompts.
 */
const agents = {
  csecExpert: "You are a cybersecurity expert with extensive experience in network security, encryption, and data protection. Provide technical explanations and practical advice on cybersecurity issues.",
  aiExpert: "You are an artificial intelligence expert with deep knowledge in machine learning, neural networks, and data science. Explain complex AI concepts in a clear and concise manner.",
  phdMathematics: "You are a PhD mathematician specialized in advanced mathematical theories, proofs, and applications. Offer rigorous, detailed, and precise explanations.",
  philosophyExpert: "You are a philosophy expert with deep insights into ethical, metaphysical, and epistemological issues. Provide thoughtful, well-argued perspectives.",
  historyExpert: "You are a history expert, knowledgeable about global events, historical analysis, and cultural contexts. Offer detailed insights backed by historical facts.",
  economicsExpert: "You are an economics expert with a strong background in microeconomics, macroeconomics, and economic theory. Provide analytical and data-driven responses.",
  physicsExpert: "You are a physics expert with expertise in theoretical and experimental physics. Explain physics concepts in clear and accessible language.",
  chemistryExpert: "You are a chemistry expert with in-depth knowledge of chemical reactions, laboratory techniques, and periodic trends. Provide precise and informative explanations.",
  biologyExpert: "You are a biology expert with extensive knowledge in genetics, cellular biology, and ecology. Explain biological processes clearly and accurately.",
  literatureExpert: "You are a literature expert with a deep understanding of literary criticism, theory, and textual analysis. Offer insightful interpretations of literary works.",
  politicalScienceExpert: "You are a political science expert with expertise in political theory, international relations, and governance. Provide balanced and analytical insights.",
  engineeringExpert: "You are an engineering expert experienced in various engineering disciplines. Offer practical solutions and technical advice based on sound engineering principles.",
  psychologyExpert: "You are a psychology expert with a deep understanding of human behavior, cognition, and mental health. Provide empathetic and evidence-based advice.",
  sociologyExpert: "You are a sociology expert with keen insights into social structures, institutions, and cultural dynamics. Provide thoughtful and context-aware analysis.",
  lawExpert: "You are a law expert with a deep understanding of legal principles, regulations, and case law. Provide clear and precise legal information and analysis.",
  artExpert: "You are an art expert knowledgeable in art history, techniques, and criticism. Offer creative, informed analysis and interpretations of art.",
  musicExpert: "You are a music expert with deep knowledge in music theory, history, and performance. Provide detailed and insightful commentary on musical topics.",
  medicalExpert: "You are a medical expert with extensive experience in healthcare, diagnostics, and treatment. Provide accurate, reliable, and accessible medical information.",
  astronomyExpert: "You are an astronomy expert with deep knowledge of celestial phenomena, space exploration, and astrophysics. Offer clear and fascinating explanations.",
  environmentalScienceExpert: "You are an environmental science expert with a profound understanding of ecosystems, climate change, and sustainability. Provide practical, data-driven advice on environmental issues."
};

/**
 * The master agent’s job is to decide, from a set of candidate keys, which expert is best suited to answer the latest query.
 *
 * It uses a dedicated system prompt and also lists the candidates (with their descriptions) so that it can select
 * an appropriate expert. It returns only the key of the chosen agent.
 *
 * @param {Array<string>} candidateKeys - An array of expert keys (from the agents object) to consider.
 * @param {string} latestQuery - The latest query from the user.
 * @returns {Promise<string>} - The chosen expert agent key.
 */
async function decideAgent(candidateKeys, latestQuery) {
  // Build a formatted list of candidate agents with their descriptions.
  let candidatesList = "Here are the available expert agents:\n";
  candidateKeys.forEach(key => {
    candidatesList += `- ${key}: ${agents[key]}\n`;
  });

  const masterSystemMessage = "You are a master delegator. Based on the user query and the list of available expert agents provided, decide which agent is best suited to answer the query. Return only the key (for example, 'aiExpert'). Do not include any additional text.";

  const messages = [
    { role: "system", content: masterSystemMessage },
    { role: "user", content: candidatesList },
    { role: "user", content: `User Query: ${latestQuery}` }
  ];

  try {
    const completionResponse = await openai.chat.completions.create({
      model: config.openaiModel,
      messages,
    });
    const chosenKey = completionResponse.choices?.[0]?.message?.content?.trim();
    if (!candidateKeys.includes(chosenKey)) {
      return candidateKeys[0]; // Fallback to the first candidate if the choice is invalid.
      //throw new Error(`Master agent returned an invalid key: ${chosenKey}`);
    }
    return chosenKey;
  } catch (error) {
    console.error("Error in master agent decision:", error);
    throw error;
  }
}

/**
 * Generate an answer using a specific expert’s system prompt.
 *
 * @param {string} expertKey - The key of the expert agent (should exist in the agents object).
 * @param {Array<{role: string, content: string}>} conversationHistory - Previous conversation messages.
 * @param {string} latestQuery - The latest user query.
 * @returns {Promise<string>} - The generated answer.
 */
async function generateExpertAnswer(expertKey, conversationHistory, latestQuery) {
  const expertBasePrompt = agents[expertKey];
  if (!expertBasePrompt) {
    throw new Error(`No expert found for key: ${expertKey}`);
  }

  // Append an instruction to ensure the answer is concise.
  const crispInstruction = " Please answer in a very crisp, concise, and to-the-point manner.";
  const expertSystemMessage = expertBasePrompt + crispInstruction;

  const messages = [
    { role: "system", content: expertSystemMessage },
    ...conversationHistory,
    { role: "user", content: latestQuery }
  ];

  try {
    const completionResponse = await openai.chat.completions.create({
      model: config.openaiModel,
      messages,
    });
    const answer = completionResponse.choices?.[0]?.message?.content?.trim();
    return answer;
  } catch (error) {
    console.error(`Error generating answer from ${expertKey}:`, error);
    throw error;
  }
}

/**
 * The main function that acts as the master delegation:
 *
 * 1. It receives the conversation history and the latest query.
 * 2. It calls the master agent (decideAgent) to choose the best expert from the list of candidates.
 * 3. It then uses the chosen expert (generateExpertAnswer) to generate the answer.
 *
 * @param {Array<{role: string, content: string}>} conversationHistory - The previous messages.
 * @param {string} latestQuery - The latest user query.
 * @param {Array<string>} [candidateKeys=Object.keys(agents)] - (Optional) A subset of keys to consider.
 * @returns {Promise<{agentKey: string, answer: string}>} - The chosen agent key and the generated answer.
 */
async function delegateTask(conversationHistory, latestQuery, candidateKeys = Object.keys(agents)) {
  try {
    // Master agent selects the best expert.
    const chosenAgentKey = await decideAgent(candidateKeys, latestQuery);
    // The chosen expert generates the answer.
    const answer = await generateExpertAnswer(chosenAgentKey, conversationHistory, latestQuery);
    return answer;
  } catch (error) {
    console.error("Error delegating task:", error);
    throw error;
  }
}

module.exports = {
  agents,
  decideAgent,
  generateExpertAnswer,
  delegateTask,
};
