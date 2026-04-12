import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import FormNovoAgendamento from "../components/FormNovoAgendamento";

/**
 * Página de edição de um agendamento existente.
 * Busca o atendimento pelo id da URL e renderiza o formulário em modo edição.
 */
export default function EditarAtendimento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [agendamento, setAgendamento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function buscar() {
      setCarregando(true);
      setErro(null);
      try {
        const { data, error } = await supabase
          .from("atendimentos")
          .select(
            `
            id, empresa_id, data, cidade, responsavel, tipo_responsavel,
            telefone, endereco, tipo_servico, status, observacoes, distancia_km,
            empresas ( id, razao_social, nome_fantasia ),
            atendimento_veiculos ( id, placa, modelo )
          `,
          )
          .eq("id", id)
          .is("deleted_at", null)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Agendamento não encontrado.");
        setAgendamento(data);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    }
    buscar();
  }, [id]);

  if (carregando) {
    return (
      <div className="flex flex-col items-center py-16 text-text-disabled">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p>Carregando agendamento…</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="max-w-2xl mx-auto px-2.5 py-3">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2">
          <AlertCircle size={18} />
          <p className="text-xs font-semibold">{erro}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <FormNovoAgendamento
        key={`edit-${agendamento.id}`}
        agendamento={agendamento}
        veiculosIniciais={agendamento.atendimento_veiculos}
        onSalvo={() => navigate(-1)}
      />
    </div>
  );
}
