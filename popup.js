document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start');
  const stopButton = document.getElementById('stop');
  const timerDiv = document.getElementById('timer');
  const promptDiv = document.getElementById('prompt');
  const progressCircle = document.getElementById('progress-circle');
  
  const WORK_DURATION_SECONDS = 1 * 60; // 1 minute for testing
  const circumference = 2 * Math.PI * 65;
  let countdownInterval;

  function updateDisplay(state) {
    if (state.isRunning) {
      startButton.style.display = 'none';
      stopButton.style.display = 'flex';
      progressCircle.style.stroke = '#00ff88';
      
      if (countdownInterval) clearInterval(countdownInterval);
      
      let endTime = state.scheduledTime;

      function updateCountdown() {
        let remaining = endTime - Date.now();
        if (remaining < 0) remaining = 0;
        
        let secondsRemaining = Math.floor(remaining / 1000);
        const minutes = Math.floor(secondsRemaining / 60);
        const seconds = secondsRemaining % 60;
        timerDiv.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const progress = ((WORK_DURATION_SECONDS - secondsRemaining) / WORK_DURATION_SECONDS) * circumference;
        progressCircle.style.strokeDashoffset = circumference - progress;

        if (remaining === 0) {
          // Briefly show 00:00 then update for the next cycle
          setTimeout(requestState, 1000);
          clearInterval(countdownInterval);
        }
      }

      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);

    } else {
      startButton.style.display = 'flex';
      stopButton.style.display = 'none';
      progressCircle.style.stroke = 'rgba(255, 255, 255, 0.3)';
      timerDiv.textContent = `${(WORK_DURATION_SECONDS / 60).toString().padStart(2, '0')}:00`;
      progressCircle.style.strokeDashoffset = circumference;
      if (countdownInterval) clearInterval(countdownInterval);
    }
  }

  function requestState() {
    chrome.runtime.sendMessage({ command: 'get-state' }, (response) => {
      if (chrome.runtime.lastError) {
        // Handle error, e.g., background script not ready
        console.error(chrome.runtime.lastError.message);
        setTimeout(requestState, 500); // Retry after a delay
        return;
      }
      updateDisplay(response);
    });
  }

  startButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'start' }, (response) => {
      requestState();
    });
  });

  stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'stop' }, (response) => {
      requestState();
    });
  });

  // Initialize progress ring
  progressCircle.style.strokeDasharray = circumference;
  progressCircle.style.strokeDashoffset = circumference;

  // Initial state request
  requestState();
});
