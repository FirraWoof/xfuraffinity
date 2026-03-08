export async function sendAlert(alertingUrl: string, message: string): Promise<void> {
  try {
    if (!alertingUrl) {
      console.log('No alerting URL set, muting alert:', message);
      return;
    }

    await fetch(alertingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: message,
    });
  } catch (err) {
    console.error('Failed to send alert:', err);
  }
}
