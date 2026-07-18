import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const body = await req.json();
    const { transactions, monthTotals, categoryBudgets, incomeMonthly, monthsTouched } = body ?? {};
    if (!Array.isArray(transactions)) {
      return new Response(JSON.stringify({ error: 'transactions[] required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Compact transactions to keep prompt small
    const compact = transactions.slice(0, 400).map((t: any) => ({
      d: t.date, m: t.merchant?.slice(0, 40) || '', a: Math.round(t.amount), c: t.category?.slice(0, 30) || '',
    }));

    const system = `You are a financial coach reviewing recent expenses. Be concise, specific, and actionable.
Output STRICT JSON only with this shape:
{
  "headline": "one sentence summary",
  "vsPlan": [{"category":"...","actual":123,"budget":100,"deltaPct":23,"status":"over|under|ok"}],
  "wasteFlags": [{"pattern":"e.g. subscriptions, dining","impact":123,"note":"specific example"}],
  "topCuts": [{"where":"specific merchant/category","savePerMonth":123,"why":"one line"}],
  "positive": "one sentence"
}
Focus on where the user overspent vs plan and top 3 cuts. Do NOT invent numbers not in the data.`;

    const user = JSON.stringify({
      monthsTouched, monthlyIncomeUSD: incomeMonthly, categoryBudgetsUSD: categoryBudgets,
      monthTotalsByCategory: monthTotals, sampleTransactions: compact,
    });

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('AI gateway error', res.status, errText);
      return new Response(JSON.stringify({ error: 'AI request failed', status: res.status, details: errText }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '{}';
    let insights: any = {};
    try { insights = JSON.parse(text); } catch { insights = { headline: text }; }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
