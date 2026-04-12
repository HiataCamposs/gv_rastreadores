import { useState } from "react";
import {
  PlusCircle,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  Trash2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useEmpresas } from "../hooks/useEmpresas";

export default function Empresas() {
  const { empresas, carregando, erro, recarregar } = useEmpresas();
  const [mostrarForm, setMostrarForm] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-2.5 py-3 space-y-2.5">
      {/* Botão adicionar */}
      <button
        onClick={() => setMostrarForm(!mostrarForm)}
        className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold
                     text-primary-600 bg-primary-50 border-2 border-dashed border-primary-200 rounded-xl
                     hover:bg-primary-100 active:bg-primary-200 transition-colors cursor-pointer"
      >
        <PlusCircle size={16} />
        {mostrarForm ? "Cancelar" : "Cadastrar Nova Empresa"}
      </button>

      {/* Formulário inline */}
      {mostrarForm && (
        <FormEmpresa
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
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-xs font-semibold">{erro}</p>
        </div>
      )}

      {/* Lista */}
      {!carregando &&
        !erro &&
        empresas.map((emp) => (
          <CardEmpresa key={emp.id} empresa={emp} onAtualizado={recarregar} />
        ))}

      {!carregando && !erro && empresas.length === 0 && (
        <p className="text-center text-text-disabled py-10">
          Nenhuma empresa cadastrada ainda.
        </p>
      )}
    </div>
  );
}

/* ── Card de empresa ── */
function CardEmpresa({ empresa, onAtualizado }) {
  const [excluindo, setExcluindo] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [editando, setEditando] = useState(false);

  const nome = empresa.nome_fantasia || empresa.razao_social;

  async function excluir() {
    if (!confirm(`Excluir "${nome}"?`)) return;
    setExcluindo(true);
    try {
      const { error } = await supabase
        .from("empresas")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", empresa.id);
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
        <FormEmpresa
          empresa={empresa}
          onSalvo={() => {
            setEditando(false);
            onAtualizado();
          }}
        />
      </div>
    );
  }

  /* Montar endereço resumido */
  const partes = [empresa.logradouro, empresa.numero, empresa.bairro].filter(
    Boolean,
  );
  const enderecoLinha1 = partes.join(", ");
  const enderecoLinha2 = [empresa.cidade, empresa.uf]
    .filter(Boolean)
    .join(" - ");
  const cepFormatado = empresa.cep || "";

  return (
    <div className="bg-surface rounded-xl border border-border-custom shadow-sm overflow-hidden">
      {/* Cabeçalho do card — sempre visível */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">
              {nome}
            </p>
            {empresa.cnpj && (
              <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                <FileText size={12} className="shrink-0" /> {empresa.cnpj}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={() => setExpandido(!expandido)}
              className="p-2 text-text-disabled hover:text-primary-500 hover:bg-primary-50 rounded-lg
                         transition-colors cursor-pointer"
              title={expandido ? "Recolher" : "Ver detalhes"}
            >
              {expandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <button
              onClick={() => {
                setEditando(true);
                setExpandido(false);
              }}
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

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
          {empresa.telefone && (
            <a
              href={`tel:${empresa.telefone.replace(/\D/g, "")}`}
              className="flex items-center gap-1 hover:text-green-600"
            >
              <Phone size={12} /> {empresa.telefone}
            </a>
          )}
          {empresa.email && (
            <span className="flex items-center gap-1">
              <Mail size={12} /> {empresa.email}
            </span>
          )}
          {empresa.cidade && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {empresa.cidade}
              {empresa.uf ? ` - ${empresa.uf}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Detalhes expandidos — dados completos para NF */}
      {expandido && (
        <div className="border-t border-border-custom bg-surface-alt px-3 py-2.5 space-y-1.5 text-xs">
          {empresa.razao_social && empresa.nome_fantasia && (
            <InfoLinha label="Razão Social" valor={empresa.razao_social} />
          )}
          {empresa.inscricao_municipal && (
            <InfoLinha
              label="Inscrição Municipal"
              valor={empresa.inscricao_municipal}
            />
          )}
          {empresa.inscricao_estadual && (
            <InfoLinha
              label="Inscrição Estadual"
              valor={empresa.inscricao_estadual}
            />
          )}
          {enderecoLinha1 && (
            <InfoLinha
              label="Endereço"
              valor={`${enderecoLinha1}${
                empresa.complemento ? " - " + empresa.complemento : ""
              }`}
            />
          )}
          {enderecoLinha2 && (
            <InfoLinha
              label="Cidade/UF"
              valor={`${enderecoLinha2}${
                cepFormatado ? " — CEP " + cepFormatado : ""
              }`}
            />
          )}
          {empresa.observacoes && (
            <InfoLinha label="Obs" valor={empresa.observacoes} />
          )}
        </div>
      )}
    </div>
  );
}

/* Mini-componente de linha de detalhe */
function InfoLinha({ label, valor }) {
  return (
    <div className="flex gap-2">
      <span className="text-text-disabled font-medium shrink-0 w-28">
        {label}:
      </span>
      <span className="text-text-primary">{valor}</span>
    </div>
  );
}

/* ── Formulário de empresa (criar + editar) ── */
function FormEmpresa({ empresa, onSalvo }) {
  const modoEdicao = !!empresa;

  const [form, setForm] = useState({
    razao_social: empresa?.razao_social || "",
    nome_fantasia: empresa?.nome_fantasia || "",
    cnpj: empresa?.cnpj || "",
    inscricao_municipal: empresa?.inscricao_municipal || "",
    inscricao_estadual: empresa?.inscricao_estadual || "",
    logradouro: empresa?.logradouro || "",
    numero: empresa?.numero || "",
    complemento: empresa?.complemento || "",
    bairro: empresa?.bairro || "",
    cidade: empresa?.cidade || "",
    uf: empresa?.uf || "",
    cep: empresa?.cep || "",
    email: empresa?.email || "",
    telefone: empresa?.telefone || "",
    observacoes: empresa?.observacoes || "",
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

    if (!form.razao_social.trim()) {
      setErro("Informe a Razão Social da empresa.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {};
      // Monta payload só com campos preenchidos
      Object.entries(form).forEach(([key, val]) => {
        const trimmed = typeof val === "string" ? val.trim() : val;
        payload[key] = trimmed || null;
      });
      // Razão social é obrigatório
      payload.razao_social = form.razao_social.trim();

      if (modoEdicao) {
        const { error } = await supabase
          .from("empresas")
          .update(payload)
          .eq("id", empresa.id);
        if (error) throw error;
        setSucesso(true);
      } else {
        const { error } = await supabase.from("empresas").insert(payload);
        if (error) throw error;
        setSucesso(true);
        setForm({
          razao_social: "",
          nome_fantasia: "",
          cnpj: "",
          inscricao_municipal: "",
          inscricao_estadual: "",
          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          uf: "",
          cep: "",
          email: "",
          telefone: "",
          observacoes: "",
        });
      }
      if (onSalvo) onSalvo();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 text-sm bg-surface border-2 border-border-custom rounded-xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-colors placeholder:text-text-disabled";

  return (
    <form
      onSubmit={salvar}
      className="bg-surface rounded-xl border border-border-custom shadow-sm p-3 space-y-2.5"
    >
      {sucesso && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-sm font-semibold">
          <CheckCircle2 size={18} />{" "}
          {modoEdicao ? "Empresa atualizada!" : "Empresa cadastrada!"}
        </div>
      )}
      {erro && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg px-3 py-2 text-sm font-semibold">
          <AlertCircle size={18} /> {erro}
        </div>
      )}

      {/* ── Dados da empresa ── */}
      <p className="text-xs font-bold text-text-disabled uppercase tracking-wider pt-1">
        Dados da Empresa
      </p>
      <input
        type="text"
        placeholder="Razão Social *"
        value={form.razao_social}
        onChange={(e) => atualizar("razao_social", e.target.value)}
        className={inputClass}
      />
      <input
        type="text"
        placeholder="Nome Fantasia"
        value={form.nome_fantasia}
        onChange={(e) => atualizar("nome_fantasia", e.target.value)}
        className={inputClass}
      />
      <input
        type="text"
        placeholder="CNPJ"
        value={form.cnpj}
        onChange={(e) => atualizar("cnpj", e.target.value)}
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Inscrição Municipal"
          value={form.inscricao_municipal}
          onChange={(e) => atualizar("inscricao_municipal", e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Inscrição Estadual"
          value={form.inscricao_estadual}
          onChange={(e) => atualizar("inscricao_estadual", e.target.value)}
          className={inputClass}
        />
      </div>

      {/* ── Endereço ── */}
      <p className="text-xs font-bold text-text-disabled uppercase tracking-wider pt-2">
        Endereço
      </p>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="Logradouro"
          value={form.logradouro}
          onChange={(e) => atualizar("logradouro", e.target.value)}
          className={inputClass + " col-span-2"}
        />
        <input
          type="text"
          placeholder="Nº"
          value={form.numero}
          onChange={(e) => atualizar("numero", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Complemento"
          value={form.complemento}
          onChange={(e) => atualizar("complemento", e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Bairro"
          value={form.bairro}
          onChange={(e) => atualizar("bairro", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-5 gap-2">
        <input
          type="text"
          placeholder="Cidade"
          value={form.cidade}
          onChange={(e) => atualizar("cidade", e.target.value)}
          className={inputClass + " col-span-2"}
        />
        <input
          type="text"
          placeholder="UF"
          maxLength={2}
          value={form.uf}
          onChange={(e) => atualizar("uf", e.target.value.toUpperCase())}
          className={inputClass + " text-center"}
        />
        <input
          type="text"
          placeholder="CEP"
          value={form.cep}
          onChange={(e) => atualizar("cep", e.target.value)}
          className={inputClass + " col-span-2"}
        />
      </div>

      {/* ── Contato ── */}
      <p className="text-xs font-bold text-text-disabled uppercase tracking-wider pt-2">
        Contato
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="tel"
          placeholder="Telefone"
          value={form.telefone}
          onChange={(e) => atualizar("telefone", e.target.value)}
          className={inputClass}
        />
        <input
          type="email"
          placeholder="E-mail (envio de NFS-e)"
          value={form.email}
          onChange={(e) => atualizar("email", e.target.value)}
          className={inputClass}
        />
      </div>

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
        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold
                   text-white bg-primary-500 hover:bg-primary-600 active:bg-primary-700
                   rounded-xl shadow-lg transition-colors disabled:opacity-60
                   disabled:cursor-not-allowed cursor-pointer"
      >
        {salvando ? (
          <>
            <Loader2 size={20} className="animate-spin" /> Salvando…
          </>
        ) : (
          <>
            <Save size={20} />{" "}
            {modoEdicao ? "Salvar Alterações" : "Salvar Empresa"}
          </>
        )}
      </button>
    </form>
  );
}
