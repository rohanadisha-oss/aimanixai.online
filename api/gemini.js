// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST রিকোয়েস্ট অনুমোদিত।' });
  }

  const { prompt, systemInstruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel-এ GEMINI_API_KEY সেট করা নেই!' });
  }

  // শুধুমাত্র 3.5 flash এবং 3.8 flash
  const models = [
    'gemini-3.5-flash',
    'gemini-3.8-flash'
  ];

  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.status(200).json({
          output: data.candidates[0].content.parts[0].text,
          activeModel: model
        });
      } else {
        lastError = data.error?.message || `${model} থেকে সঠিক উত্তর পাওয়া যায়নি`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(500).json({
    error: `সার্ভার রেসপন্স দেয়নি। এরর: ${lastError}`
  });
}
