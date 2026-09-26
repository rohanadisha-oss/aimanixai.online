// api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড অনুমোদিত।' });
  }

  const { prompt, templateType } = req.body;

  // gemini.js-এর মতো সরাসরি একই কি
  const apiKey = "key_live_20260915_85b14a4c0cec48da612a8bd1bc4ccfa1";

  if (!prompt) {
    return res.status(400).json({ error: 'পোস্টারের বিবরণ আবশ্যক।' });
  }

  // রয়্যাল পার্পল ও গোল্ডেন থিমের নিখুঁত উল্লম্ব পোস্টার প্রম্পট
  let finalPrompt = '';
  if (templateType === 'ad_poster') {
    finalPrompt = `Professional vertical commercial advertising poster banner for: "${prompt}". Highly elegant dark royal purple and midnight navy gradient background, illuminated glowing metallic gold borders. 3D embossed bold glowing typography layout supporting clean bilingual Bengali script and English text, crisp legible headers, realistic central institutional subject, festive event ribbon at bottom. 8k resolution, cinematic lighting, ultra-clean marketing graphic design.`;
  } else if (templateType === 'shop_offer') {
    finalPrompt = `Ultra-modern vertical commercial promotional sale flyer for: "${prompt}". Rich deep violet background with neon magenta highlights, golden confetti sparkles, 3D glossy discount badge ribbons, bold eye-catching bilingual typography layout with crisp Bengali text styling, modern retail store showcase center. 8k octane render, premium advertising aesthetic.`;
  } else {
    finalPrompt = `Vertical commercial advertising poster flyer for: "${prompt}". Dark royal purple background, glowing gold borders, 3D typography, premium print design.`;
  }

  try {
    const response = await fetch("https://velona.in/gateway/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1792"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || data.message || JSON.stringify(data);
      return res.status(response.status).json({
        error: `Velona এরর: ${errMsg}`
      });
    }

    // রেসপন্স থেকে ছবির লিংক নেওয়া
    const imageUrl = 
      data.data?.[0]?.url || 
      data.images?.[0]?.url || 
      data.output_url || 
      data.url || 
      '';

    if (!imageUrl) {
      return res.status(500).json({ 
        error: 'Velona থেকে ছবির লিঙ্ক পাওয়া যায়নি: ' + JSON.stringify(data) 
      });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ 
      error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message 
    });
  }
}
