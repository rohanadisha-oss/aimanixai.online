// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST অনুমোদিত।' });
  }

  const { prompt, systemInstruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel-এ GEMINI_API_KEY পাওয়া যায়নি।' });
  }

  try {
    // কোনো লুপ ছাড়া সরাসরি নির্ভরযোগ্য একক মডেল কল
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2
      }
    };

    if (systemInstruction) {
      payload.system_instruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'গুগল সার্ভার থেকে রেসপন্স আসেনি।'
      });
    }

    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ output });

  } catch (error) {
    return res.status(500).json({ error: 'প্রসেসিং ত্রুটি: ' + error.message });
  }
}
