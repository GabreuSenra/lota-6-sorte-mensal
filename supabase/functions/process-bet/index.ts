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
    const { chosenNumbers, contestId } = await req.json();
    // Validate input
    if (!chosenNumbers || !Array.isArray(chosenNumbers) || chosenNumbers.length !== 6) {
      return new Response(JSON.stringify({
        error: 'Deve escolher exatamente 6 números'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!contestId) {
      return new Response(JSON.stringify({
        error: 'Contest ID is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate numbers are in correct range (00-99)
    const validNumbers = chosenNumbers.every((num)=>Number.isInteger(num) && num >= 0 && num <= 99);
    if (!validNumbers) {
      return new Response(JSON.stringify({
        error: 'Números devem ser únicos e entre 0 e 99'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check for duplicates
    const uniqueNumbers = [
      ...new Set(chosenNumbers)
    ];
    if (uniqueNumbers.length !== 6) {
      return new Response(JSON.stringify({
        error: 'Números devem ser únicos'
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
    // Verify contest exists and is open
    const { data: contest, error: contestError } = await supabase.from('contests').select('status, closing_date, bet_price').eq('id', contestId).single();
    if (contestError || !contest) {
      return new Response(JSON.stringify({
        error: 'Contest not found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (contest.status !== 'open') {
      return new Response(JSON.stringify({
        error: 'Contest is not open for bets'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check if contest is still accepting bets (before closing time)
    if (contest.closing_date && new Date() > new Date(contest.closing_date)) {
      return new Response(JSON.stringify({
        error: 'Contest betting period has ended'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const betAmount = contest.bet_price; // Fixed bet amount
    // Get user wallet and verify balance
    const { data: wallet, error: walletError } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
    if (walletError) {
      console.error('Error getting wallet:', walletError);
      return new Response(JSON.stringify({
        error: 'Failed to get wallet information'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!wallet || wallet.balance < betAmount) {
      return new Response(JSON.stringify({
        error: 'Insufficient balance. Please deposit funds to your wallet.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Start atomic transaction: debit wallet and create bet
    const newBalance = wallet.balance - betAmount;
    // Update wallet balance
    const { error: updateWalletError } = await supabase.from('wallets').update({
      balance: newBalance
    }).eq('user_id', user.id).eq('balance', wallet.balance); // Optimistic locking
    if (updateWalletError) {
      console.error('Error updating wallet balance:', updateWalletError);
      return new Response(JSON.stringify({
        error: 'Failed to process bet. Please try again.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Create bet record
    const { data: bet, error: betError } = await supabase.from('bets').insert({
      user_id: user.id,
      contest_id: contestId,
      chosen_numbers: chosenNumbers.sort((a, b)=>a - b),
      amount: betAmount,
      payment_status: 'completed'
    }).select().single();
    if (betError) {
      console.error('Error creating bet:', betError);
      // Rollback wallet update
      await supabase.from('wallets').update({
        balance: wallet.balance
      }).eq('user_id', user.id);
      return new Response(JSON.stringify({
        error: 'Failed to create bet. Wallet balance restored.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Create transaction record for bet
    const { error: transactionError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'bet',
      amount: -betAmount,
      status: 'completed',
      description: `Aposta no concurso - ${chosenNumbers.slice(0, 5).join(', ')}...`
    });
    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
    // Don't rollback the bet, just log the error
    }
    // Update contest total collected
    const { data: currentContest } = await supabase.from('contests').select('total_collected, num_bets').eq('id', contestId).single();
    await supabase.from('contests').update({
      total_collected: (currentContest?.total_collected || 0) + betAmount,
      num_bets: (currentContest?.num_bets || 0) + 1
    }).eq('id', contestId);
    console.log(`Bet created successfully for user ${user.id}, contest ${contestId}, amount: ${betAmount}`);
    return new Response(JSON.stringify({
      success: true,
      bet_id: bet.id,
      amount: betAmount,
      chosen_numbers: chosenNumbers.sort((a, b)=>a - b),
      new_wallet_balance: newBalance,
      message: 'Bet placed successfully!'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in process-bet function:', error);
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
