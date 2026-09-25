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

  try {
    // গুগলের নির্দেশিত নতুন Interactions API এন্ডপয়েন্ট
    const url = 'https://generativelanguage.googleapis.com/v1/interactions';

    const fullPrompt = systemInstruction 
      ? `${systemInstruction}\n\nUser Task:\n${prompt}` 
      : prompt;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        model: 'gemini-3.8-flash',
        input: fullPrompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'গুগল সার্ভার থেকে ত্রুটি এসেছে।' 
      });
    }

    // নতুন রেসপন্স স্ট্রাকচার থেকে টেক্সট এক্সট্র্যাক্ট করা
    let outputText = '';
    if (typeof data.output === 'string') {
      outputText = data.output;
    } else if (data.output?.text) {
      outputText = data.output.text;
    } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      outputText = data.candidates[0].content.parts[0].text;
    }

    return res.status(200).json({ output: outputText });

  } catch (error) {
    return res.status(500).json({ error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message });
  }
}
