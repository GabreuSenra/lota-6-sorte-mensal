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
    const { amount } = await req.json();
    
    // Validate input
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount < 10) {
      return new Response(
        JSON.stringify({ error: 'Minimum withdrawal amount is R$ 10.00' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile and wallet in a single query for atomicity
    const { data: profile } = await supabase
      .from('profiles')
      .select('pix_key')
      .eq('user_id', user.id)
      .single();

    if (!profile?.pix_key) {
      return new Response(
        JSON.stringify({ error: 'PIX key required. Please update your profile.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (!wallet || wallet.balance < amount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'withdrawal')
      .eq('status', 'pending');

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return new Response(
        JSON.stringify({ error: 'You already have a pending withdrawal request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create withdrawal transaction record (pending admin approval)
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'withdrawal',
        amount: amount,
        status: 'pending',
        description: `Solicitação de saque via PIX: ${profile.pix_key}`,
      });

    if (transactionError) {
      console.error('Error creating withdrawal transaction:', transactionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create withdrawal request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Withdrawal request created for user ${user.id}, amount: ${amount}, PIX: ${profile.pix_key}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Withdrawal request created successfully. It will be processed within 24 hours.',
        amount: amount,
        pix_key: profile.pix_key
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-withdrawal function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});