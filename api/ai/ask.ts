import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  // Setup CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, context } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing user query.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Gemini API key is not configured on the server. AI Chat is offline.' 
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `
You are "Antigravity AI", a personal budgeting assistant.
The user is asking a question about their spending: "${query}"

Here is the current financial context calculated locally on their phone:
- Currency symbol: ${context.currency || '$'}
- Weekly Flexible Budget Remaining: ${context.budgetRemaining}
- Safe to Spend Today: ${context.safeToSpendToday}
- Savings Goal Progress Rate: ${context.savingsGoalProgress || 'N/A'}
- Recent spent summaries: ${JSON.stringify(context.categories || {})}

Rules:
1. Provide a short, direct answer in 2-4 sentences max. Keep it simple and friendly.
2. Treat your output as budgeting guidance, NOT certified financial advice.
3. If they ask to spend more than they have remaining (e.g. "Can I spend $100?" when budget remaining is $40), warn them gently and set warningCode to "BUDGET_EXCEEDED". Otherwise set warningCode to "OK".

You MUST respond strictly in the following JSON format:
{
  "reply": "Your brief response to the user's question.",
  "warningCode": "BUDGET_EXCEEDED" or "OK"
}

Do not include any markdown formatting, backticks, or text outside the JSON.
    `;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();

    const parsedData = JSON.parse(textResponse.trim());
    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error('[AI-Ask] Server error:', error);
    return res.status(500).json({ error: 'AI Assistant failed: ' + error.message });
  }
}
