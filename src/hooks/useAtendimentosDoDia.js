import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Hook que busca os atendimentos do dia atual no Supabase.
 *
 * Tabela esperada: "atendimentos"
 *   - id, data, cidade, responsavel, telefone, endereco, tipo_servico,
 *     status, observacoes, created_at
 *
 * Tabela relacionada: "atendimento_veiculos"
 *   - id, atendimento_id, placa, modelo
 *
 * A query faz um join via foreign key.
 */
export function useAtendimentosDoDia() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscar();
  }, []);

  async function buscar() {
    setCarregando(true);
    setErro(null);

    try {
      // Intervalo do dia atual (00:00 até 23:59:59)
      const hoje = new Date();
      const inicioDia = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
      ).toISOString();
      const fimDia = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate(),
        23,
        59,
        59,
        999
      ).toISOString();

      const { data, error } = await supabase
        .from("atendimentos")
        .select(
          `
          id,
          empresa_id,
          data,
          cidade,
          responsavel,
          tipo_responsavel,
          telefone,
          endereco,
          tipo_servico,
          status,
          observacoes,
          distancia_km,
          empresas ( id, razao_social, nome_fantasia ),
          atendimento_veiculos ( id, placa, modelo )
        `
        )
        .gte("data", inicioDia)
        .lte("data", fimDia)
        .is("deleted_at", null)
        .order("cidade", { ascending: true });

      if (error) throw error;

      setAtendimentos(data ?? []);
    } catch (err) {
      console.error("Erro ao buscar atendimentos:", err);
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return { atendimentos, carregando, erro, recarregar: buscar };
}
