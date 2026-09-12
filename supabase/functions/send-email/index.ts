import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  to: string
  subject: string
  html: string
  reply_to?: string
}

function buildTicketHtml(data: {
  store_name: string
  order_number: string
  order_date: string
  order_items: string
  subtotal: string
  tax: string
  total: string
  payment_method: string
  receipt_html: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f6fa;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;border:1px solid #e2e5ee;padding:32px;text-align:center;">
      <h1 style="margin:0 0 8px;font-size:20px;color:#0a0b0d;">${data.store_name}</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#7a8194;">Ticket de compra</p>

      <div style="background:#f5f6fa;border-radius:8px;padding:16px;margin-bottom:24px;text-align:left;">
        <p style="margin:0 0 4px;font-size:13px;color:#7a8194;">Pedido</p>
        <p style="margin:0 0 12px;font-size:15px;color:#0a0b0d;font-weight:600;">${data.order_number}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#7a8194;">Fecha</p>
        <p style="margin:0 0 12px;font-size:15px;color:#0a0b0d;">${data.order_date}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#7a8194;">Método de pago</p>
        <p style="margin:0;font-size:15px;color:#0a0b0d;">${data.payment_method}</p>
      </div>

      <div style="text-align:left;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#7a8194;text-transform:uppercase;letter-spacing:0.05em;">Artículos</p>
        <pre style="margin:0;font-size:13px;color:#0a0b0d;font-family:monospace;white-space:pre-wrap;line-height:1.6;">${data.order_items}</pre>
      </div>

      <div style="border-top:1px dashed #e2e5ee;padding-top:16px;text-align:left;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:13px;color:#7a8194;">Subtotal</span>
          <span style="font-size:13px;color:#0a0b0d;">${data.subtotal}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:13px;color:#7a8194;">IVA</span>
          <span style="font-size:13px;color:#0a0b0d;">${data.tax}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:0;">
          <span style="font-size:15px;color:#0a0b0d;font-weight:700;">Total</span>
          <span style="font-size:15px;color:#00c853;font-weight:700;">${data.total}</span>
        </div>
      </div>

      <div style="border-top:1px dashed #e2e5ee;margin-top:24px;padding-top:16px;">
        <p style="margin:0;font-size:12px;color:#7a8194;">Gracias por su compra</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

function buildInvitationHtml(data: {
  tenant_name: string
  invited_by: string
  invite_link: string
  role_label: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f6fa;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;border:1px solid #e2e5ee;padding:32px;text-align:center;">
      <h1 style="margin:0 0 8px;font-size:20px;color:#0a0b0d;">${data.tenant_name}</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#7a8194;">Invitación para unirse al equipo</p>

      <div style="background:#f5f6fa;border-radius:8px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:14px;color:#0a0b0d;">
          <strong>${data.invited_by}</strong> te ha invitado a unirte como
        </p>
        <p style="margin:0 0 16px;font-size:16px;color:#00c853;font-weight:700;">${data.role_label}</p>
        <a href="${data.invite_link}"
           style="display:inline-block;background:#00c853;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          Aceptar invitación
        </a>
      </div>

      <p style="margin:0;font-size:12px;color:#7a8194;">
        Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
        <a href="${data.invite_link}" style="color:#0091ea;word-break:break-all;">${data.invite_link}</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const senderEmail = Deno.env.get('SENDER_EMAIL')
    const senderName = Deno.env.get('SENDER_NAME') || 'Casa Lis'

    if (!senderEmail) {
      return new Response(JSON.stringify({ error: 'SENDER_EMAIL not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const payload: EmailPayload & { type?: string; template_data?: Record<string, string> } = await req.json()

    const { to, subject, html, reply_to, type, template_data } = payload

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let finalHtml = html

    if (type === 'ticket' && template_data) {
      finalHtml = buildTicketHtml({
        store_name: template_data.store_name || '',
        order_number: template_data.order_number || '',
        order_date: template_data.order_date || '',
        order_items: template_data.order_items || '',
        subtotal: template_data.subtotal || '',
        tax: template_data.tax || '',
        total: template_data.total || '',
        payment_method: template_data.payment_method || '',
        receipt_html: template_data.receipt_html || '',
      })
    } else if (type === 'invitation' && template_data) {
      finalHtml = buildInvitationHtml({
        tenant_name: template_data.tenant_name || '',
        invited_by: template_data.invited_by || '',
        invite_link: template_data.invite_link || '',
        role_label: template_data.role_label || '',
      })
    }

    const emailBody: Record<string, unknown> = {
      from: `${senderName} <${senderEmail}>`,
      to: [to],
      subject,
      html: finalHtml,
    }

    if (reply_to) {
      emailBody.reply_to = reply_to
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailBody),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', data)
      return new Response(JSON.stringify({ error: data.message || 'Failed to send email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: res.status,
      })
    }

    return new Response(JSON.stringify({ id: data.id, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('send-email error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
