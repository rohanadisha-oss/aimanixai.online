// api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড সমর্থিত।' });
  }

  const { prompt, templateType, referenceImage } = req.body;
  const apiKey = "key_live_20260915_85b14a4c0cec48da612a8bd1bc4ccfa1";

  if (!prompt) {
    return res.status(400).json({ error: 'পোস্টারের বিবরণ আবশ্যক।' });
  }

  // ChatGPT স্টাইলের পোস্টার টাইপোগ্রাফি ডিরেকশন
  const posterPrompt = `Generate a modern vertical commercial advertising poster (1024x1792 portrait) for: "${prompt}". Category: ${templateType || 'general'}. Clean bold 3D Bengali and English typography headers, high-contrast badges, commercial visual elements, vibrant background, edge-to-edge layout, full bleed poster design, no picture frame mockup, no wall mockup.`;

  // Velona-র turns তৈরি
  const userContent = [];
  userContent.push({ type: "text", text: posterPrompt });
  
  if (referenceImage) {
    userContent.push({
      type: "image_url",
      image_url: { url: referenceImage }
    });
  }

  try {
    const response = await fetch("https://velona.in/gateway/v1/inference/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-5-image",
        turns: [
          {
            role: "user",
            content: userContent
          }
        ]
      })
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(response.status || 500).json({
        error: `গেটের এরর (${response.status}): ${rawText.substring(0, 150)}`
      });
    }

    if (!response.ok) {
      const errMsg = data.error?.message || data.message || data.detail || JSON.stringify(data);
      return res.status(response.status).json({
        error: `Velona এরর: ${errMsg}`
      });
    }

    // Velona রেসপন্স থেকে ছবির লিংক শনাক্তকরণ
    const imageUrl = 
      data.data?.output || 
      data.output || 
      data.data?.[0]?.url || 
      data.images?.[0]?.url || 
      data.images?.[0] || 
      data.url || 
      data.choices?.[0]?.message?.content || 
      '';

    if (!imageUrl) {
      return res.status(500).json({ 
        error: 'Velona থেকে ছবির লিংক পাওয়া যায়নি: ' + JSON.stringify(data) 
      });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ 
      error: 'সার্ভার সমস্যা: ' + error.message 
    });
  }
}
