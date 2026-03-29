import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Hook que busca a lista de empresas cadastradas no Supabase.
 *
 * Tabela: "empresas" — campos completos para emissão de NFS-e.
 */
export function useEmpresas() {
  const [empresas, setEmpresas] = useState([]);
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
        .from("empresas")
        .select(
          `
          id, cnpj, razao_social, nome_fantasia,
          inscricao_municipal, inscricao_estadual,
          logradouro, numero, complemento, bairro, cidade, uf, cep,
          email, telefone, observacoes, ativo
        `
        )
        .eq("ativo", true)
        .is("deleted_at", null)
        .order("razao_social", { ascending: true });

      if (error) throw error;
      setEmpresas(data ?? []);
    } catch (err) {
      console.error("Erro ao buscar empresas:", err);
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return { empresas, carregando, erro, recarregar: buscar };
}
