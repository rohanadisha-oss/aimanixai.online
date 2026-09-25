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

  // স্ক্রিনশটের লেটেস্ট ফ্ল্যাগশিপ মডেলগুলোর তালিকা
  const models = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash'
  ];

  let lastError = null;

  for (const model of models) {
    try {
      // গুগলের নতুন interactions এন্ডপয়েন্ট
      const url = 'https://generativelanguage.googleapis.com/v1/interactions';

      const fullPrompt = systemInstruction 
        ? `${systemInstruction}\n\nUser Task: ${prompt}` 
        : prompt;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          model: model,
          input: fullPrompt
        })
      });

      const data = await response.json();

      if (response.ok) {
        // নতুন interactions ফরম্যাট থেকে আউটপুট নেওয়া
        const output = data.output || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (output) {
          return res.status(200).json({ output, activeModel: model });
        }
      }

      lastError = data.error?.message || `${model} থেকে সঠিক আউটপুট আসেনি`;
    } catch (err) {
      lastError = err.message;
    }
  }

  // কোনো কারণে interactions ব্যর্থ হলে সরাসরি স্ট্যাবল ব্যাকআপ
  try {
    const backupUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const backupRes = await fetch(backupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction || '' }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });
    const backupData = await backupRes.json();
    if (backupRes.ok && backupData.candidates?.[0]?.content?.parts?.[0]?.text) {
      return res.status(200).json({ 
        output: backupData.candidates[0].content.parts[0].text,
        activeModel: 'gemini-2.5-flash'
      });
    }
  } catch (e) {
    lastError = e.message;
  }

  return res.status(500).json({ 
    error: `সার্ভার রেসপন্স দেয়নি। এরর: ${lastError}` 
  });
}
