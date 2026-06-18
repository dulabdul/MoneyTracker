import { createClient } from '@supabase/supabase-js';

const url = 'https://tyalceksiigamnwqtivy.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5YWxjZWtzaWlnYW1ud3F0aXZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE4NzI2NSwiZXhwIjoyMDk2NzYzMjY1fQ.CTnUVMJnX-PU8Xdqd1IE1vJfj_okiQv0BkpEpxegVWc';

const supabase = createClient(url, anonKey);

async function test() {
  console.log("Calling get_cashflow_analytics with period='year'...");
  const { data: cashflow, error: err1 } = await supabase.rpc("get_cashflow_analytics", { 
    p_year: 2026,
    p_month: null,
    p_period: 'year'
  });
  if (err1) {
    console.error("Cashflow RPC Error:", err1);
  } else {
    console.log("Cashflow RPC Success! Data:", JSON.stringify(cashflow, null, 2).slice(0, 1000));
  }

  console.log("Calling get_budget_analytics with period='year'...");
  const { data: budget, error: err2 } = await supabase.rpc("get_budget_analytics", { 
    p_year: 2026,
    p_month: 6,
    p_period: 'year'
  });
  if (err2) {
    console.error("Budget RPC Error:", err2);
  } else {
    console.log("Budget RPC Success! Data:", JSON.stringify(budget, null, 2).slice(0, 1000));
  }
}

test();
