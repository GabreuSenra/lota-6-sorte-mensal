import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase env variables");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const contestId: string | undefined = body?.contestId;
    const winningNumbers: number[] | undefined = body?.winningNumbers;

    if (!contestId || !Array.isArray(winningNumbers)) {
      return new Response(JSON.stringify({ error: "contestId and winningNumbers are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate numbers: exactly 20, unique, 0..99
    const nums = winningNumbers.map((n) => Number(n));
    const unique = Array.from(new Set(nums));
    const valid = nums.length === 20 && unique.length === 20 && nums.every((n) => Number.isInteger(n) && n >= 0 && n <= 99);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Winning numbers must be 20 unique integers between 0 and 99" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization: admin only
    const { data: isAdmin, error: adminErr } = await supabaseUser.rpc("is_admin");
    if (adminErr) {
      console.error("is_admin error:", adminErr);
      return new Response(JSON.stringify({ error: "Auth error" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load contest
    const { data: contest, error: contestErr } = await supabaseAdmin
      .from("contests")
      .select("id, status, total_collected, month_year")
      .eq("id", contestId)
      .single();

    if (contestErr || !contest) {
      console.error("Contest fetch error:", contestErr);
      return new Response(JSON.stringify({ error: "Contest not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (contest.status !== "open") {
      return new Response(JSON.stringify({ error: "Contest is not open" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Close contest and set winning numbers
    const { error: updContestErr } = await supabaseAdmin
      .from("contests")
      .update({ status: "closed", winning_numbers: nums })
      .eq("id", contest.id);

    if (updContestErr) {
      console.error("Contest update error:", updContestErr);
      return new Response(JSON.stringify({ error: "Failed to close contest" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch bets for this contest
    const { data: bets, error: betsErr } = await supabaseAdmin
      .from("bets")
      .select("id, user_id, chosen_numbers")
      .eq("contest_id", contest.id);

    if (betsErr) {
      console.error("Bets fetch error:", betsErr);
      return new Response(JSON.stringify({ error: "Failed to fetch bets" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const winSet = new Set(nums);

    type Winner = { bet_id: string; user_id: string; hits: number };
    const winners6: Winner[] = [];
    const winners5: Winner[] = [];

    // Compute hits and update each bet
    for (const bet of bets ?? []) {
      const chosen: number[] = (bet as any).chosen_numbers ?? [];
      const hits = chosen.reduce((acc, n) => (winSet.has(Number(n)) ? acc + 1 : acc), 0);

      const { error: updBetErr } = await supabaseAdmin
        .from("bets")
        .update({ hits })
        .eq("id", bet.id);
      if (updBetErr) console.error("Update hits error for bet", bet.id, updBetErr);

      if (hits === 6) winners6.push({ bet_id: bet.id, user_id: (bet as any).user_id, hits });
      else if (hits === 5) winners5.push({ bet_id: bet.id, user_id: (bet as any).user_id, hits });
    }

    const totalCollected = Number(contest.total_collected || 0);
    const prizeValue = Math.max(0, Math.round(totalCollected * 1.0 * 100) / 100); // 100% of total_collected (before admin fee)

    const count6 = winners6.length;
    const count5 = winners5.length;
    const hadWinners = count6 + count5 > 0;

// Distribute prizes: 6-hits get 80% of total_collected, 5-hits get 20% (admin fee deducted per prize later)
const pool6 = count6 > 0 ? Math.round(prizeValue * 0.8 * 100) / 100 : 0;
const pool5 = count5 > 0 ? Math.round(prizeValue * 0.2 * 100) / 100 : 0;

    // Round to cents
    const round2 = (v: number) => Math.round(v * 100) / 100;

    // Credit prizes and mark bets
    if (count6 > 0) {
      const each = round2((pool6 / count6) * 0.8); // deduct 20% admin fee per prize
      for (const w of winners6) {
        // Update wallet (fetch, add, update)
        const { data: wallet, error: wErr } = await supabaseAdmin
          .from("wallets")
          .select("id, balance")
          .eq("user_id", w.user_id)
          .single();
        if (wErr) {
          console.error("Wallet fetch error for", w.user_id, wErr);
        } else {
          const newBal = round2(Number(wallet?.balance || 0) + each);
          const { error: upWErr } = await supabaseAdmin
            .from("wallets")
            .update({ balance: newBal })
            .eq("id", wallet!.id);
          if (upWErr) console.error("Wallet update error", upWErr);
        }

        // Mark bet prize
        const { error: updBetPrizeErr } = await supabaseAdmin
          .from("bets")
          .update({ prize_amount: each, prize_paid: true })
          .eq("id", w.bet_id);
        if (updBetPrizeErr) console.error("Bet prize update error", updBetPrizeErr);

        // Transaction record
        const { error: txErr } = await supabaseAdmin.from("transactions").insert({
          user_id: w.user_id,
          amount: each,
          type: "deposit",
          status: "completed",
          description: `Prêmio (6 acertos) - ${contest.month_year ?? "Concurso"}`,
        });
        if (txErr) console.error("Insert transaction error", txErr);
      }
    }

    if (count5 > 0) {
      const each = round2((pool5 / count5) * 0.8); // deduct 20% admin fee per prize
      for (const w of winners5) {
        const { data: wallet, error: wErr } = await supabaseAdmin
          .from("wallets")
          .select("id, balance")
          .eq("user_id", w.user_id)
          .single();
        if (wErr) {
          console.error("Wallet fetch error for", w.user_id, wErr);
        } else {
          const newBal = round2(Number(wallet?.balance || 0) + each);
          const { error: upWErr } = await supabaseAdmin
            .from("wallets")
            .update({ balance: newBal })
            .eq("id", wallet!.id);
          if (upWErr) console.error("Wallet update error", upWErr);
        }

        const { error: updBetPrizeErr } = await supabaseAdmin
          .from("bets")
          .update({ prize_amount: each, prize_paid: true })
          .eq("id", w.bet_id);
        if (updBetPrizeErr) console.error("Bet prize update error", updBetPrizeErr);

        const { error: txErr } = await supabaseAdmin.from("transactions").insert({
          user_id: w.user_id,
          amount: each,
          type: "deposit",
          status: "completed",
          description: `Prêmio (5 acertos) - ${contest.month_year ?? "Concurso"}`,
        });
        if (txErr) console.error("Insert transaction error", txErr);
      }
    }

    // Carryover logic note:
    const carryoverAmount = hadWinners ? 0 : totalCollected;

    return new Response(
      JSON.stringify({
        closedContestId: contest.id,
        winningNumbers: nums,
        total_collected: totalCollected,
        prize_value: prizeValue,
        winners6: count6,
        winners5: count5,
        hadWinners,
        carryoverAmount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("handle-contest-end error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});