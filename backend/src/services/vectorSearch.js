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

module.exports = { prepareEmbeddingText };
