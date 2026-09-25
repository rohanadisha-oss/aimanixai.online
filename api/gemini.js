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

  try {
    // গুগলের অফিশিয়াল Interactions API এন্ডপয়েন্ট
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
        error: data.error?.message || 'গুগল এপিআই থেকে ত্রুটি এসেছে।'
      });
    }

    // Interactions API-এর বিভিন্ন সম্ভাব্য রেসপন্স ফরম্যাট হ্যান্ডলিং
    let textOutput = '';
    if (typeof data.output === 'string') {
      textOutput = data.output;
    } else if (data.output?.text) {
      textOutput = data.output.text;
    } else if (Array.isArray(data.output)) {
      textOutput = data.output.map(item => item.text || item).join('\n');
    } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      textOutput = data.candidates[0].content.parts[0].text;
    }

    return res.status(200).json({ output: textOutput });

  } catch (error) {
    return res.status(500).json({ error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message });
  }
}
