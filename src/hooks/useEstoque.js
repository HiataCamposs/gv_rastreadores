import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Hook que busca o estoque com o nome da empresa via join.
 *
 * Tabela: "estoque"
 *   - id, empresa_id, modelo_equipamento, quantidade,
 *     data_recebimento, observacoes, created_at
 */
export function useEstoque() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscar();
  }, []);

  async function buscar() {
    setCarregando(true);
    setErro(null);

    try {
      const { data, error } = await supabase
        .from("estoque")
        .select(
          `
          id,
          modelo_equipamento,
          quantidade,
          data_recebimento,
          observacoes,
          empresas ( id, razao_social, nome_fantasia )
        `
        )
        .order("data_recebimento", { ascending: false });

      if (error) throw error;
      setItens(data ?? []);
    } catch (err) {
      console.error("Erro ao buscar estoque:", err);
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return { itens, carregando, erro, recarregar: buscar };
}
