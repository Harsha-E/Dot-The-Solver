export default {
  async fetch(request, env) {
    // 1. Security Gate
    if (request.method !== "POST") return new Response("Status: OK");
    const auth = request.headers.get("X-Auth-Token");
    if (auth !== env.AUTH_SECRET) return new Response("Unauthorized", { status: 401 });

    const { image } = await request.json();

    // 2. Strategy: Failover Swarm
    // We try Groq first (Speed), then Gemini (Reliability)
    
    // LOAD KEYS FROM ENV VARIABLES
    const groqKeys = env.GROQ_KEYS.split(',');
    const geminiKeys = env.GEMINI_KEYS.split(',');

    // ATTEMPT 1: GROQ (Fastest)
    try {
      const gKey = groqKeys[Math.floor(Math.random() * groqKeys.length)];
      return await callGroq(gKey, image);
    } catch (e) {
      console.log("Groq busy, switching to Gemini...");
    }

    // ATTEMPT 2: GEMINI (Reliable)
    // Try 2 random keys to handle potential rate limits
    for (let i = 0; i < 2; i++) {
      try {
        const gKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
        return await callGemini(gKey, image);
      } catch (e) {
        console.log("Gemini retry...");
      }
    }

    return new Response(JSON.stringify({ q: null, opt: null }));
  }
};

// --- HELPER FUNCTIONS ---

async function callGroq(key, img) {
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.2-11b-vision-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Identify Question Number (digit only) and Correct Option (A/B/C/D). Return JSON: {\"q\": \"5\", \"opt\": \"B\"}" },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${img}` } }
        ]
      }]
    })
  });
  const data = await resp.json();
  return new Response(JSON.stringify(cleanJSON(data.choices[0].message.content)));
}

async function callGemini(key, img) {
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: "Identify Question Number and Option. Return JSON: {\"q\": \"5\", \"opt\": \"B\"}" },
          { inline_data: { mime_type: "image/jpeg", data: img } }
        ]
      }]
    })
  });D
  const data = await resp.json();
  return new Response(JSON.stringify(cleanJSON(data.candidates[0].content.parts[0].text)));
}

function cleanJSON(txt) {
  try {
    return JSON.parse(txt.replace(/```json|```/g, "").trim());
  } catch (e) { return { q: null, opt: null }; }
}