import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function detectMimeType(bytes: Uint8Array): string {
  if (bytes.length < 4) return 'application/octet-stream'
  const header = bytes.slice(0, 4)
  const hex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('')
  if (hex.startsWith('ffd8ff')) return 'image/jpeg'
  if (hex.startsWith('89504e47')) return 'image/png'
  if (hex.startsWith('47494638')) return 'image/gif'
  if (hex.startsWith('52494646') || hex.startsWith('57454250')) return 'image/webp'
  if (hex.startsWith('424d')) return 'image/bmp'
  if (hex.startsWith('25504446')) return 'application/pdf'
  return 'application/octet-stream'
}

async function tryVisionModel(
  base64: string,
  mimeType: string,
  apiKey: string,
  model: string,
  tenantId: string
): Promise<Response> {
  const prompt = `Eres un sistema OCR experto para albaranes de entrega. Analiza esta imagen de un albarán digital.

INSTRUCCIONES CRÍTICAS PARA ALBARANES DIGITALES CON TABLAS DE TALLAS:
1. Este es un albarán de textiles/ropa de cama. Los productos tienen MÚLTIPLES TALLAS/MEDIDAS.
2. Cada producto principal tiene: código, nombre/descripción, y una tabla con tallas y cantidades.
3. Extrae CADA producto principal como UNA línea. IGNORA las filas individuales de tallas.
4. La cantidad total de un producto es la SUMA de todas las cantidades de sus tallas.
5. El precio de coste es el precio promedio de las tallas, o usa el precio base más común.

FORMATO DE SALIDA (SOLO JSON):
{
  "items": [
    {
      "nombre": "Edredón comforter invierno, 266 color Nude",
      "cantidad": 8,
      "precioCoste": 28.75,
      "marca": null,
      "referenciaProveedor": "EDG266 02 / 02"
    }
  ],
  "proveedor": "Nombre del proveedor del documento",
  "fecha": null,
  "numeroAlbaran": "Número de documento",
  "error": null
}

Si no puedes leer nada, devuelve:
{
  "items": [],
  "proveedor": null,
  "fecha": null,
  "numeroAlbaran": null,
  "error": "No se pudo extraer datos de esta imagen"
}`

  const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions'

  const body = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 4096,
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
    return new Response(
      JSON.stringify({ error: `OpenRouter API error (${model}): ${errText}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
    )
  }

  const data = await res.json()
  const textResponse = data?.choices?.[0]?.message?.content || ''

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(textResponse)
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to parse model response', raw: textResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }

  return new Response(JSON.stringify({ ...parsed, tenantId, model }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const tenantId = formData.get('tenantId') as string | null

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
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

    const bytes = new Uint8Array(await file.arrayBuffer())
    if (bytes.length > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum 10MB.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const mimeType = file.type || detectMimeType(bytes)
    if (mimeType === 'application/pdf' || !mimeType.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: `Unsupported file type: ${mimeType}. Only images are supported.` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const base64 = (() => {
      const chunkSize = 0x8000
      const parts: string[] = []
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize)
        parts.push(String.fromCharCode(...chunk))
      }
      return btoa(parts.join(''))
    })()

    const primaryModel = Deno.env.get('VISION_MODEL_PRIMARY') || 'qwen/qwen2.5-vl-72b-instruct'
    const fallbackModel = Deno.env.get('VISION_MODEL_FALLBACK') || 'meta-llama/llama-4-maverick-17b-128e-instruct'

    const primaryRes = await tryVisionModel(base64, mimeType, apiKey, primaryModel, tenantId || '')
    if (primaryRes.status === 200) {
      const body = await primaryRes.clone().json()
      if (body.items && Array.isArray(body.items) && body.items.length > 0) {
        return primaryRes
      }
    }

    console.log(`Primary model ${primaryModel} failed or returned empty, trying fallback ${fallbackModel}`)
    return await tryVisionModel(base64, mimeType, apiKey, fallbackModel, tenantId || '')
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
