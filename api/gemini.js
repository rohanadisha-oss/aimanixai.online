// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'শুধুমাত্র POST মেথড অনুমোদিত।' });
  }

  const { prompt, systemInstruction } = req.body;
  const apiKey = "key_live_20260915_85b14a4c0cec48da612a8bd1bc4ccfa1";

  try {
    // আগের রয়্যাল ভায়োলেট এবং গোল্ডেন থিমের হুবহু আর্কিটেকচার
    const masterDesignPrompt = `
তুমি একজন বিশ্বমানের বাংলা শিক্ষাবিদ ও প্রিমিয়াম স্টাডি শিট ডিজাইনার।
তোমার কাজ হলো ইনপুটের বিষয়বস্তু বিশ্লেষণ করে একটি সম্পূর্ণ, নিখুঁত এবং রেডি-টু-প্রিন্ট A4 সাইজের বাংলা স্টাডি বুকলেট তৈরি করা।

ডিজাইন ও আর্কিটেকচার নির্দেশিকা (কঠোরভাবে মেনে চলবে):
১. ফন্ট: প্রধান পাঠ্যের জন্য 'Hind Siliguri' এবং শিরোনামের জন্য 'Noto Serif Bengali' ব্যবহার করবে। ফন্ট লোড করার জন্য Google Fonts লিঙ্ক (<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&family=Noto+Serif+Bengali:wght@600;700;800&display=swap" rel="stylesheet">) আউটপুটের শুরুতে নিশ্চিত করবে।
২. কালার প্যালেট (রয়্যাল ভায়োলেট ও গোল্ডেন প্রিমিয়াম):
   - মূল হেডার ও অ্যাকসেন্ট: গাঢ় রয়্যাল ভায়োলেট গ্র্যাডিয়েন্ট (linear-gradient(135deg, #2e0854, #581c87))
   - সাব-হেডিং ও হাইলাইট: উজ্জ্বল সোনালী বর্ডার ও গোল্ডেন টেক্সট (#d97706, #b45309, #f59e0b)
   - ব্যাকগ্রাউন্ড: মার্জিত ও পরিচ্ছন্ন অফ-হোয়াইট/সফট পেপার (#fcfbf9)
   - কার্ড ও প্রশ্নোত্তরের বাক্স: হালকা ভায়োলেট বর্ডার সমৃদ্ধ শ্যাডো কার্ড (border: 1px solid rgba(139, 92, 246, 0.25); background: #ffffff; border-radius: 12px;)
৩. বিন্যাস ও উপস্থাপনা:
   - শুরুতে একটি রাজকীয় হেডার ব্লক (শ্রেণী, বিষয়, অধ্যায় ও পাঠ্য পরিচিতি সহ)।
   - মূল সারাংশ বা টেক্সট বিশ্লেষণ।
   - শব্দার্থ ও টীকা (যদি থাকে) সুন্দর ২-কলাম বা ৩-কলামের টেবিলে।
   - সম্ভাব্য গুরুত্বপূর্ণ প্রশ্নোত্তর (পয়েন্ট আকারে, নম্বর দিয়ে পরিচ্ছন্নভাবে)।
   - শেষ প্রান্তে একটি মার্জিত গোল্ডেন ফুটার।
৪. আউটপুট ফরম্যাট: কোনো ব্যাখ্যা বা অতিরিক্ত কথা লিখবে না। সরাসরি কাজ করার মতো পূর্ণাঙ্গ, স্বয়ংসম্পূর্ণ HTML কোড দেবে (ইনলাইন CSS সহ)। কোনো ব্যাকটিক (\`\`\`html) দেবে না।
`;

    const effectiveInstruction = systemInstruction 
      ? `${systemInstruction}\n\n${masterDesignPrompt}` 
      : masterDesignPrompt;

    const response = await fetch("https://velona.in/gateway/v1/inference/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        turns: [
          { role: "system", content: effectiveInstruction },
          { role: "user", content: prompt }
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

    let outputText = data.data?.output || data.output || data.choices?.[0]?.message?.content || '';

    // অপ্রয়োজনীয় মার্কডাউন বা ব্যাকটিক দূর করা
    outputText = outputText.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    return res.status(200).json({ output: outputText });

  } catch (error) {
    return res.status(500).json({ 
      error: 'সার্ভার প্রসেসিং ব্যর্থ হয়েছে: ' + error.message 
    });
  }
}
