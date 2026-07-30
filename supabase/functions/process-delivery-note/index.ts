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
    const { text, tenantId } = await req.json()

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'No text provided' }), {
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

    const systemPrompt = `Eres un parser experto de albaranes de entrega. Tu única tarea es convertir texto OCR en un JSON estructurado. NUNCA expliques tu razonamiento. Responde ÚNICAMENTE con el JSON solicitado.`

    const userPrompt = `TEXTO OCR extraído de un albarán:
---
${text}
---

INSTRUCCIONES CRÍTICAS:
1. Busca UNA TABLA de productos. Suele estar entre cabeceras como "ARTICULO", "DESCRIPCION", "CANTIDAD", "PRECIO".
2. Cada línea de producto TIENE este formato aproximado:
   REFERENCIA    DESCRIPCION_DEL_PRODUCTO    CANTIDAD    PRECIO_UNITARIO    IMPORTE_TOTAL
3. IGNORA completamente líneas que contengan: TOTAL, SUMA, IMPUESTOS, ALBARAN, PEDIDO, PORTES, BULTOS, PESO, HOJA, FORMA DE PAGO, RMA DE PAGO, etc.
4. IGNORA líneas que son solo números de teléfono, direcciones, o datos del cliente.
5. La REFERENCIA del producto suele ser un código corto al inicio de la línea (ej: "A8 01 080", "SP1234", "REF-001").
6. La DESCRIPCIÓN es el texto largo en el medio (ej: "ADAPT.ANT.ALG AZUL 080X190/2").
7. La CANTIDAD suele estar seguida de "UN", "uds", "Ud.", "unidades", etc. Usa solo el número entero. Si dice "1,00 UN", cantidad = 1.
8. El PRECIO DE COSTE es el precio unitario (columna PRECIO), NO el IMPORTE TOTAL. En España usa coma decimal: "7,05" = 7.05 euros.
9. La FECHA y NÚMERO DE ALBARÁN suelen estar en la parte superior derecha.
10. El PROVEEDOR general suele aparecer arriba en el documento (nombre de la empresa emisora).

REGLAS DE EXTRACCIÓN (aplica SIEMPRE):
- Si la línea empieza con una referencia tipo "A7 05 120" o similar, y tiene texto descriptivo después, ES UN PRODUCTO.
- Extrae cada producto en un objeto con estos campos exactos.
- "cantidad" debe ser un número entero positivo.
- "precioCoste" debe ser un número con decimales (punto como separador decimal en JSON).
- "referenciaProveedor" es la referencia/código del producto en el albarán.
- "marca" del producto: si aparece una marca en la descripción, extrae la marca comercial (ej: "Nike", "Adidas", "Burrito Blanco"). Si no hay marca clara, usa null.

FORMATO OBLIGATORIO — responde SOLO con este JSON, sin texto adicional ni markdown:
{
  "items": [
    {
      "nombre": "string (descripción exacta)",
      "cantidad": 0,
      "precioCoste": 0.00,
      "marca": "string o null",
      "referenciaProveedor": "string o null"
    }
  ],
  "proveedor": "string o null (nombre de la empresa emisora)",
  "fecha": "string o null",
  "numeroAlbaran": "string o null",
  "error": null
}`

    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions'

    const body = {
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0,
      max_tokens: 8192,
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
    const textResponse = data?.choices?.[0]?.message?.content || ''

    console.log('LLM raw response:', textResponse)

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(textResponse)
    } catch {
      console.error('Failed to parse JSON. Raw response:', textResponse)
      return new Response(
        JSON.stringify({ error: 'Failed to parse model response', raw: textResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
      )
    }

    return new Response(JSON.stringify({ ...parsed, tenantId }), {
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
