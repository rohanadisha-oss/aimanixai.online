// api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড সমর্থিত।' });
  }

  const { prompt, templateType } = req.body;
  const apiKey = "key_live_20260915_85b14a4c0cec48da612a8bd1bc4ccfa1";

  if (!prompt) {
    return res.status(400).json({ error: 'পোস্টারের বিবরণ আবশ্যক।' });
  }

  try {
    // ১. Velona দিয়ে পোস্টারের মূল ইংরেজি ডিরেকশন তৈরি
    const velonaRes = await fetch("https://velona.in/gateway/v1/inference/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        turns: [
          {
            role: "system",
            content: "You are a graphic design director. Create a 1-sentence vibrant visual description for an advertising poster flyer. Strict rules: Include modern 3D shapes, vibrant neon lighting, dynamic product displays, and sleek marketing badges. NO walls, NO picture frames, full edge-to-edge poster layout."
          },
          {
            role: "user",
            content: `Create advertising flyer visual description for: ${prompt}. Template: ${templateType || 'general'}`
          }
        ]
      })
    });

    const velonaJson = await velonaRes.json();
    let visualPrompt = velonaJson.data?.output || prompt;
    visualPrompt = visualPrompt.replace(/[\r\n]+/g, ' ').trim();

    // ২. হাই-কোয়ালিটি আল্ট্রা-রেন্ডার (1024x1792 উল্লম্ব পোস্টার)
    const seed = Math.floor(Math.random() * 9999999);
    const finalQuery = encodeURIComponent(`${visualPrompt}, full-bleed modern advertising flyer, vibrant commercial background, ultra crisp 8k, edge to edge graphic design`);
    
    // হাই-স্পিড টার্বো ইঞ্জিন
    const generatedUrl = `https://image.pollinations.ai/prompt/${finalQuery}?width=1024&height=1792&model=turbo&seed=${seed}&nologo=true`;

    return res.status(200).json({ imageUrl: generatedUrl });

  } catch (err) {
    return res.status(500).json({ error: 'প্রসেসিং এরর: ' + err.message });
  }
}
