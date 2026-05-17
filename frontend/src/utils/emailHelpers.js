export function getEmailBody(interaction) {
  if (interaction?.emailBody?.trim()) return interaction.emailBody.trim()
  const content = interaction?.content || ''
  const match = content.match(/^Subject:\s*.+?\n\n([\s\S]*)$/i)
  if (match) return match[1].trim()
  return content.replace(/^Subject:\s*.+?\n?/i, '').trim() || content
}

export function getEmailSubject(interaction) {
  if (interaction?.emailSubject) return interaction.emailSubject
  const m = (interaction?.content || '').match(/^Subject:\s*(.+?)(?:\n\n|\n)/i)
  return m ? m[1].trim() : '(no subject)'
}

export function getPreviewLine(interaction, max = 80) {
  const body = getEmailBody(interaction)
  const line = body.replace(/\s+/g, ' ').trim()
  return line.length > max ? `${line.slice(0, max)}…` : line
}
