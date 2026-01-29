// --- COMMANDER PROTOCOL V3 (STRICT MODE) ---
(function() {
  console.log("[Commander V3] Active. Ready for strict targeting.");
})();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. WIPE COMMAND
  if (request.action === "sys_wipe") {
    document.querySelectorAll(".stealth_mark").forEach(el => el.remove());
    return;
  }

  // 2. INJECT COMMAND
  if (request.action === "sys_inject") {
    const qNum = request.q; 
    const answer = request.opt; 

    if (!qNum || !answer) return;

    markStrictRow(qNum, answer);
  }
});

function markStrictRow(qNum, answerChar) {
  // 1. GATHER CANDIDATES
  // We get EVERY container that might be an answer row.
  const allContainers = document.querySelectorAll('div, tr, li, fieldset');
  let bestCandidate = null;
  
  // STRICT REGEX: 
  // Matches "3", "Q3", "3.", "#3", "Question 3"
  // BUT NOT "13", "30", "3A"
  // The boundaries (^, \s, $, \.) are critical.
  const strictRegex = new RegExp(`(^|\\s|Q|Question|#)${qNum}([\\.:]|$|\\s)`, "i");

  for (let container of allContainers) {
    // FILTER 1: Must look like a row (not too big, not too small)
    if (container.childElementCount > 20 || container.innerText.length > 300) continue;
    
    // FILTER 2: Must have radio buttons (The DNA of an answer row)
    const radios = container.querySelectorAll('input[type="radio"]');
    if (radios.length < 2) continue;

    // FILTER 3: Text Match
    // We check the container text. If it matches our number strictly, we lock it.
    if (strictRegex.test(container.innerText)) {
       bestCandidate = container;
       
       // OPTIONAL: If we find a "perfect" match (e.g., id="row-3"), we stop immediately.
       if (container.id && (container.id === `row-${qNum}` || container.id === `q${qNum}`)) {
           break; 
       }
       
       // Otherwise, we keep scanning to see if we find a *better* match? 
       // No, with Strict Regex, the first valid match is usually correct 
       // IF we scan top-down and the regex is tight.
       break;
    }
  }

  if (!bestCandidate) {
    console.warn(`[Commander] No strict match for Q${qNum}`);
    return;
  }

  // 2. CLEANUP SPECIFIC ROW
  // Remove old dots ONLY from this specific row (Targeted Refresh)
  bestCandidate.querySelectorAll(".stealth_mark").forEach(el => el.remove());

  // 3. AUTO-SCROLL (Focus)
  bestCandidate.scrollIntoView({behavior: "smooth", block: "center"});

  // 4. FIND OPTION
  const radios = Array.from(bestCandidate.querySelectorAll('input[type="radio"]'));
  const index = answerChar.toUpperCase().charCodeAt(0) - 65; // A=0
  
  if (index < 0 || index >= radios.length) return;

  // 5. INJECT
  injectDot(radios[index]);
}

function injectDot(targetRadio) {
  const dot = document.createElement("span");
  dot.className = "stealth_mark";
  dot.innerHTML = "."; 
  
  Object.assign(dot.style, {
    color: "#000",       
    fontWeight: "900",
    fontSize: "10px",    
    lineHeight: "0",
    marginLeft: "4px",
    position: "relative",
    top: "3px",         
    zIndex: "999999",
    display: "inline-block",
    pointerEvents: "none"
  });

  if (targetRadio.parentElement.tagName === "LABEL") {
    targetRadio.parentElement.appendChild(dot);
  } else {
    targetRadio.insertAdjacentElement('afterend', dot);
  }
}