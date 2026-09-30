// Share a link: the phone's own share sheet (WhatsApp, Telegram, …) when there is
// one, otherwise copy the link.
export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function shareLink(title: string, url: string): Promise<ShareResult> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: title, url })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
