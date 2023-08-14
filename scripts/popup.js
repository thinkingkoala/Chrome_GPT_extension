document.addEventListener("DOMContentLoaded", function() {
    const runBtn = document.getElementById("runbtn");
    const loadingIcon = document.getElementById('loadingIcon');

    // Send a message to content script to trigger API call
    runBtn.addEventListener("click", async function() {
        // Display loading icon
        loadingIcon.style.display = 'block';

        //execute the function on the main tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: runSummarization
        });
    });

    //Listen for messages from the content script
    chrome.runtime.onMessage.addListener(function (message) {
        if (message === 'executionCompleted') {
            loadingIcon.style.display = 'none';
        }
    });
});

async function runSummarization() {
    await run();
    chrome.runtime.sendMessage('executionCompleted');
}