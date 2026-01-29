// --- CONFIGURATION ---
const WORKER_URL = "https://dry-moon.harshaedupuganti70.workers.dev/"; 

// --- SCAN LOGIC ---
function executeProtocol(tab) {
  if (!tab || !tab.id) return;
  console.log("[System] Scanning...");

  chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 40 }, (dataUrl) => {
    if (!dataUrl) return;

    fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: dataUrl.split(",")[1] })
    })
    .then(res => res.json())
    .then(data => {
      console.log("[System] Data:", data);
      chrome.tabs.sendMessage(tab.id, { 
        action: "sys_inject", 
        q: data.q, 
        opt: data.opt 
      }).catch(() => console.log("Tab disconnected."));
    })
    .catch(err => console.log("Edge Error:", err));
  });
}

// --- WIPE LOGIC ---
function executeWipe(tab) {
  if (!tab || !tab.id) return;
  console.log("[System] Wiping clean.");
  chrome.tabs.sendMessage(tab.id, { action: "sys_wipe" });
}

// --- LISTENERS ---
chrome.action.onClicked.addListener(executeProtocol);

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (command === "trigger_scan") {
      executeProtocol(tabs[0]);
    } else if (command === "wipe_clean") {
      executeWipe(tabs[0]);
    }
  });
});