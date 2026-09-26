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

  // পোস্টার থিম ও প্রম্পট
  let baseTheme = '';
  if (templateType === 'ad_poster') {
    baseTheme = "School, Madrasah, or Institution vertical banner in rich royal purple, violet gradient, golden glowing borders, clean modern Bengali and English fonts, ultra sharp 8k marketing design.";
  } else if (templateType === 'shop_offer') {
    baseTheme = "Commercial shop promotional sale banner, neon magenta and deep purple background, 3D golden badges, modern typography.";
  } else {
    baseTheme = "Vertical commercial advertising poster flyer, dark royal purple background, golden borders, 3D typography.";
  }

  try {
    // ১. Velona-র 'turns' নিয়ম হুবহু পূরণ করা
    const velonaResponse = await fetch("https://velona.in/gateway/v1/inference/run", {
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
            content: "You are an expert AI image prompt engineer for commercial vertical advertising posters (1024x1792 portrait). Return only a concise, highly visual English description focusing on colors, 3D typography, and background lighting. Do not add markdown or quotes."
          },
          {
            role: "user",
            content: `Create an image prompt for: "${prompt}". Style: ${baseTheme}`
          }
        ]
      })
    });

    const velonaData = await velonaResponse.json();

    if (!velonaResponse.ok) {
      const errMsg = velonaData.error?.message || velonaData.message || JSON.stringify(velonaData);
      return res.status(velonaResponse.status).json({
        error: `Velona এরর: ${errMsg}`
      });
    }

    let refinedPrompt = velonaData.data?.output || velonaData.output || velonaData.choices?.[0]?.message?.content || prompt;
    refinedPrompt = refinedPrompt.replace(/[\r\n]+/g, ' ').trim();

    // ২. প্রাপ্ত প্রম্পট থেকে সরাসরি ১০২৪x১৭৯২ সাইজের পোস্টার রেন্ডার
    const encodedPrompt = encodeURIComponent(refinedPrompt);
    const width = 1024;
    const height = 1792;
    const seed = Math.floor(Math.random() * 1000000);

    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true`;

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({
      error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message
    });
  }
}
