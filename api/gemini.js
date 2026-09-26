// api/gemini.js
export default async function handler(req, res) {
  // CORS ও মেথড গার্ড
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড অনুমোদিত।' });
  }

  const { prompt, systemInstruction } = req.body;
  const apiKey = "key_live_20260915_85b14a4c0cec48da612a8bd1bc4ccfa1";
  const baseUrl = "https://velona.in/gateway/v1";

  try {
    const messages = [];

    if (systemInstruction) {
      messages.push({
        role: "system",
        content: systemInstruction
      });
    }

    messages.push({
      role: "user",
      content: prompt
    });

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "default",
        messages: messages,
        temperature: 0.2
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || data.message || 'Velona গেটওয়ে থেকে ত্রুটি এসেছে।'
      });
    }

    const output = data.choices?.[0]?.message?.content || data.output || '';
    return res.status(200).json({ output });

  } catch (error) {
    return res.status(500).json({ 
      error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message 
    });
  }
}
