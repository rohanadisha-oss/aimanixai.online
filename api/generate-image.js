// api/generate-image.js
export const config = {
  maxDuration: 120,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড সমর্থিত।' });
  }

  const { prompt, templateType, referenceImage } = req.body;
  const apiKey = "key_live_20260915_85b14a4c0cec48da612a8bd1bc4ccfa1";

  if (!prompt) {
    return res.status(400).json({ error: 'পোস্টারের বিবরণ আবশ্যক।' });
  }

  const posterPrompt = `Create a high quality vertical commercial advertising poster (portrait 9:16 layout) for: "${prompt}". Category: ${templateType || 'general'}. Clean 3D bold embossed typography, realistic graphics, vibrant lighting, modern badge ribbons, bottom contact strip with clear phone number. Full-bleed edge to edge design, highly detailed, no picture frame mockup, no wall mockup.`;

  const userContent = [{ type: "text", text: posterPrompt }];
  if (referenceImage) {
    userContent.push({
      type: "image_url",
      image_url: { url: referenceImage }
    });
  }

  try {
    const response = await fetch("https://velona.in/gateway/v1/inference/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        turns: [
          {
            role: "user",
            content: userContent
          }
        ]
      })
    });

    const data = await response.json();

    // Velona কী পাঠাচ্ছে তা দেখার জন্য সরাসরি আউটপুট পরীক্ষা
    const outputVal = data.data?.output || data.output;

    if (!outputVal || outputVal === "") {
      return res.status(500).json({
        error: "Velona আউটপুট ফাঁকা এসেছে: " + JSON.stringify(data)
      });
    }

    // Markdown বা URL এক্সট্র্যাক্ট করা
    const mdMatch = typeof outputVal === 'string' ? outputVal.match(/!\[.*?\]\((.*?)\)/) : null;
    const imageUrl = mdMatch ? mdMatch[1] : outputVal;

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ 
      error: 'সার্ভার সমস্যা: ' + error.message 
    });
  }
}
