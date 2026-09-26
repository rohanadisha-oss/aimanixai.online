// api/generate-image.js
export default async function handler(req, res) {
  // ১. মেথড যাচাই
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড অনুমোদিত।' });
  }

  const { prompt, templateType } = req.body;

  // ২. Vercel Environment Variables থেকে এপিআই কি নেওয়া
  const apiKey = process.env.VELONA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel-এ VELONA_API_KEY খুঁজে পাওয়া যায়নি।' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'পোস্টারের বিবরণ বা প্রম্পট দেওয়া আবশ্যক।' });
  }

  // ৩. নিখুঁত পোর্ট্রেট ব্যানার ও বিজ্ঞাপনের জন্য প্রম্পট ইঞ্জিনিয়ারিং
  let finalPrompt = prompt;
  if (templateType === 'ad_poster') {
    finalPrompt = `Vertical commercial advertising poster flyer for: "${prompt}". Highly detailed architectural rendering, vibrant royal purple, deep violet, and metallic gold glowing frame borders. 3D embossed bold glossy headers, realistic center subject, clean bottom ribbons. 8k octane render, professional marketing print design.`;
  } else if (templateType === 'shop_offer') {
    finalPrompt = `Vertical promotional discount sale flyer for: "${prompt}". Eye-catching vibrant retail store theme, 3D sale badges, bold promotional typography.`;
  }

  try {
    // ৪. Velona AI Gateway-তে রিকোয়েস্ট পাঠানো (DALL-E 3 Portrait সাইজ সহ)
    const response = await fetch("https://velona.in/gateway/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1792" // লম্বা খাড়া পোর্ট্রেট পোস্টারের জন্য উপযুক্ত সাইজ
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || data.message || JSON.stringify(data);
      return res.status(response.status).json({ error: `ইমেজ গেটওয়ে এরর: ${errMsg}` });
    }

    // ৫. রেসপন্স থেকে ছবির লিংক বের করা
    const imageUrl = data.data?.[0]?.url || data.output_url || data.url || '';

    if (!imageUrl) {
      return res.status(500).json({ error: 'সার্ভার থেকে ছবির কোনো URL পাওয়া যায়নি।' });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message });
  }
}
