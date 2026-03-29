import { useState } from "react";
import {
  Save,
  PlusCircle,
  Trash2,
  Car,
  Building2,
  MapPin,
  User,
  Phone,
  Wrench,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { estimarDistanciaViaGroq } from "../lib/groqDistancia";
import { useEmpresas } from "../hooks/useEmpresas";

const TIPOS_SERVICO = [
  { value: "instalacao", label: "Instalação" },
  { value: "retirada", label: "Retirada" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outros", label: "Outros" },
];

const VEICULO_VAZIO = { placa: "", modelo: "" };

/**
 * Formulário para cadastrar ou editar agendamento.
 *
 * Props:
 *  - onSalvo        (fn)      callback chamado após salvar com sucesso
 *  - agendamento    (object)  se passado, entra em modo edição
 *  - veiculosIniciais (array) veículos do agendamento em edição
 */
export default function FormNovoAgendamento({
  onSalvo,
  agendamento,
  veiculosIniciais,
}) {
  const { empresas, carregando: carregandoEmpresas } = useEmpresas();
  const modoEdicao = !!agendamento;

  /* ── Desmembrar endereço salvo em partes ── */
  function desmembrarEndereco(endereco) {
    if (!endereco) return { rua: "", numero: "", bairro: "", cidade: "" };
    const partes = endereco.split(",").map((p) => p.trim());
    return {
      rua: partes[0] || "",
      numero: partes[1] || "",
      bairro: partes[2] || "",
      cidade: partes[3] || "",
    };
  }

  const endPartes = modoEdicao
    ? desmembrarEndereco(agendamento.endereco)
    : { rua: "", numero: "", bairro: "", cidade: "" };

  /* ── Converter data ISO para datetime-local ── */
  function isoParaLocal(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /* ── Estado do formulário ── */
  const [form, setForm] = useState({
    empresa_id: agendamento?.empresa_id?.toString() || "",
    tipo_servico: agendamento?.tipo_servico || "instalacao",
    data: modoEdicao ? isoParaLocal(agendamento.data) : "",
    responsavel: agendamento?.responsavel || "",
    tipo_responsavel: agendamento?.tipo_responsavel || "funcionario",
    telefone: agendamento?.telefone || "",
    cidade: modoEdicao ? agendamento.cidade || endPartes.cidade : "",
    bairro: modoEdicao ? endPartes.bairro : "",
    rua: modoEdicao ? endPartes.rua : "",
    numero: modoEdicao ? endPartes.numero : "",
    observacoes: agendamento?.observacoes || "",
  });

  const [veiculos, setVeiculos] = useState(
    veiculosIniciais && veiculosIniciais.length > 0
      ? veiculosIniciais.map((v) => ({ placa: v.placa, modelo: v.modelo }))
      : [{ ...VEICULO_VAZIO }]
  );

  /* ── Estado de feedback ── */
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState(null);

  /* ── Helpers de formulário ── */
  function atualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function atualizarVeiculo(index, campo, valor) {
    setVeiculos((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor.toUpperCase() };
      return copia;
    });
  }

  function adicionarVeiculo() {
    setVeiculos((prev) => [...prev, { ...VEICULO_VAZIO }]);
  }

  function removerVeiculo(index) {
    if (veiculos.length === 1) return; // manter pelo menos 1
    setVeiculos((prev) => prev.filter((_, i) => i !== index));
  }

  /* ── Formatação de telefone (visual) ── */
  function formatarTelefone(valor) {
    const nums = valor.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 2) return nums;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  }

  /* ── Monta endereço completo a partir dos campos separados ── */
  function montarEndereco() {
    const partes = [
      form.rua.trim(),
      form.numero.trim(),
      form.bairro.trim(),
      form.cidade.trim(),
    ].filter(Boolean);
    return partes.join(", ");
  }

  /* ── Validação simples ── */
  function validar() {
    if (!form.empresa_id) return "Selecione uma empresa.";
    if (!form.data) return "Informe a data e horário do atendimento.";
    if (!form.responsavel.trim()) return "Informe o nome do responsável.";
    if (!form.telefone.trim()) return "Informe o telefone.";
    if (!form.cidade.trim()) return "Informe a cidade.";
    const veiculosValidos = veiculos.filter(
      (v) => v.placa.trim() && v.modelo.trim()
    );
    if (veiculosValidos.length === 0)
      return "Adicione pelo menos um veículo com placa e modelo.";
    return null;
  }

  /* ── Salvar no Supabase ── */
  async function salvar(e) {
    e.preventDefault();
    setSucesso(false);
    setErro(null);

    const msgErro = validar();
    if (msgErro) {
      setErro(msgErro);
      return;
    }

    setSalvando(true);
    try {
      // Estimar distância rodoviária de GV até a cidade do agendamento
      const distanciaKm = await estimarDistanciaViaGroq(form.cidade.trim());

      const payload = {
        empresa_id: Number(form.empresa_id),
        cidade: form.cidade.trim(),
        responsavel: form.responsavel.trim(),
        tipo_responsavel: form.tipo_responsavel,
        telefone: form.telefone.replace(/\D/g, ""),
        endereco: montarEndereco(),
        tipo_servico: form.tipo_servico,
        data: new Date(form.data).toISOString(),
        observacoes: form.observacoes.trim() || null,
        distancia_km: distanciaKm,
      };

      let atendimentoId;

      if (modoEdicao) {
        // ── UPDATE ──
        const { error: errUpdate } = await supabase
          .from("atendimentos")
          .update(payload)
          .eq("id", agendamento.id);
        if (errUpdate) throw errUpdate;
        atendimentoId = agendamento.id;

        // Deletar veículos antigos e reinserir
        await supabase
          .from("atendimento_veiculos")
          .delete()
          .eq("atendimento_id", agendamento.id);
      } else {
        // ── INSERT ──
        const { data: novoAtendimento, error: errInsert } = await supabase
          .from("atendimentos")
          .insert({ ...payload, status: "pendente" })
          .select("id")
          .single();
        if (errInsert) throw errInsert;
        atendimentoId = novoAtendimento.id;
      }

      // Inserir veículos vinculados
      const veiculosParaInserir = veiculos
        .filter((v) => v.placa.trim() && v.modelo.trim())
        .map((v) => ({
          atendimento_id: atendimentoId,
          placa: v.placa.trim().toUpperCase(),
          modelo: v.modelo.trim(),
        }));

      if (veiculosParaInserir.length > 0) {
        const { error: errVeiculos } = await supabase
          .from("atendimento_veiculos")
          .insert(veiculosParaInserir);
        if (errVeiculos) throw errVeiculos;
      }

      setSucesso(true);

      if (!modoEdicao) {
        // Limpar formulário só no modo criação
        setForm({
          empresa_id: "",
          tipo_servico: "instalacao",
          data: "",
          responsavel: "",
          tipo_responsavel: "funcionario",
          telefone: "",
          cidade: "",
          bairro: "",
          rua: "",
          numero: "",
          observacoes: "",
        });
        setVeiculos([{ ...VEICULO_VAZIO }]);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
      if (onSalvo) onSalvo();
    } catch (err) {
      console.error("Erro ao salvar agendamento:", err);
      setErro(err.message || "Erro desconhecido ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3.5 text-base bg-surface border-2 border-border-custom rounded-xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-colors placeholder:text-text-disabled";

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <form
      onSubmit={salvar}
      className="bg-surface rounded-xl border border-border-custom shadow-sm p-5 space-y-5"
    >
      {/* ── Feedback: Sucesso ── */}
      {sucesso && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3">
          <CheckCircle2 size={22} className="shrink-0" />
          <p className="font-semibold">
            {modoEdicao
              ? "Agendamento atualizado com sucesso!"
              : "Agendamento salvo com sucesso!"}
          </p>
        </div>
      )}

      {/* ── Feedback: Erro ── */}
      {erro && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
          <AlertCircle size={22} className="shrink-0" />
          <p className="font-semibold">{erro}</p>
        </div>
      )}

      {/* ═══ 1. EMPRESA ═══ */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1">
          <Building2 size={16} /> Empresa
        </label>
        <select
          value={form.empresa_id}
          onChange={(e) => atualizarCampo("empresa_id", e.target.value)}
          disabled={carregandoEmpresas}
          className={`${inputClass} disabled:opacity-50 appearance-none cursor-pointer`}
        >
          <option value="">
            {carregandoEmpresas ? "Carregando…" : "Selecione a empresa"}
          </option>
          {empresas.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nome_fantasia || emp.razao_social}
            </option>
          ))}
        </select>
      </div>

      {/* ═══ 2. NATUREZA (tipo de serviço) ═══ */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1">
          <Wrench size={16} /> Natureza
        </label>
        <select
          value={form.tipo_servico}
          onChange={(e) => atualizarCampo("tipo_servico", e.target.value)}
          className={`${inputClass} appearance-none cursor-pointer`}
        >
          {TIPOS_SERVICO.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* ═══ 3. DATA E HORÁRIO ═══ */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1">
          <CalendarDays size={16} /> Data e Horário
        </label>
        <input
          type="datetime-local"
          value={form.data}
          onChange={(e) => atualizarCampo("data", e.target.value)}
          className={inputClass}
        />
      </div>

      {/* ═══ 4. RESPONSÁVEL (vínculo + telefone + nome) ═══ */}
      <fieldset className="space-y-3">
        <legend className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1">
          <User size={16} /> Responsável
        </legend>

        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.tipo_responsavel}
            onChange={(e) => atualizarCampo("tipo_responsavel", e.target.value)}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            <option value="funcionario">Funcionário</option>
            <option value="proprietario">Proprietário</option>
            <option value="outros">Outros</option>
          </select>
          <input
            type="tel"
            placeholder="(34) 99999-9999"
            value={form.telefone}
            onChange={(e) =>
              atualizarCampo("telefone", formatarTelefone(e.target.value))
            }
            className={inputClass}
          />
        </div>

        <input
          type="text"
          placeholder="Nome completo"
          value={form.responsavel}
          onChange={(e) => atualizarCampo("responsavel", e.target.value)}
          className={inputClass}
        />
      </fieldset>

      {/* ═══ 6. ENDEREÇO (cidade, bairro, rua, número) ═══ */}
      <fieldset className="space-y-3">
        <legend className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1">
          <MapPin size={16} /> Endereço
        </legend>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Cidade"
            value={form.cidade}
            onChange={(e) => atualizarCampo("cidade", e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Bairro"
            value={form.bairro}
            onChange={(e) => atualizarCampo("bairro", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Rua / Avenida"
            value={form.rua}
            onChange={(e) => atualizarCampo("rua", e.target.value)}
            className={`min-w-0 flex-[4] ${inputClass}`}
          />
          <input
            type="text"
            placeholder="Nº"
            value={form.numero}
            onChange={(e) => atualizarCampo("numero", e.target.value)}
            className={`min-w-0 flex-1 ${inputClass}`}
          />
        </div>
      </fieldset>

      {/* ═══ 8. VEÍCULOS (dinâmico) ═══ */}
      <fieldset className="space-y-3">
        <legend className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1">
          <Car size={16} /> Veículos
        </legend>

        {veiculos.map((veiculo, index) => (
          <div
            key={index}
            className="flex gap-2 items-start bg-surface-alt border border-border-custom rounded-xl p-3"
          >
            {/* Placa */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Placa"
                maxLength={7}
                value={veiculo.placa}
                onChange={(e) =>
                  atualizarVeiculo(index, "placa", e.target.value)
                }
                className="w-full px-3 py-3 text-base font-mono tracking-wider bg-surface border-2 border-border-custom rounded-lg
                           focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none
                           transition-colors placeholder:text-text-disabled uppercase"
              />
            </div>

            {/* Modelo */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Modelo"
                value={veiculo.modelo}
                onChange={(e) =>
                  atualizarVeiculo(index, "modelo", e.target.value)
                }
                className="w-full px-3 py-3 text-base bg-surface border-2 border-border-custom rounded-lg
                           focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none
                           transition-colors placeholder:text-text-disabled"
              />
            </div>

            {/* Remover */}
            <button
              type="button"
              onClick={() => removerVeiculo(index)}
              disabled={veiculos.length === 1}
              className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg
                         transition-colors disabled:opacity-20 disabled:cursor-not-allowed
                         cursor-pointer shrink-0"
              title="Remover veículo"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        {/* Botão adicionar veículo */}
        <button
          type="button"
          onClick={adicionarVeiculo}
          className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold
                     text-primary-600 bg-primary-50 border-2 border-dashed border-primary-200 rounded-xl
                     hover:bg-primary-100 active:bg-primary-200 transition-colors cursor-pointer"
        >
          <PlusCircle size={18} />
          Adicionar outro veículo
        </button>
      </fieldset>

      {/* ═══ 9. OBSERVAÇÕES ═══ */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1">
          📝 Observações (opcional)
        </label>
        <textarea
          rows={3}
          placeholder="Alguma informação extra…"
          value={form.observacoes}
          onChange={(e) => atualizarCampo("observacoes", e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* ═══ BOTÃO SALVAR ═══ */}
      <button
        type="submit"
        disabled={salvando}
        className="flex items-center justify-center gap-3 w-full py-4 text-lg font-bold
                   text-white bg-primary-500 hover:bg-primary-600 active:bg-primary-700
                   rounded-xl shadow-lg transition-colors disabled:opacity-60
                   disabled:cursor-not-allowed cursor-pointer"
      >
        {salvando ? (
          <>
            <Loader2 size={24} className="animate-spin" />
            Salvando…
          </>
        ) : (
          <>
            <Save size={24} />
            {modoEdicao ? "Atualizar Agendamento" : "Salvar Agendamento"}
          </>
        )}
      </button>
    </form>
  );
}
