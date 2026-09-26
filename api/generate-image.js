// api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড অনুমোদিত।' });
  }

  const { prompt, templateType } = req.body;
  
  // Vercel-এর Environment Variable (না পেলে ফালব্যাক)
  const apiKey = (process.env.VELONA_API_KEY || "key_live_20260915_85b14a4c0cec48da612a8bd1bc4ccfa1").trim();

  if (!prompt) {
    return res.status(400).json({ error: 'পোস্টারের বিবরণ আবশ্যক।' });
  }

  // পোস্টারের ব্যাকগ্রাউন্ড, ফন্ট ও ৩ডি কালার আর্কিটেকচার
  let finalPrompt = '';
  if (templateType === 'ad_poster') {
    finalPrompt = `Vertical commercial advertising poster banner for: "${prompt}". Highly elegant dark royal purple and midnight navy gradient background, illuminated glowing metallic gold borders. 3D embossed bold typography layout supporting clean bilingual Bengali script and English text, crisp legible headers, realistic central subject, festive event ribbon at bottom. 8k resolution, cinematic lighting, ultra-clean marketing graphic design.`;
  } else if (templateType === 'shop_offer') {
    finalPrompt = `Ultra-modern vertical commercial promotional flyer for: "${prompt}". Rich deep violet background with neon magenta highlights, golden confetti sparkles, 3D glossy discount badge ribbons, bold eye-catching bilingual typography layout with crisp Bengali text styling, modern retail store showcase center. 8k octane render, premium advertising aesthetic.`;
  } else {
    finalPrompt = `Vertical commercial advertising poster flyer for: "${prompt}". Dark royal purple background, glowing gold borders, 3D typography, premium print design.`;
  }

  try {
    // আপনার সফল gemini.js-এর হুবহু আসল Velona Inference এন্ডপয়েন্ট
    const response = await fetch("https://velona.in/gateway/v1/inference/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/dall-e-3",
        prompt: finalPrompt,
        size: "1024x1792",
        n: 1
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || data.message || JSON.stringify(data);
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
