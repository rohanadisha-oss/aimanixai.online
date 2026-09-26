// api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড অনুমোদিত।' });
  }

  const { prompt, templateType } = req.body;
  const apiKey = "key_live_20260915_85b14a4c0cec48da612a8bd1bc4ccfa1";

  if (!prompt) {
    return res.status(400).json({ error: 'পোস্টারের বিবরণ আবশ্যক।' });
  }

  // রয়্যাল পার্পল ও গোল্ডেন থিমের নিখুঁত উল্লম্ব পোস্টার প্রম্পট
  let finalPrompt = '';
  if (templateType === 'ad_poster') {
    finalPrompt = `Vertical commercial advertising poster banner for: "${prompt}". Highly elegant dark royal purple and midnight navy gradient background, illuminated glowing metallic gold borders, 3D embossed bold glowing typography layout, bilingual Bengali and English lettering style, ultra-clean marketing graphic design.`;
  } else if (templateType === 'shop_offer') {
    finalPrompt = `Ultra-modern vertical commercial promotional sale flyer for: "${prompt}". Rich deep violet background with neon magenta highlights, golden confetti sparkles, 3D glossy discount badge ribbons, bold eye-catching typography, modern retail showcase center. 8k octane render.`;
  } else {
    finalPrompt = `Vertical commercial advertising poster flyer for: "${prompt}". Dark royal purple background, glowing gold borders, 3D typography, premium print design.`;
  }

  try {
    // gemini.js এর মতো আসল Velona এন্ডপয়েন্ট
    const response = await fetch("https://velona.in/gateway/v1/inference/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/dall-e-3",
        input: finalPrompt,
        parameters: {
          size: "1024x1792",
          quality: "standard"
        }
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
      '';

    if (!imageUrl) {
      return res.status(500).json({ 
        error: 'ছবির লিংক পাওয়া যায়নি: ' + JSON.stringify(data) 
      });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ 
      error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message 
    });
  }
}
