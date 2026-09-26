// api/generate-image.js
export const config = {
  maxDuration: 60, // Vercel ফ্রি টিয়ারের নিরাপদ সর্বোচ্চ সীমা
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

  const posterPrompt = `Generate a high quality vertical commercial advertising poster (portrait 9:16 layout) for: "${prompt}". Category: ${templateType || 'general'}. Clean 3D bold embossed typography, realistic graphics, vibrant lighting, modern badge ribbons, bottom contact strip with clear phone number. Full-bleed edge to edge design, highly detailed, no picture frame mockup, no wall mockup.`;

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

    if (!response.ok) {
      const errMsg = data.error?.message || data.message || JSON.stringify(data);
      return res.status(response.status).json({ error: `Velona এরর: ${errMsg}` });
    }

    let imageUrl = "";

    // ১. images অ্যারে ফিল্ড চেক
    if (data.data?.images && data.data.images.length > 0) {
      imageUrl = data.data.images[0].url || data.data.images[0].image_url || data.data.images[0];
    } else if (data.images && data.images.length > 0) {
      imageUrl = data.images[0].url || data.images[0];
    } 
    // ২. artifacts বা parts চেক
    else if (data.data?.artifacts && data.data.artifacts.length > 0) {
      imageUrl = data.data.artifacts[0].url || data.data.artifacts[0].data;
    } else if (data.data?.parts && data.data.parts.length > 0) {
      const imgPart = data.data.parts.find(p => p.inline_data || p.image_url);
      if (imgPart) {
        imageUrl = imgPart.image_url?.url || (imgPart.inline_data ? `data:${imgPart.inline_data.mime_type};base64,${imgPart.inline_data.data}` : '');
      }
    }
    // ৩. টেক্সটের ভেতরে মার্কডাউন লিঙ্ক বা সরাসরি URL চেক
    else if (data.data?.output || data.output) {
      const raw = data.data?.output || data.output;
      const mdMatch = raw.match(/!\[.*?\]\((.*?)\)/);
      if (mdMatch) {
        imageUrl = mdMatch[1];
      } else if (raw.startsWith('http') || raw.startsWith('data:image')) {
        imageUrl = raw;
      }
    }

    // Base64 স্ট্রিং ফরম্যাটিং
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:image')) {
      imageUrl = `data:image/png;base64,${imageUrl}`;
    }

    if (!imageUrl) {
      return res.status(200).json({
        error: "ছবির ফিল্ড পাওয়া যায়নি",
        raw_response: data
      });
    }

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ error: 'সার্ভার সমস্যা: ' + error.message });
  }
}
