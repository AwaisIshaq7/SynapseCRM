const Interaction = require('../models/Interaction');

/**
 * Prepares a structured string representation of a customer and their interactions.
 */
const prepareEmbeddingText = (customer, interactions = []) => {
  const customerText = [
    customer?.name,
    customer?.email,
    customer?.company,
    customer?.status,
    customer?.overallSentiment,
  ].filter(Boolean).join(' | ');

  const interactionText = interactions
    .map((interaction) => [
      interaction.type,
      interaction.sentimentLabel,
      interaction.content,
    ].filter(Boolean).join(' | '))
    .join('\n');

  return [customerText, interactionText].filter(Boolean).join('\n\n');
};

/**
 * Basic in-memory TF-IDF semantic search for RAG.
 * Tokenizes, computes TF-IDF representations of all interactions,
 * and performs Cosine Similarity against the user's query.
 */
const searchSimilar = async (queryText, limit = 15, customerIds = null) => {
  try {
    // 1. Fetch search corpus (interactions)
    const filter = {};
    if (customerIds) {
      filter.customerId = { $in: customerIds };
    }
    
    const corpus = await Interaction.find(filter)
      .populate('customerId', 'name company status churnScore overallSentiment')
      .populate('userId', 'name');

    if (corpus.length === 0) return [];

    // Helper: simple tokenizer & cleaner
    const tokenize = (text) => {
      if (!text) return [];
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2); // filter short stopwords/junk
    };

    const queryTokens = tokenize(queryText);
    if (queryTokens.length === 0) {
      // Fallback to recent if query is empty or untokenizable
      return corpus.slice(0, limit);
    }

    // 2. Compute Document Frequencies (DF) for IDF calculation
    const allDocTokens = corpus.map(doc => tokenize(doc.content));
    const termDF = {};
    
    allDocTokens.forEach(tokens => {
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach(token => {
        termDF[token] = (termDF[token] || 0) + 1;
      });
    });

    const docCount = corpus.length;
    const getIDF = (term) => {
      const df = termDF[term] || 0;
      if (df === 0) return 0;
      return Math.log(1 + docCount / df);
    };

    // Calculate query TF-IDF vector
    const queryVector = {};
    queryTokens.forEach(token => {
      queryVector[token] = (queryVector[token] || 0) + 1;
    });
    
    // Normalize query vector
    let queryLenSum = 0;
    Object.keys(queryVector).forEach(term => {
      const tfidf = queryVector[term] * getIDF(term);
      queryVector[term] = tfidf;
      queryLenSum += tfidf * tfidf;
    });
    const queryLength = Math.sqrt(queryLenSum);

    if (queryLength === 0) {
      return corpus.slice(0, limit);
    }

    // 3. Compute cosine similarities
    const scoredDocs = corpus.map((doc, idx) => {
      const docTokens = allDocTokens[idx];
      const docTF = {};
      docTokens.forEach(token => {
        docTF[token] = (docTF[token] || 0) + 1;
      });

      let dotProduct = 0;
      let docLenSum = 0;

      // Calculate doc TF-IDF lengths and cross dot products
      const uniqueDocTokens = new Set(docTokens);
      uniqueDocTokens.forEach(term => {
        const idf = getIDF(term);
        const tfidf = docTF[term] * idf;
        docLenSum += tfidf * tfidf;

        if (queryVector[term]) {
          dotProduct += queryVector[term] * tfidf;
        }
      });

      const docLength = Math.sqrt(docLenSum);
      const similarity = (queryLength * docLength) > 0 ? (dotProduct / (queryLength * docLength)) : 0;

      return {
        interaction: doc,
        similarity
      };
    });

    // 4. Sort and return top results
    scoredDocs.sort((a, b) => b.similarity - a.similarity);
    
    return scoredDocs
      .slice(0, limit)
      .map(item => ({
        ...item.interaction.toObject(),
        relevanceScore: item.similarity > 0 ? (1.0 + item.similarity) : 1.0 // adjust baseline
      }));

  } catch (error) {
    console.error('TF-IDF Vector Search Error:', error);
    return [];
  }
};

module.exports = { prepareEmbeddingText, searchSimilar };
