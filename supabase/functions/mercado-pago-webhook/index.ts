import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Mercado Pago webhook received:', JSON.stringify(body, null, 2));

    // Mercado Pago sends different types of notifications
    if (body.type !== 'payment') {
      console.log('Ignoring non-payment notification');
      return new Response('OK', { status: 200 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.error('No payment ID in webhook');
      return new Response('No payment ID', { status: 400 });
    }

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN not configured');
      return new Response('Payment system not configured', { status: 500 });
    }

    // Get payment details from Mercado Pago
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!paymentResponse.ok) {
      console.error('Failed to get payment details from Mercado Pago');
      return new Response('Failed to get payment details', { status: 500 });
    }

    const payment = await paymentResponse.json();
    console.log('Payment details:', JSON.stringify(payment, null, 2));

    // Only process approved payments
    if (payment.status !== 'approved') {
      console.log(`Payment ${paymentId} status is ${payment.status}, not processing`);
      return new Response('OK', { status: 200 });
    }

    const userId = payment.external_reference;
    if (!userId) {
      console.error('No user ID in payment external_reference');
      return new Response('No user ID', { status: 400 });
    }

    // Create Supabase client with service role key for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if this payment was already processed
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('payment_id', paymentId.toString())
      .eq('status', 'completed')
      .single();

    if (existingTransaction) {
      console.log(`Payment ${paymentId} already processed`);
      return new Response('Already processed', { status: 200 });
    }

    // Start transaction to ensure atomicity
    const amount = payment.transaction_amount;

    // Update wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError) {
      console.error('Error getting wallet:', walletError);
      return new Response('Wallet error', { status: 500 });
    }

    const newBalance = (wallet.balance || 0) + amount;
    
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateWalletError) {
      console.error('Error updating wallet balance:', updateWalletError);
      return new Response('Failed to update wallet', { status: 500 });
    }

    // Update transaction status
    const { error: transactionError } = await supabase
      .from('transactions')
      .upsert({
        user_id: userId,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        description: `Depósito PIX aprovado - MP ID: ${paymentId}`,
        payment_id: paymentId.toString(),
      }, { 
        onConflict: 'payment_id',
        ignoreDuplicates: false 
      });

    if (transactionError) {
      console.error('Error updating transaction:', transactionError);
      // Try to rollback wallet update
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance })
        .eq('user_id', userId);
      
      return new Response('Transaction error', { status: 500 });
    }

    console.log(`Successfully processed payment ${paymentId} for user ${userId}, amount: ${amount}`);
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error in mercado-pago-webhook function:', error);
    return new Response('Internal server error', { status: 500 });
  }
});