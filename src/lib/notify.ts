/**
 * Shows a system notification if the user allowed them. Uses the service worker when there is one,
 * because Android only shows notifications that way.
 */
export function showSystemNotification(title: string, body: string, tag?: string) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const options: NotificationOptions = { body, icon: `${import.meta.env.BASE_URL}app-icon-192.png`, tag };
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      void navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, options)).catch(() => undefined);
    } else {
      new Notification(title, options);
    }
  } catch {
    // notifications are optional
  }
}
