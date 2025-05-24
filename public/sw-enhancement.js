// Service Worker Enhancement for Scheduled Reminder Notifications
// This file is imported by your main service worker (sw.js) if needed.

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'schedule-reminder') {
    const reminder = event.data.reminder;
    scheduleReminderNotification(reminder);
  }
  if (event.data && event.data.type === 'cancel-all-reminders') {
    scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    scheduledTimeouts = [];
  }
});

// Schedule a notification for a reminder
let scheduledTimeouts = [];
function scheduleReminderNotification(reminder) {
  // Calculate the delay until the reminder time
  const now = Date.now();
  const reminderTime = new Date(reminder.date + (reminder.time ? `T${reminder.time}` : '')).getTime();
  const delay = reminderTime - now;
  if (delay <= 0) {
    // If the time is in the past or now, show immediately
    showReminderNotification(reminder);
    return;
  }
  // Use setTimeout for demo/dev (not persistent if SW is killed). For production, use Notification Triggers API if available.
  const timeoutId = setTimeout(() => {
    showReminderNotification(reminder);
  }, delay);
  scheduledTimeouts.push(timeoutId);
}

// Show the notification
function showReminderNotification(reminder) {
  self.registration.showNotification(reminder.title || 'FinFlow Reminder', {
    body: `It's time for: ${reminder.title}`,
    icon: '/favicon-96x96.png',
    tag: `reminder-${reminder.id}`,
    data: reminder,
    badge: '/favicon-96x96.png',
    vibrate: [200, 100, 200],
  });
}
