// api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড সমর্থিত।' });
  }

  const { prompt, templateType } = req.body;
  const apiKey = "key_live_20260915_85b14a4c0cec48da612a8bd1bc4ccfa1";

  if (!prompt) {
    return res.status(400).json({ error: 'পোস্টারের বিবরণ আবশ্যক।' });
  }

  // কমার্শিয়াল পোস্টার প্রম্পট
  const finalPrompt = `A dynamic commercial advertising poster flyer for: "${prompt}". Category: ${templateType || 'general'}. Bold 3D typography headers, crisp legible Bengali and English lettering, modern commercial product graphics, rich vibrant colors with neon accents, discount badge ribbons, bottom contact info bar with phone numbers. Vertical full-bleed poster design (9:16), octane render, highly detailed, edge to edge composition, no picture frames, no wall mockups.`;

  try {
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
      const errMsg = data.error?.message || data.message || data.detail || JSON.stringify(data);
      return res.status(response.status).json({
        error: `Velona এরর: ${errMsg}`
      });
    }

    const imageUrl = 
      data.data?.[0]?.url || 
      data.output_url || 
      data.output || 
      data.images?.[0]?.url || 
      data.url || 
      '';

    if (!imageUrl) {
      return res.status(500).json({ 
        error: 'Velona থেকে ছবির লিংক পাওয়া যায়নি: ' + JSON.stringify(data) 
      });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ 
      error: 'সার্ভার সমস্যা: ' + error.message 
    });
  }
}
