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

  try {
    // ১. বাংলা ইনপুটকে Velona দিয়ে নিখুঁত কমার্শিয়াল প্রম্পটে অনুবাদ ও রূপান্তর
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
            content: `You are a professional advertising poster art director. 
Translate and transform the user's input into a highly detailed English image prompt for a vertical commercial banner (1024x1792).
Strict rules:
1. Always describe the core products prominently (e.g., luxury stylish shoes on floating glossy display shelves, retail store interior).
2. Include rich advertising graphics: bold 3D promotional typography, percentage discount badges, glowing neon accents, elegant store lighting.
3. NEVER return an empty room or plain background wall. Fill the entire canvas with dynamic commercial products and marketing elements.
4. Output only the final prompt text without quotes or markdown.`
          },
          {
            role: "user",
            content: `Create a commercial poster for this: "${prompt}". Category: ${templateType || 'shop'}`
          }
        ]
      })
    });

    const velonaData = await velonaResponse.json();
    let refinedPrompt = velonaData.data?.output || velonaData.output || velonaData.choices?.[0]?.message?.content || prompt;

    // ফুল-ব্লিড কমার্শিয়াল ফিল্টার যুক্ত করা
    const finalPrompt = `${refinedPrompt}, ultra realistic commercial advertising poster, floating shoes display, 3d sale badges, neon purple aesthetic, octane render 8k, edge to edge composition, no empty wall`.replace(/[\r\n]+/g, ' ').trim();

    const encodedPrompt = encodeURIComponent(finalPrompt);
    const width = 1024;
    const height = 1792;
    const seed = Math.floor(Math.random() * 9999999);

    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true`;

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ error: 'সার্ভার সমস্যা: ' + error.message });
  }
}
