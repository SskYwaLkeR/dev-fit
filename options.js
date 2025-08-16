document.addEventListener('DOMContentLoaded', () => {
  const promptsTextarea = document.getElementById('prompts');
  const saveButton = document.getElementById('save');

  chrome.storage.sync.get('prompts', (data) => {
    if (data.prompts) {
      promptsTextarea.value = data.prompts.join('\n');
    }
  });

  saveButton.addEventListener('click', () => {
    const prompts = promptsTextarea.value.split('\n').filter(p => p.trim() !== '');
    
    // Save prompts without interfering with the running timer
    chrome.storage.sync.set({ prompts: prompts }, () => {
      // Show success message without using alert (which can block execution)
      saveButton.textContent = 'Saved!';
      saveButton.style.background = 'linear-gradient(135deg, #00cc6a 0%, #00aa55 100%)';
      
      setTimeout(() => {
        saveButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z"/>
          </svg>
          Save Prompts
        `;
        saveButton.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)';
      }, 2000);
    });
  });
});
