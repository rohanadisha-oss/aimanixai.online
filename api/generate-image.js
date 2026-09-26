// api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড সমর্থিত।' });
  }

  const { prompt, templateType } = req.body;
  const apiKey = (process.env.VELONA_API_KEY || '').trim();

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel-এ VELONA_API_KEY পাওয়া যায়নি।' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'প্রম্পট দেওয়া আবশ্যক।' });
  }

  // ফন্ট, ব্যাকগ্রাউন্ড এবং উভয় ভাষার নিখুঁত প্রম্পট ফরম্যাট
  let finalPrompt = '';

  if (templateType === 'ad_poster') {
    // স্কুল ও প্রাতিষ্ঠানিক ব্যানার
    finalPrompt = `Professional vertical commercial advertising poster for: "${prompt}". Highly elegant dark royal purple and midnight navy gradient background, illuminated metallic gold ornamental borders. 3D embossed bold glowing typography supporting bilingual Bengali and English lettering style, highly legible crisp text layout, realistic central institutional subject, festive event ribbon at bottom. 8k resolution, cinematic lighting, ultra-clean marketing graphic design.`;
  } else if (templateType === 'shop_offer') {
    // দোকান ও সেলস অফার ব্যানার
    finalPrompt = `Ultra-modern vertical commercial promotional flyer for: "${prompt}". Rich deep violet background with neon magenta highlights, golden confetti sparkles, 3D glossy discount badge ribbons, bold eye-catching bilingual typography layout with crisp Bengali text styling, modern retail store showcase center. 8k octane render, premium advertising aesthetic.`;
  } else {
    finalPrompt = `Vertical commercial poster: "${prompt}". Dark royal purple background, gold glowing frame, 3D typography, premium print design.`;
  }

  try {
    const response = await fetch("https://velona.in/gateway/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        n: 1,
        size: "1024x1792"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || data.message || JSON.stringify(data) 
      });
    }

    const imageUrl = data.data?.[0]?.url || data.url || data.output_url || '';
    if (!imageUrl) {
      return res.status(500).json({ error: 'ছবি তৈরির লিংক পাওয়া যায়নি।' });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ error: 'সার্ভার এরর: ' + error.message });
  }
}
