import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Cpu,
  MapPin,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function FinalizarAtendimento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [atendimento, setAtendimento] = useState(null);
  const [equipamentos, setEquipamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  /* Campos do formulário */
  const [pedagioCentavos, setPedagioCentavos] = useState(0);
  const [equipamentoUtilizado, setEquipamentoUtilizado] = useState("");

  /* Formata centavos → "0,00" */
  const formatarPedagio = (centavos) =>
    (centavos / 100).toFixed(2).replace(".", ",");

  /* Handler estilo máquina de cartão via onChange */
  function handlePedagioChange(e) {
    const apenasDigitos = e.target.value.replace(/\D/g, "");
    setPedagioCentavos(parseInt(apenasDigitos || "0", 10));
  }

  /* Buscar dados do atendimento + equipamentos do estoque */
  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      try {
        const [resAtend, resEstoque] = await Promise.all([
          supabase
            .from("atendimentos")
            .select(
              `id, data, cidade, responsavel, telefone, endereco, tipo_servico, status,
               empresas ( id, razao_social, nome_fantasia ),
               atendimento_veiculos ( id, placa, modelo )`,
            )
            .eq("id", id)
            .single(),
          supabase
            .from("estoque")
            .select("id, modelo_equipamento, empresas ( nome_fantasia )")
            .is("deleted_at", null)
            .order("modelo_equipamento"),
        ]);

        if (resAtend.error) throw resAtend.error;
        setAtendimento(resAtend.data);

        if (!resEstoque.error) {
          /* Lista única de modelos */
          const modelos = [
            ...new Set(resEstoque.data.map((e) => e.modelo_equipamento)),
          ];
          setEquipamentos(modelos);
        }
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [id]);

  async function finalizar(e) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const payload = { status: "finalizado" };
      if (pedagioCentavos > 0) payload.pedagio_total = pedagioCentavos / 100;
      if (equipamentoUtilizado)
        payload.equipamento_utilizado = equipamentoUtilizado;

      const { error } = await supabase
        .from("atendimentos")
        .update(payload)
        .eq("id", id);
      if (error) throw error;

      setSucesso(true);
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 text-sm bg-surface border-2 border-border-custom rounded-xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-colors placeholder:text-text-disabled";

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20 text-text-disabled">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (!atendimento) {
    return (
      <div className="max-w-2xl mx-auto px-2.5 py-3">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-xs font-semibold">Atendimento não encontrado.</p>
        </div>
      </div>
    );
  }

  const nomeEmpresa =
    atendimento.empresas?.nome_fantasia ||
    atendimento.empresas?.razao_social ||
    "—";
  const dataFormatada = new Date(atendimento.data).toLocaleDateString("pt-BR");
  const horaFormatada = new Date(atendimento.data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-2xl mx-auto px-2.5 py-3 space-y-2.5">
      {/* Resumo do atendimento */}
      <div className="bg-surface rounded-xl border border-border-custom shadow-sm p-3 space-y-1.5">
        <p className="text-sm font-bold text-text-primary">{nomeEmpresa}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {atendimento.cidade}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} /> {dataFormatada}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {horaFormatada}
          </span>
          <span className="flex items-center gap-1">
            <User size={12} /> {atendimento.responsavel}
          </span>
        </div>
        {atendimento.atendimento_veiculos?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {atendimento.atendimento_veiculos.map((v) => (
              <span
                key={v.id}
                className="inline-block bg-surface-alt border border-border-custom rounded-lg
                           px-2 py-0.5 text-xs font-mono"
              >
                {v.placa} — {v.modelo}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Formulário de finalização */}
      <form
        onSubmit={finalizar}
        className="bg-surface rounded-xl border border-border-custom shadow-sm p-3 space-y-3"
      >
        {sucesso && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-sm font-semibold">
            <CheckCircle2 size={18} /> Atendimento finalizado!
          </div>
        )}
        {erro && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg px-3 py-2 text-sm font-semibold">
            <AlertCircle size={18} /> {erro}
          </div>
        )}

        {/* Pedágio */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-disabled uppercase tracking-wider flex items-center gap-1">
            <DollarSign size={14} /> Valor total em pedágio (R$)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-semibold text-sm">
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={formatarPedagio(pedagioCentavos)}
              onChange={handlePedagioChange}
              onFocus={(e) => {
                const len = e.target.value.length;
                setTimeout(() => e.target.setSelectionRange(len, len), 0);
              }}
              onClick={(e) => {
                const len = e.target.value.length;
                e.target.setSelectionRange(len, len);
              }}
              className={
                inputClass +
                " pl-10 text-right text-sm font-mono tracking-wider"
              }
            />
          </div>
        </div>

        {/* Equipamento */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-disabled uppercase tracking-wider flex items-center gap-1">
            <Cpu size={14} /> Equipamento utilizado
          </label>
          <select
            value={equipamentoUtilizado}
            onChange={(e) => setEquipamentoUtilizado(e.target.value)}
            className={inputClass + " appearance-none cursor-pointer"}
          >
            <option value="">Selecione (opcional)</option>
            {equipamentos.map((modelo) => (
              <option key={modelo} value={modelo}>
                {modelo}
              </option>
            ))}
          </select>
        </div>

        {/* Botão finalizar */}
        <button
          type="submit"
          disabled={salvando || sucesso}
          className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold
                     text-green-800 bg-green-100 hover:bg-green-200 active:bg-green-300
                     rounded-xl shadow-sm transition-colors disabled:opacity-60
                     disabled:cursor-not-allowed cursor-pointer border-2 border-green-200"
        >
          {salvando ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Finalizando…
            </>
          ) : (
            <>
              <CheckCircle2 size={20} /> Finalizar Atendimento
            </>
          )}
        </button>
      </form>
    </div>
  );
}
