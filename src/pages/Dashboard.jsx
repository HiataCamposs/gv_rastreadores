import { useEffect, useMemo, useState } from "react";
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
};

const STATUS_LABEL = {
  pendente: "Pendentes",
  em_andamento: "Em andamento",
  concluido: "Concluídos",
  cancelado: "Cancelados",
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

export default function Dashboard({
  onNovoAgendamento,
  onAgendamentos,
  onEmpresas,
  onEstoque,
  onAcaoHeader,
}) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [dados, setDados] = useState(null);

  async function buscar() {
    setCarregando(true);
    setErro(null);

    try {
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      const [resAtend, resEmpresas, resEstoque] = await Promise.all([
        supabase
          .from("atendimentos")
          .select(
            `id, data, cidade, tipo_servico, status, empresa_id,
             empresas ( razao_social, nome_fantasia ),
             atendimento_veiculos ( id )`
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
      ]);

      if (resAtend.error) throw resAtend.error;
      if (resEmpresas.error) throw resEmpresas.error;
      if (resEstoque.error) throw resEstoque.error;

      setDados({
        atendimentos: resAtend.data ?? [],
        empresas: resEmpresas.data ?? [],
        estoque: resEstoque.data ?? [],
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
      </button>
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
      hoje.getDate()
    );
    const fimDia = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
      23,
      59,
      59,
      999
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
        999
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
      0
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
      0
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
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* ── Atalhos rápidos ── */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={onAgendamentos}
            className="flex flex-col items-center gap-1.5 py-4 bg-surface border-2 border-border-custom
                       rounded-xl hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100
                       transition-colors cursor-pointer"
          >
            <CalendarPlus size={24} className="text-primary-500" />
            <span className="text-xs font-semibold text-text-secondary">
              Agendamentos
            </span>
          </button>
          <button
            onClick={onEmpresas}
            className="flex flex-col items-center gap-1.5 py-4 bg-surface border-2 border-border-custom
                       rounded-xl hover:border-accent-400 hover:bg-accent-50 active:bg-accent-100
                       transition-colors cursor-pointer"
          >
            <Building2 size={24} className="text-accent-500" />
            <span className="text-xs font-semibold text-text-secondary">
              Empresas
            </span>
          </button>
          <button
            onClick={onEstoque}
            className="flex flex-col items-center gap-1.5 py-4 bg-surface border-2 border-border-custom
                       rounded-xl hover:border-primary-300 hover:bg-primary-50 active:bg-primary-100
                       transition-colors cursor-pointer"
          >
            <Package size={24} className="text-primary-600" />
            <span className="text-xs font-semibold text-text-secondary">
              Estoque
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
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                icone={<CalendarCheck size={22} />}
                label="Hoje"
                valor={metricas.diaHoje.length}
                cor="text-primary-500"
                bgCor="bg-primary-50"
              />
              <KpiCard
                icone={<Clock size={22} />}
                label="Pendentes"
                valor={metricas.porStatus.pendente || 0}
                cor="text-yellow-600"
                bgCor="bg-yellow-50"
              />
              <KpiCard
                icone={<CheckCircle2 size={22} />}
                label="Concluídos"
                valor={metricas.porStatus.concluido || 0}
                cor="text-green-600"
                bgCor="bg-green-50"
              />
              <KpiCard
                icone={<Car size={22} />}
                label="Veículos"
                valor={metricas.totalVeiculos}
                cor="text-accent-500"
                bgCor="bg-accent-50"
              />
            </div>

            {/* ── Resumo numérico ── */}
            <div className="grid grid-cols-3 gap-3">
              <MiniKpi
                label="Empresas ativas"
                valor={metricas.totalEmpresas}
                icone={<Building2 size={16} />}
              />
              <MiniKpi
                label="Equipamentos"
                valor={metricas.totalEstoque}
                icone={<Package size={16} />}
              />
              <MiniKpi
                label="Atendimentos (30d)"
                valor={metricas.totalAtendimentos}
                icone={<BarChart3 size={16} />}
              />
            </div>

            {/* ── Gráfico últimos 7 dias ── */}
            <section className="bg-surface rounded-xl border border-border-custom p-4 space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-text-secondary">
                <TrendingUp size={16} /> Últimos 7 dias
              </h2>
              <div className="flex items-end gap-2 h-32">
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

            {/* ── Status dos atendimentos (30d) ── */}
            <section className="bg-surface rounded-xl border border-border-custom p-4 space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-text-secondary">
                <CalendarCheck size={16} /> Status (últimos 30 dias)
              </h2>

              {metricas.totalAtendimentos > 0 && (
                <div className="flex rounded-full overflow-hidden h-4">
                  {Object.entries(metricas.porStatus).map(([status, count]) => {
                    const pct = (count / metricas.totalAtendimentos) * 100;
                    return (
                      <div
                        key={status}
                        className={`${STATUS_COR[status] || "bg-gray-300"}`}
                        style={{ width: `${pct}%` }}
                        title={`${STATUS_LABEL[status]}: ${count}`}
                      />
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(metricas.porStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        STATUS_COR[status] || "bg-gray-300"
                      }`}
                    />
                    <span className="text-xs text-text-secondary">
                      {STATUS_LABEL[status] || status}
                    </span>
                    <span className="text-xs font-bold text-text-primary ml-auto">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Tipo de serviço ── */}
            <section className="bg-surface rounded-xl border border-border-custom p-4 space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-text-secondary">
                <Wrench size={16} /> Tipo de Serviço (30d)
              </h2>
              <div className="space-y-2">
                {Object.entries(metricas.porTipo)
                  .sort((a, b) => b[1] - a[1])
                  .map(([tipo, count]) => {
                    const pct = (count / metricas.totalAtendimentos) * 100;
                    return (
                      <div key={tipo} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-text-secondary">
                            {TIPO_LABEL[tipo] || tipo}
                          </span>
                          <span className="font-bold text-text-primary">
                            {count} ({Math.round(pct)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-bg rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              TIPO_COR[tipo] || "bg-gray-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* ── Top Cidades ── */}
            {metricas.topCidades.length > 0 && (
              <section className="bg-surface rounded-xl border border-border-custom p-4 space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-text-secondary">
                  <MapPin size={16} /> Top Cidades (30d)
                </h2>
                <div className="space-y-2">
                  {metricas.topCidades.map(([cidade, count], i) => (
                    <div key={cidade} className="flex items-center gap-3">
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-text-primary flex-1 truncate">
                        {cidade}
                      </span>
                      <span className="text-sm font-bold text-text-primary">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Top Empresas ── */}
            {metricas.topEmpresas.length > 0 && (
              <section className="bg-surface rounded-xl border border-border-custom p-4 space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-text-secondary">
                  <Building2 size={16} /> Top Empresas (30d)
                </h2>
                <div className="space-y-2">
                  {metricas.topEmpresas.map(([empresa, count], i) => (
                    <div key={empresa} className="flex items-center gap-3">
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-accent-100 text-accent-700 text-[10px] font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-text-primary flex-1 truncate">
                        {empresa}
                      </span>
                      <span className="text-sm font-bold text-text-primary">
                        {count}
                      </span>
                    </div>
                  ))}
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
                    onClick={onAgendamentos}
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
                        }
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
        onClick={onNovoAgendamento}
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary-500 hover:bg-primary-600
                   active:bg-primary-700 text-white rounded-full shadow-xl
                   flex items-center justify-center transition-colors cursor-pointer
                   z-50"
        title="Novo Agendamento"
      >
        <Plus size={32} strokeWidth={2.5} />
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
      className={`flex items-center gap-3 p-4 rounded-xl border border-border-custom ${bgCor}`}
    >
      <div className={`${cor}`}>{icone}</div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{valor}</p>
        <p className="text-xs text-text-secondary font-medium">{label}</p>
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
