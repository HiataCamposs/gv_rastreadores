import { useState, useEffect, useMemo } from "react";
import {
  PlusCircle,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  Clock,
  Wrench,
  ChevronDown,
  ChevronUp,
  Trash2,
  Filter,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import FormNovoAgendamento from "../components/FormNovoAgendamento";

const TIPO_LABELS = {
  instalacao: "Instalação",
  retirada: "Retirada",
  manutencao: "Manutenção",
  outros: "Outros",
};

const STATUS_LABELS = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const STATUS_COR = {
  pendente: "bg-yellow-100 text-yellow-700",
  em_andamento: "bg-blue-100 text-blue-700",
  concluido: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);

  /* ── Filtros ── */
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [filtroCidade, setFiltroCidade] = useState(null);
  const [filtroData, setFiltroData] = useState("");

  useEffect(() => {
    buscar();
  }, []);

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
        `
        )
        .order("data", { ascending: false });

      if (error) throw error;
      setAgendamentos(data ?? []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  function iniciarEdicao(ag) {
    setEditando(ag);
    setMostrarForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditando(null);
  }

  async function excluir(id) {
    if (!confirm("Excluir este agendamento?")) return;
    const { error } = await supabase.from("atendimentos").delete().eq("id", id);
    if (!error) buscar();
  }

  /* ── Cidades únicas para filtro ── */
  const cidades = useMemo(() => {
    const set = new Set(agendamentos.map((a) => a.cidade));
    return [...set].sort();
  }, [agendamentos]);

  /* ── Lista filtrada ── */
  const filtrados = useMemo(() => {
    let lista = agendamentos;

    if (filtroStatus) {
      lista = lista.filter((a) => a.status === filtroStatus);
    }
    if (filtroCidade) {
      lista = lista.filter((a) => a.cidade === filtroCidade);
    }
    if (filtroData) {
      lista = lista.filter((a) => {
        const diaAtend = new Date(a.data).toISOString().slice(0, 10);
        return diaAtend === filtroData;
      });
    }

    return lista;
  }, [agendamentos, filtroStatus, filtroCidade, filtroData]);

  const temFiltroAtivo = filtroStatus || filtroCidade || filtroData;

  function limparFiltros() {
    setFiltroStatus(null);
    setFiltroCidade(null);
    setFiltroData("");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* ── Edição inline ── */}
      {editando && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-primary-600">
              ✏️ Editando agendamento #{editando.id}
            </p>
            <button
              onClick={cancelarEdicao}
              className="text-sm font-semibold text-text-secondary hover:text-red-500
                         cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          </div>
          <FormNovoAgendamento
            key={`edit-${editando.id}`}
            agendamento={editando}
            veiculosIniciais={editando.atendimento_veiculos}
            onSalvo={() => {
              setEditando(null);
              buscar();
            }}
          />
        </div>
      )}

      {/* ── Botão novo ── */}
      {!editando && (
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold
                     text-primary-600 bg-primary-50 border-2 border-dashed border-primary-200 rounded-xl
                     hover:bg-primary-100 active:bg-primary-200 transition-colors cursor-pointer"
        >
          <PlusCircle size={18} />
          {mostrarForm ? "Cancelar" : "Novo Agendamento"}
        </button>
      )}

      {/* ── Form novo ── */}
      {!editando && mostrarForm && (
        <FormNovoAgendamento
          onSalvo={() => {
            setMostrarForm(false);
            buscar();
          }}
        />
      )}

      {/* ── Filtros ── */}
      {!carregando && !erro && agendamentos.length > 0 && (
        <div className="bg-surface border border-border-custom rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-bold text-text-secondary">
              <Filter size={15} /> Filtros
            </p>
            {temFiltroAtivo && (
              <button
                onClick={limparFiltros}
                className="flex items-center gap-1 text-xs font-semibold text-primary-500
                           hover:text-primary-700 cursor-pointer transition-colors"
              >
                <X size={14} /> Limpar
              </button>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-wrap gap-2">
            {[
              { val: null, label: "Todos" },
              { val: "pendente", label: "Pendente" },
              { val: "em_andamento", label: "Em andamento" },
              { val: "concluido", label: "Concluído" },
              { val: "cancelado", label: "Cancelado" },
            ].map(({ val, label }) => {
              const ativo = filtroStatus === val;
              return (
                <button
                  key={label}
                  onClick={() => setFiltroStatus(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer
                    ${
                      ativo
                        ? "bg-primary-500 text-white"
                        : "bg-bg-custom text-text-secondary hover:bg-primary-50"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Cidade */}
          {cidades.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFiltroCidade(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer
                  ${
                    !filtroCidade
                      ? "bg-accent-500 text-white"
                      : "bg-bg-custom text-text-secondary hover:bg-accent-50"
                  }`}
              >
                Todas cidades
              </button>
              {cidades.map((c) => {
                const ativo = filtroCidade === c;
                return (
                  <button
                    key={c}
                    onClick={() => setFiltroCidade(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer
                      ${
                        ativo
                          ? "bg-accent-500 text-white"
                          : "bg-bg-custom text-text-secondary hover:bg-accent-50"
                      }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          )}

          {/* Data */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-bg-custom border border-border-custom rounded-lg
                         focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-colors"
            />
            {filtroData && (
              <button
                onClick={() => setFiltroData("")}
                className="p-2 rounded-lg text-text-secondary hover:bg-red-50 hover:text-red-500
                           cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Contador */}
          <p className="text-xs text-text-disabled text-right">
            {filtrados.length} de {agendamentos.length} agendamento
            {agendamentos.length !== 1 && "s"}
          </p>
        </div>
      )}

      {/* ── Loading ── */}
      {carregando && (
        <div className="flex flex-col items-center py-12 text-text-disabled">
          <Loader2 size={32} className="animate-spin mb-3" />
          <p>Carregando agendamentos…</p>
        </div>
      )}

      {/* ── Erro ── */}
      {!carregando && erro && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
          <AlertCircle size={22} />
          <p className="font-semibold">{erro}</p>
        </div>
      )}

      {/* ── Lista vazia (nenhum cadastrado) ── */}
      {!carregando && !erro && agendamentos.length === 0 && (
        <p className="text-center text-text-disabled py-10">
          Nenhum agendamento cadastrado.
        </p>
      )}

      {/* ── Lista vazia (filtro sem resultado) ── */}
      {!carregando &&
        !erro &&
        agendamentos.length > 0 &&
        filtrados.length === 0 && (
          <p className="text-center text-text-disabled py-10">
            Nenhum agendamento encontrado com esses filtros.
          </p>
        )}

      {/* ── Cards de agendamento ── */}
      {!carregando &&
        !erro &&
        filtrados.map((ag) => (
          <CardAgendamento
            key={ag.id}
            ag={ag}
            onEditar={() => iniciarEdicao(ag)}
            onExcluir={() => excluir(ag.id)}
            destaque={editando?.id === ag.id}
          />
        ))}
    </div>
  );
}

/* ── Card resumido de agendamento ── */
function CardAgendamento({ ag, onEditar, onExcluir, destaque }) {
  const [aberto, setAberto] = useState(false);

  const dataFormatada = new Date(ag.data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaFormatada = new Date(ag.data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const nomeEmpresa =
    ag.empresas?.nome_fantasia || ag.empresas?.razao_social || "—";

  const statusCor = STATUS_COR[ag.status] || STATUS_COR.pendente;

  return (
    <div
      className={`bg-surface rounded-xl border shadow-sm overflow-hidden transition-colors ${
        destaque
          ? "border-primary-400 ring-2 ring-primary-100"
          : "border-border-custom"
      }`}
    >
      {/* Cabeçalho clicável */}
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full px-4 py-3 flex items-center justify-between cursor-pointer
                   hover:bg-surface-alt transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-text-primary truncate">
                {ag.cidade}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCor}`}
              >
                {STATUS_LABELS[ag.status]}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {dataFormatada}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {horaFormatada}
              </span>
              <span className="flex items-center gap-1">
                <User size={12} />
                {ag.responsavel}
              </span>
            </div>
          </div>
        </div>
        {aberto ? (
          <ChevronUp size={20} className="text-text-disabled shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-text-disabled shrink-0" />
        )}
      </button>

      {/* Detalhes expandidos */}
      {aberto && (
        <div className="px-4 pb-4 space-y-3 border-t border-border-custom pt-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Info label="Empresa" valor={nomeEmpresa} />
            <Info
              label="Natureza"
              valor={TIPO_LABELS[ag.tipo_servico] || ag.tipo_servico}
            />
            <Info label="Telefone" valor={ag.telefone} />
            <Info label="Vínculo" valor={ag.tipo_responsavel} />
          </div>

          {ag.endereco && (
            <div className="text-sm">
              <span className="font-semibold text-text-secondary">
                Endereço:{" "}
              </span>
              <span className="text-text-primary">{ag.endereco}</span>
            </div>
          )}

          {ag.atendimento_veiculos?.length > 0 && (
            <div className="text-sm">
              <span className="font-semibold text-text-secondary">
                Veículos:{" "}
              </span>
              {ag.atendimento_veiculos.map((v) => (
                <span
                  key={v.id}
                  className="inline-block bg-surface-alt border border-border-custom rounded-lg
                             px-2 py-0.5 text-xs font-mono mr-1 mt-1"
                >
                  {v.placa} — {v.modelo}
                </span>
              ))}
            </div>
          )}

          {ag.observacoes && (
            <div className="text-sm">
              <span className="font-semibold text-text-secondary">Obs: </span>
              <span className="text-text-primary">{ag.observacoes}</span>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onEditar}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold
                         text-primary-600 bg-primary-50 hover:bg-primary-100 active:bg-primary-200
                         rounded-xl transition-colors cursor-pointer"
            >
              ✏️ Editar
            </button>
            <button
              onClick={onExcluir}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold
                         text-red-500 bg-red-50 hover:bg-red-100 active:bg-red-200
                         rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, valor }) {
  return (
    <div>
      <span className="font-semibold text-text-secondary text-xs">{label}</span>
      <p className="text-text-primary truncate">{valor || "—"}</p>
    </div>
  );
}
