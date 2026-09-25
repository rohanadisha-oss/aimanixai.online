// api/gemini.js

export default async function handler(req, res) {
  // শুধু POST request গ্রহণ করবে
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'শুধুমাত্র POST অনুমোদিত।'
    });
  }

  try {
    const { prompt, systemInstruction } = req.body || {};

    // Prompt আছে কি না
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt পাওয়া যায়নি।'
      });
    }

    // Vercel Environment Variable
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Vercel-এ GEMINI_API_KEY পাওয়া যায়নি।'
      });
    }

    // বর্তমান Gemini model
    const model = 'gemini-3.6-flash';

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2
      }
    };

    // System instruction থাকলে যোগ করবে
    if (
      systemInstruction &&
      typeof systemInstruction === 'string'
    ) {
      payload.system_instruction = {
        parts: [
          {
            text: systemInstruction
          }
        ]
      };
    }

    const response = await fetch(url, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },

      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Google API error
    if (!response.ok) {
      console.error('Gemini API Error:', data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          'Gemini API থেকে কোনো উত্তর পাওয়া যায়নি।'
      });
    }

    // Gemini response থেকে text বের করা
    const output =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || '')
        .join('') || '';

    if (!output) {
      console.error('Unexpected Gemini response:', data);

      return res.status(500).json({
        error: 'Gemini কোনো text response দেয়নি।'
      });
    }

    return res.status(200).json({
      output
    });

  } catch (error) {
    console.error('Server Error:', error);

    return res.status(500).json({
      error: 'প্রসেসিং ত্রুটি: ' + error.message
    });
  }
}