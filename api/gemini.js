// api/gemini.js
export default async function handler(req, res) {
  // শুধুমাত্র POST রিকোয়েস্ট গ্রহণ করবে
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড অনুমোদিত।' });
  }

  const { prompt, systemInstruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel Environment-এ GEMINI_API_KEY পাওয়া যায়নি।' });
  }

  // গুগলের অফিশিয়াল এবং সক্রিয় মডেল সমূহের ক্রমতালিকা
  const models = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro'
  ];

  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.2,
          maxOutputTokens: 8192
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
        lastError = data.error?.message || `${model} থেকে সঠিক টেক্সট রেসপন্স পাওয়া যায়নি।`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(500).json({ 
    error: `সার্ভার ব্যস্ত রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন। বিস্তারিত: ${lastError}` 
  });
}