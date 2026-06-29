import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";
import * as fs from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
// We rely on the SERVICE_ROLE key or ANON key (which in this environment bypasses RLS)
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchAll(table: string) {
  let allData: any[] = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + step - 1);
      
    if (error) {
      console.error(`❌ Error fetching ${table}:`, error.message);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    allData = allData.concat(data);
    from += step;
    
    if (data.length < step) break; // Reached the end
  }
  
  return allData;
}

async function runBackup() {
  console.log(`📦 Starting full database extraction via Supabase API...`);
  
  const backupData: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tables: {}
  };
  
  const tables = ["wallets", "categories", "transactions", "financial_goals", "transfers", "budgets", "assets_portfolio"];
  
  for (const table of tables) {
    console.log(`📥 Fetching table: ${table}...`);
    const data = await fetchAll(table);
    backupData.tables[table] = data;
    console.log(`   ✅ ${table}: ${data.length} records`);
  }
  
  const backupDir = resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = resolve(backupDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
  
  console.log(`\n🎉 Backup successfully saved to: ${filepath}`);
}

runBackup().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
