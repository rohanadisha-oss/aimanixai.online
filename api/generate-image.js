// api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড অনুমোদিত।' });
  }

  const { prompt, templateType } = req.body;
  const apiKey = (process.env.VELONA_API_KEY || '').trim();

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel-এ VELONA_API_KEY পাওয়া যায়নি।' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'পোস্টারের বিবরণ আবশ্যক।' });
  }

  // লম্বা পোর্ট্রেট পোস্টারের জন্য প্রম্পট
  let finalPrompt = prompt;
  if (templateType === 'ad_poster') {
    finalPrompt = `Vertical commercial advertising poster flyer for: "${prompt}". Highly detailed architectural rendering, vibrant royal purple, deep violet, and metallic gold glowing frame borders. 3D embossed bold glossy headers, realistic center subject, clean bottom ribbons. 8k octane render, professional marketing print design.`;
  } else if (templateType === 'shop_offer') {
    finalPrompt = `Vertical promotional discount sale flyer for: "${prompt}". Eye-catching vibrant retail store theme, 3D sale badges, bold promotional typography.`;
  }

  try {
    // Velona-র অফিসিয়াল native ইমেজ রেন্ডার এন্ডপয়েন্ট
    const response = await fetch("https://velona.in/gateway/v1/images/render", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
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

    // Velona API রেসপন্স থেকে ছবির লিঙ্ক বের করা
    const imageUrl = data.data?.[0]?.url || data.output_url || data.url || data.images?.[0] || '';

    if (!imageUrl) {
      return res.status(500).json({ error: 'সার্ভার থেকে ছবির লিঙ্ক পাওয়া যায়নি।' });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message });
  }
}
