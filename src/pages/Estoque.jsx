import { useState } from "react";
import {
  PlusCircle,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Box,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useEstoque } from "../hooks/useEstoque";
import { useEmpresas } from "../hooks/useEmpresas";

export default function Estoque() {
  const { itens, carregando, erro, recarregar } = useEstoque();
  const [mostrarForm, setMostrarForm] = useState(false);

  /* ── Total por empresa ── */
  const resumo = {};
  itens.forEach((item) => {
    const nomeEmpresa =
      item.empresas?.nome_fantasia ||
      item.empresas?.razao_social ||
      "Sem empresa";
    if (!resumo[nomeEmpresa]) resumo[nomeEmpresa] = 0;
    resumo[nomeEmpresa] += item.quantidade;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Resumo rápido */}
      {Object.keys(resumo).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(resumo).map(([empresa, qtd]) => (
            <div
              key={empresa}
              className="bg-surface rounded-xl border border-border-custom p-3 text-center"
            >
              <p className="text-2xl font-bold text-primary-500">{qtd}</p>
              <p className="text-xs text-text-secondary leading-tight mt-1 truncate">
                {empresa}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Botão adicionar */}
      <button
        onClick={() => setMostrarForm(!mostrarForm)}
        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold
                     text-primary-600 bg-primary-50 border-2 border-dashed border-primary-200 rounded-xl
                     hover:bg-primary-100 active:bg-primary-200 transition-colors cursor-pointer"
      >
        <PlusCircle size={18} />
        {mostrarForm ? "Cancelar" : "Registrar Entrada"}
      </button>

      {/* Formulário inline */}
      {mostrarForm && (
        <FormEstoque
          onSalvo={() => {
            setMostrarForm(false);
            recarregar();
          }}
        />
      )}

      {/* Loading */}
      {carregando && (
        <p className="text-center text-text-disabled py-10">Carregando…</p>
      )}

      {/* Erro */}
      {!carregando && erro && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
          <AlertCircle size={22} className="shrink-0" />
          <p className="font-semibold">{erro}</p>
        </div>
      )}

      {/* Lista de itens */}
      {!carregando &&
        !erro &&
        itens.map((item) => (
          <CardEstoque key={item.id} item={item} onAtualizado={recarregar} />
        ))}

      {!carregando && !erro && itens.length === 0 && (
        <p className="text-center text-text-disabled py-10">
          Estoque vazio. Registre uma entrada!
        </p>
      )}
    </div>
  );
}

/* ── Card de item do estoque ── */
function CardEstoque({ item, onAtualizado }) {
  const [excluindo, setExcluindo] = useState(false);
  const [editando, setEditando] = useState(false);

  async function excluir() {
    if (!confirm("Excluir este registro de estoque?")) return;
    setExcluindo(true);
    try {
      const { error } = await supabase
        .from("estoque")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) throw error;
      onAtualizado();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    } finally {
      setExcluindo(false);
    }
  }

  /* Se está editando, mostra o formulário com os dados preenchidos */
  if (editando) {
    return (
      <div className="relative">
        <button
          onClick={() => setEditando(false)}
          className="absolute top-3 right-3 z-10 p-1.5 text-text-disabled hover:text-red-500
                     hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          title="Cancelar edição"
        >
          <X size={18} />
        </button>
        <FormEstoque
          item={item}
          onSalvo={() => {
            setEditando(false);
            onAtualizado();
          }}
        />
      </div>
    );
  }

  const dataFormatada = item.data_recebimento
    ? new Date(item.data_recebimento + "T12:00:00").toLocaleDateString("pt-BR")
    : "—";

  return (
    <div className="bg-surface rounded-xl border border-border-custom shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Box size={18} className="text-primary-500" />
            <span className="font-bold text-text-primary">
              {item.modelo_equipamento}
            </span>
            <span className="bg-primary-50 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
              ×{item.quantidade}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Building2 size={14} />{" "}
              {item.empresas?.nome_fantasia ||
                item.empresas?.razao_social ||
                "—"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} /> {dataFormatada}
            </span>
          </div>
          {item.observacoes && (
            <p className="text-sm text-text-disabled italic">
              {item.observacoes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setEditando(true)}
            className="p-2 text-text-disabled hover:text-accent-500 hover:bg-accent-50 rounded-lg
                       transition-colors cursor-pointer"
            title="Editar"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={excluir}
            disabled={excluindo}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg
                       transition-colors cursor-pointer disabled:opacity-40"
            title="Excluir"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Formulário de estoque (criar + editar) ── */
function FormEstoque({ item, onSalvo }) {
  const modoEdicao = !!item;
  const { empresas, carregando: carregandoEmpresas } = useEmpresas();

  const [form, setForm] = useState({
    empresa_id: item?.empresa_id?.toString() || "",
    modelo_equipamento: item?.modelo_equipamento || "",
    quantidade: item?.quantidade?.toString() || "1",
    data_recebimento:
      item?.data_recebimento || new Date().toISOString().slice(0, 10),
    observacoes: item?.observacoes || "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  function atualizar(campo, valor) {
    setForm((p) => ({ ...p, [campo]: valor }));
  }

  async function salvar(e) {
    e.preventDefault();
    setSucesso(false);
    setErro(null);

    if (!form.empresa_id) {
      setErro("Selecione a empresa.");
      return;
    }
    if (!form.modelo_equipamento.trim()) {
      setErro("Informe o modelo do equipamento.");
      return;
    }
    if (!form.quantidade || Number(form.quantidade) < 1) {
      setErro("Quantidade deve ser pelo menos 1.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        empresa_id: Number(form.empresa_id),
        modelo_equipamento: form.modelo_equipamento.trim(),
        quantidade: Number(form.quantidade),
        data_recebimento: form.data_recebimento,
        observacoes: form.observacoes.trim() || null,
      };

      if (modoEdicao) {
        const { error } = await supabase
          .from("estoque")
          .update(payload)
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("estoque").insert(payload);
        if (error) throw error;
        setForm({
          empresa_id: "",
          modelo_equipamento: "",
          quantidade: "1",
          data_recebimento: new Date().toISOString().slice(0, 10),
          observacoes: "",
        });
      }

      setSucesso(true);
      if (onSalvo) onSalvo();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 text-base bg-surface border-2 border-border-custom rounded-xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-colors placeholder:text-text-disabled";

  return (
    <form
      onSubmit={salvar}
      className="bg-surface rounded-xl border border-border-custom shadow-sm p-4 space-y-3"
    >
      {sucesso && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-sm font-semibold">
          <CheckCircle2 size={18} />{" "}
          {modoEdicao ? "Entrada atualizada!" : "Entrada registrada!"}
        </div>
      )}
      {erro && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg px-3 py-2 text-sm font-semibold">
          <AlertCircle size={18} /> {erro}
        </div>
      )}

      {/* Empresa */}
      <select
        value={form.empresa_id}
        onChange={(e) => atualizar("empresa_id", e.target.value)}
        disabled={carregandoEmpresas}
        className={inputClass + " appearance-none cursor-pointer"}
      >
        <option value="">
          {carregandoEmpresas ? "Carregando…" : "Selecione a empresa *"}
        </option>
        {empresas.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.nome_fantasia || emp.razao_social}
          </option>
        ))}
      </select>

      {/* Modelo + Quantidade */}
      <div className="grid grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Modelo equip. *"
          value={form.modelo_equipamento}
          onChange={(e) => atualizar("modelo_equipamento", e.target.value)}
          className={inputClass + " col-span-2"}
        />
        <input
          type="number"
          min="1"
          placeholder="Qtd"
          value={form.quantidade}
          onChange={(e) => atualizar("quantidade", e.target.value)}
          className={inputClass + " text-center"}
        />
      </div>

      {/* Data recebimento */}
      <input
        type="date"
        value={form.data_recebimento}
        onChange={(e) => atualizar("data_recebimento", e.target.value)}
        className={inputClass}
      />

      {/* Observações */}
      <textarea
        rows={2}
        placeholder="Observações (opcional)"
        value={form.observacoes}
        onChange={(e) => atualizar("observacoes", e.target.value)}
        className={inputClass + " resize-none"}
      />

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
            <Loader2 size={24} className="animate-spin" /> Salvando…
          </>
        ) : (
          <>
            <Save size={24} />{" "}
            {modoEdicao ? "Salvar Alterações" : "Registrar Entrada"}
          </>
        )}
      </button>
    </form>
  );
}
