/** Отправка текста заявки менеджеру в Telegram. Без токена ничего не делает. */
export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) console.error('[lead] telegram responded', res.status)
  } catch (err) {
    console.error('[lead] telegram failed', err)
  }
}
