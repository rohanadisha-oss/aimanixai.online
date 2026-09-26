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

  // টেমপ্লেট ভিত্তিক আর্কিটেকচারাল নির্দেশিকা
  const templateGuides = {
    school: "School/Madrasah admission flyer with decorative golden/cyan arches, bold typography headers, campus graphics, batch badges, and bottom contact pill.",
    shop: "Retail commercial sale flyer, glossy 3D discount ribbons, promotional text, vibrant retail elements.",
    jalsha: "Islamic gathering/Jalsha poster, traditional crescent & dome art, bold speaker names, golden borders.",
    eid: "Festive Eid/Ramadan greetings flyer, golden lanterns, modern Arabic/Bengali typography, night sky.",
    politics: "Political campaign poster, leadership frame, prominent national/party branding, bold slogans.",
    custom: "Commercial modern vertical advertising poster flyer."
  };

  const styleContext = templateGuides[templateType] || templateGuides.custom;
  const imageNote = referenceImage ? "Incorporate the user uploaded subject/building cleanly into the center frame." : "Generate a photorealistic central subject.";

  try {
    // ১. Velona দিয়ে ভিডিওর স্টাইলে টাইপোগ্রাফি ও পোস্টার প্রম্পট প্রস্তুত করা
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
            content: `You are an expert commercial poster designer. Generate an image generation prompt for a 1024x1792 vertical poster. Ensure high-contrast bold 3D Bengali & English typography, vibrant badges, and full-bleed layout. Rules: NO wall, NO picture frames, full edge-to-edge coverage.`
          },
          {
            role: "user",
            content: `Design flyer for: "${prompt}". Style: ${styleContext}. ${imageNote}`
          }
        ]
      })
    });

    const velonaData = await velonaResponse.json();
    let imagePrompt = velonaData.data?.output || velonaData.output || velonaData.choices?.[0]?.message?.content || prompt;
    imagePrompt = imagePrompt.replace(/[\r\n]+/g, ' ').trim();

    // ২. উল্লম্ব পোস্টার রেন্ডার (1024x1792)
    const encodedPrompt = encodeURIComponent(imagePrompt);
    const width = 1024;
    const height = 1792;
    const seed = Math.floor(Math.random() * 9999999);

    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true`;

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ error: 'সার্ভার সমস্যা: ' + error.message });
  }
}
