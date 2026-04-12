import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  AlertCircle,
  CalendarPlus,
  Building2,
  Package,
  Plus,
  CalendarCheck,
  Clock,
  CheckCircle2,
  Car,
  MapPin,
  TrendingUp,
  BarChart3,
  Wrench,
  Map,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

/* ═══════════════════════════════════════════════════════════
   Dashboard Gerencial — Estatísticas e visão global
   ═══════════════════════════════════════════════════════════ */

const STATUS_COR = {
  pendente: "bg-yellow-400",
  em_andamento: "bg-blue-400",
  concluido: "bg-green-500",
  cancelado: "bg-red-400",
  finalizado: "bg-emerald-500",
};

const STATUS_LABEL = {
  pendente: "Pendentes",
  em_andamento: "Em andamento",
  concluido: "Concluídos",
  cancelado: "Cancelados",
  finalizado: "Finalizados",
};

const TIPO_LABEL = {
  instalacao: "Instalação",
  retirada: "Retirada",
  manutencao: "Manutenção",
  outros: "Outros",
};

const TIPO_COR = {
  instalacao: "bg-primary-500",
  retirada: "bg-accent-500",
  manutencao: "bg-yellow-500",
  outros: "bg-text-disabled",
};

export default function Dashboard({ onAcaoHeader }) {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [dados, setDados] = useState(null);

  async function buscar() {
    setCarregando(true);
    setErro(null);

    try {
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      /* Amanhã */
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const inicioAmanha = new Date(
        amanha.getFullYear(),
        amanha.getMonth(),
        amanha.getDate(),
      ).toISOString();
      const fimAmanha = new Date(
        amanha.getFullYear(),
        amanha.getMonth(),
        amanha.getDate(),
        23,
        59,
        59,
        999,
      ).toISOString();

      const [resAtend, resEmpresas, resEstoque, resAmanha] = await Promise.all([
        supabase
          .from("atendimentos")
          .select(
            `id, data, cidade, tipo_servico, status, empresa_id,
             empresas ( razao_social, nome_fantasia ),
             atendimento_veiculos ( id )`,
          )
          .gte("data", trintaDiasAtras.toISOString())
          .is("deleted_at", null)
          .order("data", { ascending: false }),
        supabase
          .from("empresas")
          .select("id, razao_social, nome_fantasia, ativo")
          .is("deleted_at", null),
        supabase
          .from("estoque")
          .select("id, quantidade, empresa_id")
          .is("deleted_at", null),
        supabase
          .from("atendimentos")
          .select(
            `id, data, cidade, endereco, responsavel,
             empresas ( razao_social, nome_fantasia )`,
          )
          .gte("data", inicioAmanha)
          .lte("data", fimAmanha)
          .is("deleted_at", null)
          .eq("status", "pendente")
          .order("data", { ascending: true }),
      ]);

      if (resAtend.error) throw resAtend.error;
      if (resEmpresas.error) throw resEmpresas.error;
      if (resEstoque.error) throw resEstoque.error;

      setDados({
        atendimentos: resAtend.data ?? [],
        empresas: resEmpresas.data ?? [],
        estoque: resEstoque.data ?? [],
        amanha: resAmanha.data ?? [],
      });
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
  }, []);

  /* Botão refresh no header */
  useEffect(() => {
    onAcaoHeader?.(
      <button
        onClick={buscar}
        disabled={carregando}
        className="p-2 rounded-full bg-primary-700 hover:bg-primary-500 active:bg-primary-800
                   transition-colors disabled:opacity-50 cursor-pointer"
        title="Atualizar"
      >
        <RefreshCw size={20} className={carregando ? "animate-spin" : ""} />
      </button>,
    );
    return () => onAcaoHeader?.(null);
  }, [carregando, onAcaoHeader]);

  /* ── Métricas derivadas ── */
  const metricas = useMemo(() => {
    if (!dados) return null;

    const { atendimentos, empresas, estoque } = dados;
    const hoje = new Date();
    const inicioDia = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
    );
    const fimDia = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
      23,
      59,
      59,
      999,
    );

    const diaHoje = atendimentos.filter((a) => {
      const d = new Date(a.data);
      return d >= inicioDia && d <= fimDia;
    });

    const porStatus = {};
    atendimentos.forEach((a) => {
      porStatus[a.status] = (porStatus[a.status] || 0) + 1;
    });

    const porTipo = {};
    atendimentos.forEach((a) => {
      porTipo[a.tipo_servico] = (porTipo[a.tipo_servico] || 0) + 1;
    });

    const porCidade = {};
    atendimentos.forEach((a) => {
      porCidade[a.cidade] = (porCidade[a.cidade] || 0) + 1;
    });
    const topCidades = Object.entries(porCidade)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Últimos 7 dias
    const ultimos7 = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoje);
      dia.setDate(dia.getDate() - i);
      const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
      const fim = new Date(
        dia.getFullYear(),
        dia.getMonth(),
        dia.getDate(),
        23,
        59,
        59,
        999,
      );
      const count = atendimentos.filter((a) => {
        const d = new Date(a.data);
        return d >= inicio && d <= fim;
      }).length;
      ultimos7.push({
        dia: dia
          .toLocaleDateString("pt-BR", { weekday: "short" })
          .replace(".", ""),
        data: dia.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        count,
      });
    }
    const max7 = Math.max(...ultimos7.map((d) => d.count), 1);

    const totalVeiculos = atendimentos.reduce(
      (acc, a) => acc + (a.atendimento_veiculos?.length || 0),
      0,
    );

    const porEmpresa = {};
    atendimentos.forEach((a) => {
      const nome = a.empresas?.nome_fantasia || a.empresas?.razao_social || "—";
      porEmpresa[nome] = (porEmpresa[nome] || 0) + 1;
    });
    const topEmpresas = Object.entries(porEmpresa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const totalEstoque = estoque.reduce(
      (acc, e) => acc + (e.quantidade || 0),
      0,
    );

    return {
      diaHoje,
      porStatus,
      porTipo,
      topCidades,
      topEmpresas,
      ultimos7,
      max7,
      totalVeiculos,
      totalEmpresas: empresas.filter((e) => e.ativo).length,
      totalEstoque,
      totalAtendimentos: atendimentos.length,
    };
  }, [dados]);

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div>
      <div className="max-w-2xl mx-auto px-2.5 py-3 space-y-2.5">
        {/* ── Atalhos rápidos ── */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => navigate("/agendamentos")}
            className="flex flex-col items-center gap-0.5 py-2 bg-surface border-2 border-border-custom
                       rounded-xl hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100
                       transition-colors cursor-pointer"
          >
            <CalendarPlus size={18} className="text-primary-500" />
            <span className="text-xs font-semibold text-text-secondary">
              Agendamentos
            </span>
          </button>
          <button
            onClick={() => navigate("/empresas")}
            className="flex flex-col items-center gap-0.5 py-2 bg-surface border-2 border-border-custom
                       rounded-xl hover:border-accent-400 hover:bg-accent-50 active:bg-accent-100
                       transition-colors cursor-pointer"
          >
            <Building2 size={18} className="text-accent-500" />
            <span className="text-xs font-semibold text-text-secondary">
              Empresas
            </span>
          </button>
          <button
            onClick={() => navigate("/estoque")}
            className="flex flex-col items-center gap-0.5 py-2 bg-surface border-2 border-border-custom
                       rounded-xl hover:border-primary-300 hover:bg-primary-50 active:bg-primary-100
                       transition-colors cursor-pointer"
          >
            <Package size={18} className="text-primary-600" />
            <span className="text-xs font-semibold text-text-secondary">
              Estoque
            </span>
          </button>
          <button
            onClick={() => navigate("/estatisticas")}
            className="flex flex-col items-center gap-0.5 py-2 bg-surface border-2 border-border-custom
                       rounded-xl hover:border-emerald-400 hover:bg-emerald-50 active:bg-emerald-100
                       transition-colors cursor-pointer"
          >
            <BarChart3 size={18} className="text-emerald-500" />
            <span className="text-xs font-semibold text-text-secondary">
              Dashboard
            </span>
          </button>
        </div>

        {/* ── Loading ── */}
        {carregando && (
          <div className="flex flex-col items-center justify-center py-16 text-text-disabled">
            <RefreshCw size={36} className="animate-spin mb-3" />
            <p className="text-base">Carregando dados…</p>
          </div>
        )}

        {/* ── Erro ── */}
        {!carregando && erro && (
          <div className="flex flex-col items-center justify-center py-16 text-red-500">
            <AlertCircle size={36} className="mb-3" />
            <p className="text-base font-semibold">Erro ao carregar</p>
            <p className="text-sm text-text-secondary mt-1">{erro}</p>
            <button
              onClick={buscar}
              className="mt-4 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold
                         hover:bg-primary-600 active:bg-primary-700 transition-colors cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* ═══════════ CONTEÚDO PRINCIPAL ═══════════ */}
        {!carregando && !erro && metricas && (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 gap-1.5">
              <KpiCard
                icone={<CalendarCheck size={20} />}
                label="Hoje"
                valor={metricas.diaHoje.length}
                cor="text-primary-500"
                bgCor="bg-primary-50"
              />
              <KpiCard
                icone={<Clock size={20} />}
                label="Pendentes"
                valor={metricas.porStatus.pendente || 0}
                cor="text-yellow-600"
                bgCor="bg-yellow-50"
              />
            </div>

            {/* ── Gráfico últimos 7 dias ── */}
            <section className="bg-surface rounded-xl border border-border-custom p-3 space-y-2">
              <h2 className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                <TrendingUp size={14} /> Últimos 7 dias
              </h2>
              <div className="flex items-end gap-1.5 h-28">
                {metricas.ultimos7.map((d, i) => {
                  const pct = (d.count / metricas.max7) * 100;
                  const isHoje = i === 6;
                  return (
                    <div
                      key={d.data}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs font-bold text-text-primary">
                        {d.count || ""}
                      </span>
                      <div
                        className="w-full flex items-end"
                        style={{ height: "80px" }}
                      >
                        <div
                          className={`w-full rounded-t-md transition-all ${
                            isHoje ? "bg-primary-500" : "bg-primary-200"
                          }`}
                          style={{
                            height: `${Math.max(pct, d.count > 0 ? 8 : 2)}%`,
                            minHeight: d.count > 0 ? "6px" : "2px",
                          }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-semibold ${
                          isHoje ? "text-primary-600" : "text-text-disabled"
                        }`}
                      >
                        {d.dia}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Mapa: Agendamentos de amanhã ── */}
            {dados.amanha.length > 0 && (
              <section className="bg-surface rounded-xl border border-border-custom p-4 space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-text-secondary">
                  <Map size={16} /> Amanhã &mdash; {dados.amanha.length}{" "}
                  agendamento{dados.amanha.length !== 1 && "s"}
                </h2>
                {/* Link para rota no Google Maps */}
                <a
                  href={`https://www.google.com/maps/dir/Governador+Valadares,MG/${dados.amanha
                    .map((a) =>
                      encodeURIComponent(a.endereco || a.cidade + ", MG"),
                    )
                    .join("/")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 text-xs font-semibold
                             text-white bg-accent-500 hover:bg-accent-600 active:bg-accent-700
                             rounded-xl transition-colors cursor-pointer"
                >
                  <Map size={16} /> Ver rota no Google Maps
                </a>
                {/* Lista dos agendamentos */}
                <div className="space-y-2">
                  {dados.amanha.map((a) => {
                    const hora = new Date(a.data).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const nome =
                      a.empresas?.nome_fantasia ||
                      a.empresas?.razao_social ||
                      "—";
                    return (
                      <a
                        key={a.id}
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.endereco || a.cidade)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 bg-bg rounded-lg
                                   hover:bg-primary-50 transition-colors"
                      >
                        <MapPin
                          size={14}
                          className="text-primary-500 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {a.cidade}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {nome} • {hora}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Agenda de hoje (resumo compacto) ── */}
            {metricas.diaHoje.length > 0 && (
              <section className="bg-surface rounded-xl border border-border-custom p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-text-secondary">
                    <Clock size={16} /> Agenda de Hoje
                  </h2>
                  <button
                    onClick={() => navigate("/agendamentos")}
                    className="text-xs font-semibold text-primary-500 hover:text-primary-700
                               cursor-pointer transition-colors"
                  >
                    Ver todos →
                  </button>
                </div>
                <div className="space-y-2">
                  {metricas.diaHoje
                    .sort((a, b) => new Date(a.data) - new Date(b.data))
                    .map((a) => {
                      const hora = new Date(a.data).toLocaleTimeString(
                        "pt-BR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      );
                      return (
                        <div
                          key={a.id}
                          className="flex items-center gap-3 px-3 py-2.5 bg-bg rounded-lg"
                        >
                          <span className="text-xs font-bold text-primary-600 w-12 shrink-0">
                            {hora}
                          </span>
                          <span className="text-sm text-text-primary flex-1 truncate">
                            {a.cidade}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-primary-100 text-primary-700">
                            {a.atendimento_veiculos?.length || 0} veíc.
                          </span>
                        </div>
                      );
                    })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* ══════════ FAB: NOVO AGENDAMENTO ══════════ */}
      <button
        onClick={() => navigate("/novo")}
        className="fixed bottom-5 right-5 w-11 h-11 bg-primary-500 hover:bg-primary-600
                   active:bg-primary-700 text-white rounded-full shadow-lg
                   flex items-center justify-center transition-colors cursor-pointer
                   z-50"
        title="Novo Agendamento"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Componentes auxiliares
   ══════════════════════════════════════════════════════ */

function KpiCard({ icone, label, valor, cor, bgCor }) {
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border border-border-custom ${bgCor}`}
    >
      <div className={`${cor}`}>{icone}</div>
      <div>
        <p className="text-lg font-bold text-text-primary">{valor}</p>
        <p className="text-[10px] text-text-secondary font-medium">{label}</p>
      </div>
    </div>
  );
}

function MiniKpi({ label, valor, icone }) {
  return (
    <div className="flex flex-col items-center gap-1 py-3 bg-surface rounded-xl border border-border-custom">
      <div className="text-text-disabled">{icone}</div>
      <p className="text-lg font-bold text-text-primary">{valor}</p>
      <p className="text-[10px] text-text-disabled font-medium text-center leading-tight px-1">
        {label}
      </p>
    </div>
  );
}
