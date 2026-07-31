import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  // Setup CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'online', 
      message: 'AI analysis endpoint is online. Send a POST request with budget statistics to generate insights.' 
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    income,
    currentWeekSpent,
    budgetLimit,
    categoryTotals,
    unusualSpends,
    smallPurchasesTotal,
    smallPurchasesCount
  } = req.body;

  // Basic validation
  if (currentWeekSpent === undefined || budgetLimit === undefined) {
    return res.status(400).json({ error: 'Missing required budget statistics.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Gemini API key is not configured on the server. AI insights are offline.' 
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `
You are "Antigravity AI", a friendly, empathetic personal money coach. Explain what happened in plain language.
Here is the aggregate financial data calculated locally by the user's device for the current week:
- Preferred Currency: ${req.body.currency || '$'}
- Approximate Income: ${income || 'Not provided'}
- Weekly Flexible Limit: ${budgetLimit}
- Total Spent This Week: ${currentWeekSpent}
- Spending by Category: ${JSON.stringify(categoryTotals)}
- Unusual Spends Detected: ${JSON.stringify(unusualSpends)}
- Micro-transactions (<$10): ${smallPurchasesCount} purchases totaling ${smallPurchasesTotal}

Provide:
1. A concise 2-3 sentence summary explaining how they are pacing.
2. 2-3 specific, actionable recommendations to dial back or maintain good habits.
3. A short, encouraging savings insight.

You MUST respond strictly in the following JSON format:
{
  "summary": "Short explanation of weekly pacing.",
  "recommendations": [
    "Specific advice 1",
    "Specific advice 2"
  ],
  "savingsInsight": "Tips to improve savings."
}

Do not include any markdown backticks, code blocks, or extra text.
    `;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    
    // Parse to ensure valid JSON format
    const parsedData = JSON.parse(textResponse.trim());
    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error('[AI-Analyze] Server error:', error);
    return res.status(500).json({ error: 'AI analysis failed: ' + error.message });
  }
}
