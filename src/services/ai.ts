const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface AIAnalysisResult {
  summary: string;
  recommendations: string[];
  savingsInsight: string;
}

export interface AIAssistantResult {
  reply: string;
  warningCode: 'BUDGET_EXCEEDED' | 'OK';
}

/**
 * Trigger weekly AI analysis based on locally computed aggregate metrics.
 */
export async function generateWeeklyAIAnalysis(params: {
  currency: string;
  income: number;
  currentWeekSpent: number;
  budgetLimit: number;
  categoryTotals: Record<string, number>;
  unusualSpends: string[];
  smallPurchasesTotal: number;
  smallPurchasesCount: number;
}): Promise<AIAnalysisResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout guard

  try {
    const response = await fetch(`${BASE_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate schema fields
    if (!data.summary || !Array.isArray(data.recommendations) || !data.savingsInsight) {
      throw new Error('Invalid JSON schema returned by AI service.');
    }

    return data as AIAnalysisResult;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn('[AI Service] generateWeeklyAIAnalysis request failed:', error.message);
    throw new Error(
      'AI insights are unavailable right now. Your expenses are still saved and your budget calculations continue to work.'
    );
  }
}

/**
 * Ask the AI assistant a direct question using current local budgeting aggregates as context.
 */
export async function askAIAssistant(
  query: string,
  context: {
    currency: string;
    budgetRemaining: number;
    safeToSpendToday: number;
    savingsGoalProgress: number;
    categories: Record<string, number>;
  }
): Promise<AIAssistantResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout guard

  try {
    const response = await fetch(`${BASE_URL}/api/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, context }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.reply || !data.warningCode) {
      throw new Error('Invalid JSON schema returned by AI assistant.');
    }

    return data as AIAssistantResult;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn('[AI Service] askAIAssistant request failed:', error.message);
    throw new Error(
      'AI insights are unavailable right now. Your expenses are still saved and your budget calculations continue to work.'
    );
  }
}
