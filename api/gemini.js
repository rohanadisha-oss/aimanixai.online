// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST রিকোয়েস্ট অনুমোদিত' });
  }

  const { prompt, systemInstruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel Settings-এ GEMINI_API_KEY কনফিগার করা নেই!' });
  }

  // কম থেকে ক্রমানুসারে ৪টি মডেলের লিস্ট
  const models = [
    'gemini-1.5-flash',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-3.8-flash'
  ];

  let lastError = null;

  // ক্রমানুসারে প্রতিটি মডেল দিয়ে কল পাঠানোর চেষ্টা করবে
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.status(200).json({ 
          output: data.candidates[0].content.parts[0].text,
          activeModel: model 
        });
      } else {
        lastError = data.error?.message || `${model} থেকে ত্রুটি পাওয়া গেছে`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(500).json({ 
    error: `সবগুলো মডেল ব্যর্থ হয়েছে। সর্বশেষ এরর: ${lastError}` 
  });
}
