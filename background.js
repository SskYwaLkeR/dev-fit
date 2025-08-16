const defaultPrompts = [
  "Hydration Check: Time to drink 250ml of water.",
  "Posture Reset: Sit up straight, roll your shoulders back.",
  "Micro-Workout: 15 bodyweight squats.",
  "Eye Strain Break: Look at an object 20 feet away for 20 seconds.",
  "30 push-ups"
];

const WORK_DURATION_MINUTES = 1; // For testing. Change to 45 for production.
const ALARM_NAME = 'dev-fit-main-alarm';

// Runs once when the extension is first installed or updated.
chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.sync.set({ prompts: defaultPrompts });
  if (details.reason === 'install') {
    // Start the timer automatically on first install.
    startTimer();
  }
});

// Runs every time the browser starts.
chrome.runtime.onStartup.addListener(() => {
  // Check if the timer should be running, but an alarm doesn't exist.
  // This can happen if the browser was closed for a long time.
  chrome.storage.local.get('isRunning', (res) => {
    if (res.isRunning) {
      chrome.alarms.get(ALARM_NAME, (alarm) => {
        if (!alarm) {
          startTimer();
        }
      });
    }
  });
});

// The single, reliable alarm listener.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    // 1. The alarm fired, so send a notification.
    sendNotification();
    // 2. The one-shot alarm is now gone. We must schedule the next one to continue the loop.
    chrome.storage.local.get('isRunning', (res) => {
      if (res.isRunning) {
        // Re-call startTimer to set the next alarm.
        startTimer();
      }
    });
  }
});

function sendNotification() {
  chrome.storage.sync.get('prompts', (data) => {
    const prompts = data.prompts || defaultPrompts;
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    chrome.notifications.create({ // No need for a static ID, let Chrome handle it.
      type: 'basic',
      iconUrl: 'images/icon128.png',
      title: 'Dev-Fit Wellness Break',
      message: randomPrompt,
      priority: 2
    });
  });
}

// --- Message listeners for popup controls ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'start') {
    startTimer();
    // Give chrome a moment to create the alarm before we get its state
    setTimeout(() => sendResponse({ status: 'Timer started' }), 50);
  } else if (request.command === 'stop') {
    stopTimer();
    sendResponse({ status: 'Timer stopped' });
  } else if (request.command === 'get-state') {
    chrome.storage.local.get('isRunning', (res) => {
      if (res.isRunning) {
        chrome.alarms.get(ALARM_NAME, (alarm) => {
          sendResponse({ isRunning: true, scheduledTime: alarm ? alarm.scheduledTime : 0 });
        });
      } else {
        sendResponse({ isRunning: false, scheduledTime: 0 });
      }
    });
  }
  return true; // Indicates an async response.
});

function startTimer() {
  chrome.storage.local.set({ isRunning: true });
  // Create a ONE-TIME alarm that will fire in WORK_DURATION_MINUTES.
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: WORK_DURATION_MINUTES
  });
}

function stopTimer() {
  chrome.storage.local.set({ isRunning: false });
  // Clear the pending alarm to break the loop.
  chrome.alarms.clear(ALARM_NAME);
}
