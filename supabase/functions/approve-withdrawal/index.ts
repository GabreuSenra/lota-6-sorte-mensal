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
    const { transactionId } = await req.json();
    if (!transactionId) {
      return new Response(JSON.stringify({ error: 'transactionId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Client with admin JWT to verify admin status
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin permission using DB function
    const { data: isAdmin, error: adminErr } = await supabaseUser.rpc('is_admin');
    if (adminErr || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client for privileged writes (bypass RLS after explicit admin check)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Load transaction
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .select('id, user_id, amount, status, type')
      .eq('id', transactionId)
      .single();

    if (txErr || !tx) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (tx.type !== 'withdrawal' || tx.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Invalid transaction state' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get profile PIX key
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('pix_key')
      .eq('user_id', tx.user_id)
      .single();

    if (profErr || !profile?.pix_key) {
      return new Response(JSON.stringify({ error: 'User PIX key not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check wallet balance
    const { data: wallet, error: walletErr } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', tx.user_id)
      .single();

    if (walletErr || !wallet) {
      return new Response(JSON.stringify({ error: 'Wallet not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (Number(wallet.balance) < Number(tx.amount)) {
      // Mark as failed due to insufficient funds
      await supabase
        .from('transactions')
        .update({ status: 'failed', description: 'Saldo insuficiente para saque' })
        .eq('id', transactionId);

      return new Response(JSON.stringify({ error: 'Insufficient user balance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1) Debit wallet
    const newBalance = Number(wallet.balance) - Number(tx.amount);
    const { error: debitErr } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', tx.user_id);

    if (debitErr) {
      return new Response(JSON.stringify({ error: 'Failed to debit wallet' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Mark transaction as completed and add PIX info to description
    const { error: updErr } = await supabase
      .from('transactions')
      .update({ status: 'completed', description: `Saque aprovado e PIX enviado para a chave: ${profile.pix_key}` })
      .eq('id', transactionId);

    if (updErr) {
      // Try to rollback wallet debit
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance })
        .eq('user_id', tx.user_id);

      return new Response(JSON.stringify({ error: 'Failed to update transaction' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3) Notify user and admins
    await supabase.from('notifications').insert({
      user_id: tx.user_id,
      target_role: 'admin',
      type: 'withdrawal_approved',
      title: 'Saque aprovado',
      message: `Saque de R$ ${Number(tx.amount).toFixed(2)} aprovado. PIX enviado para ${profile.pix_key}.`,
      data: { transaction_id: tx.id, amount: tx.amount, pix_key: profile.pix_key }
    });

    return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in approve-withdrawal function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});