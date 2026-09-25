// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড অনুমোদিত।' });
  }

  const { prompt, systemInstruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel Environment-এ GEMINI_API_KEY পাওয়া যায়নি।' });
  }

  // উচ্চ কোটা সম্পন্ন স্ট্যাবল মডেলের তালিকা (আগের ব্যাকআপ ধারায়)
  const models = [
    'gemini-flash-latest',
    'gemini-1.5-flash',
    'gemini-3.5-flash'
  ];

  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      };

      if (systemInstruction) {
        payload.system_instruction = { parts: [{ text: systemInstruction }] };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.status(200).json({ 
          output: data.candidates[0].content.parts[0].text 
        });
      } else {
        lastError = data.error?.message || `${model} থেকে ত্রুটি এসেছে`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(500).json({ 
    error: `সার্ভার প্রসেস সম্পন্ন করা যায়নি: ${lastError}` 
  });
}