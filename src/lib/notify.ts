/** Отправка текста заявки менеджерам в Telegram. Без токена ничего не делает. */
export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  // Несколько получателей через запятую: TELEGRAM_CHAT_ID=111111,222222
  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  if (!token || chatIds.length === 0) return

  await Promise.all(
    chatIds.map(async (chatId) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text }),
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) console.error('[lead] telegram responded', chatId, res.status)
      } catch (err) {
        console.error('[lead] telegram failed', chatId, err)
      }
    }),
  )
}
