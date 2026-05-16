const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');

/**
 * Prepare text for vector embedding
 */
function prepareEmbeddingText(customer, interactions) {
  const interactionSummaries = interactions.map((interaction) =>
    `${interaction.type.toUpperCase()}: ${(interaction.content || '').substring(0, 200)} (Sentiment: ${interaction.sentimentLabel || 'unknown'})`
  ).join('\n');

  return `
Customer: ${customer.name}
Company: ${customer.company || 'N/A'}
Status: ${customer.status}
Overall Sentiment: ${customer.overallSentiment}
Churn Score: ${customer.churnScore}

Recent Interactions:
${interactionSummaries}
  `.trim();
}

/**
 * Generate embedding using an external provider if one is configured.
 * Groq currently does not provide embeddings in this workspace, so this is a placeholder.
 */
async function generateEmbedding(text) {
  console.log('Embedding generation placeholder');
  return null;
}

async function buildVectorSearchDocument(customerId) {
  const customer = await Customer.findById(customerId);
  if (!customer) return null;

  const interactions = await Interaction.find({ customerId })
    .sort({ date: -1 })
    .limit(20)
    .populate('userId', 'name');

  const embeddingText = prepareEmbeddingText(customer, interactions);
  const embedding = await generateEmbedding(embeddingText);

  return {
    customerId: customer._id,
    embeddingText,
    embedding,
  };
}

module.exports = {
  prepareEmbeddingText,
  generateEmbedding,
  buildVectorSearchDocument,
};