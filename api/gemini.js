// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড অনুমোদিত।' });
  }

  const { prompt, systemInstruction } = req.body;
  const apiKey = "key_live_20260915_85b14a4c0cec48da612a8bd1bc4ccfa1";

  try {
    const fullUserText = systemInstruction 
      ? `System Instruction:\n${systemInstruction}\n\nUser Task:\n${prompt}` 
      : prompt;

    // Velona-র অফিশিয়াল নেটিভ এন্ডপয়েন্ট
    const response = await fetch("https://velona.in/gateway/v1/inference/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // Velona-র সুপার ফাস্ট ও সাশ্রয়ী মডেল
        turns: [
          { role: "user", content: fullUserText }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || data.message || JSON.stringify(data);
      return res.status(response.status).json({
        error: `Velona এরর: ${errMsg}`
      });
    }

    // Velona-র অফিসিয়াল রেসপন্স ফরম্যাট: data.output
    const outputText = data.data?.output || data.output || data.choices?.[0]?.message?.content || '';

    return res.status(200).json({ output: outputText });

  } catch (error) {
    return res.status(500).json({ 
      error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message 
    });
  }
}
