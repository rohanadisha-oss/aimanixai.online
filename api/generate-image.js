// api/generate-image.js
export const config = {
  maxDuration: 60, // Vercel ফ্রি টিয়ারের নিরাপদ সর্বোচ্চ সীমা
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড সমর্থিত।' });
  }

  const { prompt } = req.body;
  const apiKey = "key_live_20260915_85b14a4c0cec48da612a8bd1bc4ccfa1";

  if (!prompt) {
    return res.status(400).json({ error: 'অনুগ্রহ করে প্রম্পট লিখুন।' });
  }

  try {
    // GPT Image 2.0 (openai/gpt-5.4-image-2) মডেল কল
    const response = await fetch("https://velona.in/gateway/v1/inference/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-5.4-image-2",
        turns: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || data.message || JSON.stringify(data);
      return res.status(response.status).json({ error: `Velona এরর: ${errMsg}` });
    }

    // ইমেজ URL বা Base64 ডেটা পার্সিং
    let imageUrl = "";
    if (data.data?.images?.[0]) {
      imageUrl = data.data.images[0].url || data.data.images[0];
    } else if (data.data?.output) {
      const raw = data.data.output;
      const mdMatch = typeof raw === 'string' ? raw.match(/!\[.*?\]\((.*?)\)/) : null;
      imageUrl = mdMatch ? mdMatch[1] : (typeof raw === 'string' && (raw.startsWith('http') || raw.startsWith('data:image')) ? raw : "");
    }

    if (!imageUrl) {
      return res.status(500).json({
        error: "ছবি জেনারেট সম্পন্ন হয়নি",
        raw: data
      });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ error: 'সার্ভার সমস্যা: ' + error.message });
  }
}
