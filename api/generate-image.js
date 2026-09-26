// api/generate-image.js

// ২ মিনিট (১২০ সেকেন্ড) টাইমআউট কনফিগারেশন
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

  // পোস্টার তৈরির বিস্তারিত প্রম্পট
  const posterPrompt = `Create a high quality vertical commercial advertising poster (portrait 9:16 layout) for: "${prompt}". Category: ${templateType || 'general'}. Clean 3D bold embossed typography, realistic graphics, vibrant lighting, modern badge ribbons, bottom contact strip with clear phone number. Full-bleed edge to edge design, highly detailed, no picture frame mockup, no wall mockup.`;

  // Velona রিকোয়েস্ট কনটেন্ট
  const userContent = [];
  userContent.push({ type: "text", text: posterPrompt });
  
  if (referenceImage) {
    userContent.push({
      type: "image_url",
      image_url: { url: referenceImage }
    });
  }

  try {
    // Velona-র তালিকাভুক্ত Gemini 2.5 Flash Image মডেল
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

    if (!response.ok) {
      const errMsg = data.error?.message || data.message || JSON.stringify(data);
      return res.status(response.status).json({
        error: `Velona এরর: ${errMsg}`
      });
    }

    // রেসপন্স থেকে ছবির লিঙ্ক বা Base64 ডাটা বের করা
    let rawOutput = data.data?.output || data.output || "";
    
    // যদি Markdown ফরম্যাটে ছবি আসে (![image](url))
    const mdMatch = rawOutput.match(/!\[.*?\]\((.*?)\)/);
    let imageUrl = mdMatch ? mdMatch[1] : rawOutput;

    // যদি সরাসরি URL না হয়ে কোনো অবজেক্ট থাকে
    if (!imageUrl && data.data?.images?.[0]) {
      imageUrl = data.data.images[0].url || data.data.images[0];
    }

    if (!imageUrl || imageUrl.length < 5) {
      return res.status(500).json({ 
        error: 'Velona থেকে ছবির ডাটা পাওয়া যায়নি: ' + JSON.stringify(data) 
      });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ 
      error: 'সার্ভার সমস্যা: ' + error.message 
    });
  }
}
