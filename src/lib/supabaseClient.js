import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas.\n" +
      "   Crie um arquivo .env.local na raiz do projeto com:\n\n" +
      "   VITE_SUPABASE_URL=https://seu-projeto.supabase.co\n" +
      "   VITE_SUPABASE_ANON_KEY=sua-anon-key\n"
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
