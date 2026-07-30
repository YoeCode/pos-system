import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productName, categories } = await req.json()

    if (!productName || typeof productName !== 'string') {
      return new Response(JSON.stringify({ error: 'No product name provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const model = Deno.env.get('OPENROUTER_MODEL') || 'qwen/qwen3-32b'

    const categoriesList = Array.isArray(categories) && categories.length > 0
      ? categories.join(', ')
      : 'Electronics, Food, Drinks, Apparel, Bakery, Merchandise'

    const prompt = `Producto: "${productName}"

Categorías disponibles: ${categoriesList}

Responde ÚNICAMENTE con el nombre exacto de la categoría más apropiada. Si no encaja en ninguna, responde "Merchandise". Sin explicaciones.`

    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions'

    const body = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 50,
    }

    const res = await fetch(openRouterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://casa-lis.app',
        'X-Title': 'Casa Lis POS',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      return new Response(JSON.stringify({ error: `OpenRouter API error: ${errText}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      })
    }

    const data = await res.json()
    const suggestion = (data?.choices?.[0]?.message?.content || '').trim()

    const validCategory = categories.includes(suggestion) ? suggestion : 'Merchandise'

    return new Response(JSON.stringify({ suggestion: validCategory, raw: suggestion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
