import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { amount, description } = await req.json();
    // Validate input
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({
        error: 'Invalid amount'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (amount < 5) {
      return new Response(JSON.stringify({
        error: 'Minimum amount is R$ 5.00'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Authorization header required'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: 'Invalid user'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get user profile for email
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN not configured');
      return new Response(JSON.stringify({
        error: 'Payment system not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Create PIX payment with Mercado Pago
    const paymentData = {
      transaction_amount: amount,
      description: description || `Depósito na carteira - ${profile?.full_name || user.email}`,
      payment_method_id: 'pix',
      payer: {
        email: user.email,
        first_name: profile?.full_name?.split(' ')[0] || 'Usuario',
        last_name: profile?.full_name?.split(' ').slice(1).join(' ') || 'Loteria',
        identification: {
          type: 'CPF',
          number: profile?.cpf // In production, get from user profile
        }
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-pago-webhook`,
      external_reference: user.id
    };
    console.log('Creating PIX payment:', JSON.stringify(paymentData, null, 2));
    // Gera uma chave única por requisição
    const idempotencyKey = crypto.randomUUID();
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(paymentData)
    });
    const responseData = await response.json();
    console.log('Mercado Pago response:', JSON.stringify(responseData, null, 2));
    if (!response.ok) {
      console.error('Mercado Pago API error:', responseData);
      return new Response(JSON.stringify({
        error: 'Failed to create payment',
        details: responseData
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Create pending transaction record
    const { error: transactionError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'deposit',
      amount: amount,
      status: 'pending',
      description: `Depósito PIX - MP ID: ${responseData.id}`,
      payment_id: responseData.id?.toString()
    });
    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
    }
    // Return PIX QR code and copy-paste code
    return new Response(JSON.stringify({
      payment_id: responseData.id,
      qr_code: responseData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: responseData.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: responseData.point_of_interaction?.transaction_data?.ticket_url,
      amount: amount,
      status: responseData.status,
      expires_at: responseData.date_of_expiration
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in create-pix-payment function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
