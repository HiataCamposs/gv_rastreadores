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
        .is("deleted_at", null)
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
    const { error } = await supabase
      .from("atendimentos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
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
            <div>
              <span className="font-semibold text-text-secondary text-xs">
                Telefone
              </span>
              <div className="flex items-center gap-2">
                <p className="text-text-primary truncate">
                  {ag.telefone || "—"}
                </p>
                {ag.telefone && (
                  <a
                    href={`https://wa.me/55${ag.telefone
                      .replace(/\D/g, "")
                      .replace(/^(?!33)/, "33")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-green-500 hover:text-green-600 active:text-green-700 transition-colors"
                    title="Abrir no WhatsApp"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
            <Info label="Vínculo" valor={ag.tipo_responsavel} />
          </div>

          {ag.endereco && (
            <div>
              <span className="font-semibold text-text-secondary text-xs">
                Endereço
              </span>
              <div className="flex items-center gap-2">
                <p className="text-text-primary text-sm">{ag.endereco}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    ag.endereco
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-accent-500 hover:text-accent-700 transition-colors"
                  title="Abrir no Google Maps"
                >
                  <MapPin size={14} />
                </a>
              </div>
            </div>
          )}

          {ag.atendimento_veiculos?.length > 0 && (
            <div>
              <span className="font-semibold text-text-secondary text-xs">
                Veículos
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {ag.atendimento_veiculos.map((v) => (
                  <a
                    key={v.id}
                    href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(
                      v.modelo
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-surface-alt border border-border-custom rounded-lg
                               px-2 py-0.5 text-xs font-mono hover:bg-primary-50
                               hover:border-primary-300 active:bg-primary-100 transition-colors"
                  >
                    {v.placa} — {v.modelo}
                  </a>
                ))}
              </div>
            </div>
          )}

          {ag.observacoes && (
            <div>
              <span className="font-semibold text-text-secondary text-xs">
                Observações
              </span>
              <p className="text-text-primary text-sm">{ag.observacoes}</p>
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
