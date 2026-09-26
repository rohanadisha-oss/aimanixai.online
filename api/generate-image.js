// api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড অনুমোদিত।' });
  }

  const { prompt, templateType } = req.body;

  // Vercel Environment Variables থেকে সরাসরি কি (Key) নেওয়া হচ্ছে
  const apiKey = process.env.VELONA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel-এ VELONA_API_KEY খুঁজে পাওয়া যায়নি।' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'পোস্টারের বিবরণ বা প্রম্পট দেওয়া আবশ্যক।' });
  }

  // পোস্টার ও বিজ্ঞাপনের জন্য এআই প্রম্পট কাঠামো
  let finalPrompt = prompt;
  if (templateType === 'ad_poster') {
    finalPrompt = `Ultra-detailed commercial 3D marketing advertising poster banner for: "${prompt}". Glossy embossed royal purple, deep violet and reflective metallic golden 3D typography, cinematic lighting, 8k render, octane render style, professional marketing print graphic composition.`;
  } else if (templateType === 'shop_offer') {
    finalPrompt = `3D promotional discount retail banner for: "${prompt}". Vibrant commercial colors, bold retail badges, modern flyer layout.`;
  }

  try {
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
        size: "1024x1024"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || data.message || JSON.stringify(data);
      return res.status(response.status).json({ error: `ইমেজ গেটওয়ে এরর: ${errMsg}` });
    }

    const imageUrl = data.data?.[0]?.url || data.output_url || data.url || '';

    if (!imageUrl) {
      return res.status(500).json({ error: 'সার্ভার থেকে ছবির কোনো URL পাওয়া যায়নি।' });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message });
  }
}
