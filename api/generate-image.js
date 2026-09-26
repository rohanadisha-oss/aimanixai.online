// api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড সমর্থিত।' });
  }

  const { prompt, templateType } = req.body;

  // Vercel Environment Variables থেকে আপনার মূল কি নেওয়া
  let apiKey = (process.env.VELONA_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel-এ VELONA_API_KEY পাওয়া যায়নি।' });
  }

  // নিশ্চিত করা হচ্ছে যাতে Bearer ডাবল না হয়
  const authHeader = apiKey.toLowerCase().startsWith('bearer ') ? apiKey : `Bearer ${apiKey}`;

  if (!prompt) {
    return res.status(400).json({ error: 'প্রম্পট দেওয়া আবশ্যক।' });
  }

  // ব্যাকগ্রাউন্ড থিম, বাংলা-ইংরেজি ফন্ট ও লাইটিং প্রম্পট
  let finalPrompt = '';
  if (templateType === 'ad_poster') {
    // স্কুল, মাদ্রাসা ও প্রাতিষ্ঠানিক ব্যানার
    finalPrompt = `Professional vertical commercial advertising poster banner for: "${prompt}". Highly elegant dark royal purple and midnight navy gradient background, illuminated glowing metallic gold ornamental borders. 3D embossed bold glowing typography layout supporting clean bilingual Bengali script and English text, crisp legible headers, realistic central institutional subject, festive event ribbon at bottom. 8k resolution, cinematic lighting, ultra-clean marketing graphic design.`;
  } else if (templateType === 'shop_offer') {
    // দোকান ও সেলস অফার ব্যানার
    finalPrompt = `Ultra-modern vertical commercial promotional flyer for: "${prompt}". Rich deep violet background with neon magenta highlights, golden confetti sparkles, 3D glossy discount badge ribbons, bold eye-catching bilingual typography layout with crisp Bengali text styling, modern retail store showcase center. 8k octane render, premium advertising aesthetic.`;
  } else {
    finalPrompt = `Vertical commercial advertising poster flyer for: "${prompt}". Dark royal purple background, glowing gold borders, 3D typography, premium print design.`;
  }

  try {
    // Velona Gateway-এর অফিশিয়াল Bearer এন্ডপয়েন্ট
    const endpoint = "https://velona.in/gateway/v1/images/render";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: finalPrompt,
        config: {
          size: "1024x1792",
          quality: "standard",
          count: 1
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || data.message || JSON.stringify(data);
      return res.status(response.status).json({ error: `ইমেজ গেটওয়ে এরর: ${errMsg}` });
    }

    // Velona রেসপন্স থেকে ছবির লিঙ্ক শনাক্তকরণ
    const imageUrl = 
      data.data?.[0]?.url || 
      data.images?.[0]?.url || 
      data.images?.[0] || 
      data.output_url || 
      data.url || 
      '';

    if (!imageUrl) {
      return res.status(500).json({ error: 'ছবি তৈরির লিংক পাওয়া যায়নি: ' + JSON.stringify(data) });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message });
  }
}
