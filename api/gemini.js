// api/gemini.js
export default async function handler(req, res) {
  // শুধুমাত্র POST রিকোয়েস্ট গ্রহণ করবে
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, systemInstruction } = req.body;

  // Vercel-এর ক্লাউড ভল্ট থেকে গোপন API Key গোপনে পড়বে
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel Settings-এ GEMINI_API_KEY সেট করা নেই!' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction || '' }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Google AI সার্ভার রেসপন্স দেয়নি।' });
    }

    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ output });
  } catch (error) {
    return res.status(500).json({ error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message });
  }
}
