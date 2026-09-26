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

  // ChatGPT-র মতো সুনির্দিষ্ট DALL-E 3 টাইপোগ্রাফি আর্কিটেকচার
  const finalPrompt = `A professional commercial advertising poster flyer for: "${prompt}". Category: ${templateType || 'general'}. Clean 3D bold typography, sharp Bengali & English lettering, modern institutional graphics, computer tech elements, vibrant color ribbons, and a bottom contact badge with visible phone numbers. Vertical full-bleed poster design, 8k resolution, edge to edge composition, no picture frames, no wall mockups.`;

  try {
    // Velona-র অফিসিয়াল DALL-E 3 রেন্ডার এন্ডপয়েন্ট
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
      return res.status(response.status).json({
        error: `Velona এরর: ${errMsg}`
      });
    }

    // Velona DALL-E 3 আউটপুট লিঙ্ক
    const imageUrl = 
      data.data?.[0]?.url || 
      data.images?.[0]?.url || 
      data.output_url || 
      data.output || 
      data.url || 
      '';

    if (!imageUrl) {
      return res.status(500).json({ 
        error: 'ছবির লিঙ্ক পাওয়া যায়নি: ' + JSON.stringify(data) 
      });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ 
      error: 'সার্ভার সমস্যা: ' + error.message 
    });
  }
}