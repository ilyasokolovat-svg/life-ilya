import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { categories, recentMonths, incomeMonthly, nextMonth, notes } = body ?? {};
    if (!Array.isArray(categories) || !Array.isArray(recentMonths)) {
      return new Response(JSON.stringify({ error: 'categories[] and recentMonths[] required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const system = `You are a pragmatic personal-finance planner. Given a user's recent monthly spending per category, their average monthly income, and their current planned budget per category, propose a realistic budget for the UPCOMING month.

Rules:
- Total suggested spend MUST be <= incomeMonthly. Aim for total <= 90% of incomeMonthly so the user saves.
- Prioritize non-negotiables (Rent, Housing, Utilities, Groceries, Transport, Insurance, Loans, Debt, Health, Childcare, Education) — keep close to recent averages, do not slash them.
- Trim "nice-to-haves" (Dining, Entertainment, Subscriptions, Shopping, Travel, Alcohol, Coffee) where recent months trended above the plan.
- Base suggestions on recent averages (weight the most recent month slightly more) — never invent numbers not implied by the data.
- Round to nearest $10.
- Every suggestion needs a one-line "why" (e.g. "avg $420, trimmed 15% — recent overspend on dining").
- Also return a short overall "summary" and a "totalCut" number.

Output STRICT JSON only:
{
  "summary": "one sentence overview",
  "incomeAssumed": 12345,
  "totalSuggested": 10000,
  "totalCut": 500,
  "suggestions": [
    {"category":"Dining","currentBudget":600,"recentAvg":720,"suggested":550,"priority":"nice-to-have","why":"..."}
  ]
}`;

    const user = JSON.stringify({
      nextMonth,
      incomeMonthly,
      categories, // [{label, currentBudget}]
      recentMonths, // [{month, byCategory: {label: amount}}]
      notes: notes ?? '',
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
    let plan: any = {};
    try { plan = JSON.parse(text); } catch { plan = { summary: text, suggestions: [] }; }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
