import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  AlertCircle,
  Wrench,
  MapPin,
  Building2,
  BarChart3,
  Car,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const TIPO_LABEL = {
  instalacao: "Instalação",
  retirada: "Retirada",
  manutencao: "Manutenção",
  outros: "Outros",
};

const TIPO_COR = {
  instalacao: "#f97316",
  retirada: "#3b82f6",
  manutencao: "#eab308",
  outros: "#9ca3af",
};

/* Helpers de data (horário de São Paulo) */
function hojeISO() {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Sao_Paulo",
  });
}
function defaultInicio() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}
function defaultFim() {
  return hojeISO();
}

export default function Estatisticas() {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [atendimentos, setAtendimentos] = useState([]);
  const [modo, setModo] = useState("agendamentos"); // "agendamentos" | "veiculos"

  const [dataInicio, setDataInicio] = useState(defaultInicio);
  const [dataFim, setDataFim] = useState(defaultFim);

  async function buscar() {
    setCarregando(true);
    setErro(null);
    try {
      const inicio = new Date(dataInicio + "T00:00:00").toISOString();
      const fim = new Date(dataFim + "T23:59:59").toISOString();

      const { data, error } = await supabase
        .from("atendimentos")
        .select(
          `id, cidade, tipo_servico, empresa_id,
           empresas ( razao_social, nome_fantasia ),
           atendimento_veiculos ( id, placa, modelo )`,
        )
        .gte("data", inicio)
        .lte("data", fim)
        .is("deleted_at", null);

      if (error) throw error;
      setAtendimentos(data ?? []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metricas = useMemo(() => {
    if (!atendimentos.length) return null;

    const total = atendimentos.length;

    /* Tipo de serviço */
    const porTipo = {};
    atendimentos.forEach((a) => {
      porTipo[a.tipo_servico] = (porTipo[a.tipo_servico] || 0) + 1;
    });

    /* Top cidades */
    const porCidade = {};
    atendimentos.forEach((a) => {
      porCidade[a.cidade] = (porCidade[a.cidade] || 0) + 1;
    });
    const topCidades = Object.entries(porCidade)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    /* Top empresas */
    const porEmpresa = {};
    atendimentos.forEach((a) => {
      const nome = a.empresas?.nome_fantasia || a.empresas?.razao_social || "—";
      porEmpresa[nome] = (porEmpresa[nome] || 0) + 1;
    });
    const topEmpresas = Object.entries(porEmpresa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    /* ── Métricas contadas por veículos ── */
    const veiculosComContexto = atendimentos.flatMap((a) =>
      (a.atendimento_veiculos || []).map(() => ({
        tipo: a.tipo_servico,
        cidade: a.cidade,
        empresa: a.empresas?.nome_fantasia || a.empresas?.razao_social || "—",
      })),
    );
    const totalVeiculos = veiculosComContexto.length;

    const porTipoVeic = {};
    veiculosComContexto.forEach((v) => {
      porTipoVeic[v.tipo] = (porTipoVeic[v.tipo] || 0) + 1;
    });

    const porCidadeVeic = {};
    veiculosComContexto.forEach((v) => {
      porCidadeVeic[v.cidade] = (porCidadeVeic[v.cidade] || 0) + 1;
    });
    const topCidadesVeic = Object.entries(porCidadeVeic)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const porEmpresaVeic = {};
    veiculosComContexto.forEach((v) => {
      porEmpresaVeic[v.empresa] = (porEmpresaVeic[v.empresa] || 0) + 1;
    });
    const topEmpresasVeic = Object.entries(porEmpresaVeic)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      total,
      porTipo,
      topCidades,
      topEmpresas,
      totalVeiculos,
      porTipoVeic,
      topCidadesVeic,
      topEmpresasVeic,
    };
  }, [atendimentos]);

  return (
    <div className="max-w-2xl mx-auto px-2.5 py-3 space-y-2.5">
      {/* Header */}
      <h1 className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
        <BarChart3 size={18} className="text-primary-500" /> Estatísticas
      </h1>

      {/* Toggle Agendamentos / Veículos */}
      <div className="flex rounded-xl overflow-hidden border border-border-custom bg-bg-custom">
        <button
          onClick={() => setModo("agendamentos")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors cursor-pointer
            ${
              modo === "agendamentos"
                ? "bg-primary-500 text-white"
                : "text-text-secondary hover:bg-primary-50"
            }`}
        >
          <BarChart3 size={14} /> Agendamentos
        </button>
        <button
          onClick={() => setModo("veiculos")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors cursor-pointer
            ${
              modo === "veiculos"
                ? "bg-primary-500 text-white"
                : "text-text-secondary hover:bg-primary-50"
            }`}
        >
          <Car size={14} /> Veículos
        </button>
      </div>

      {/* Período */}
      <div className="bg-surface rounded-xl border border-border-custom p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              De:
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-bg-custom border border-border-custom rounded-lg
                         focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Até:
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-bg-custom border border-border-custom rounded-lg
                         focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-colors"
            />
          </div>
        </div>
        <button
          onClick={buscar}
          disabled={carregando}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold
                     text-white bg-primary-500 hover:bg-primary-600 active:bg-primary-700
                     rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={carregando ? "animate-spin" : ""} />
          Buscar
        </button>
      </div>

      {/* Loading */}
      {carregando && (
        <div className="flex flex-col items-center justify-center py-16 text-text-disabled">
          <RefreshCw size={36} className="animate-spin mb-3" />
          <p className="text-base">Carregando dados…</p>
        </div>
      )}

      {/* Erro */}
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

      {/* Sem dados */}
      {!carregando && !erro && !metricas && (
        <p className="text-center text-text-disabled py-10">
          Nenhum atendimento nos últimos 30 dias.
        </p>
      )}

      {/* Conteúdo */}
      {!carregando && !erro && metricas && (
        <>
          {/* ── Tipo de Serviço (Rosca) ── */}
          <section className="bg-surface rounded-xl border border-border-custom p-3 space-y-2">
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
              <Wrench size={14} /> Tipo de Serviço
              <span className="text-xs font-normal text-text-disabled ml-auto">
                por {modo === "agendamentos" ? "agendamento" : "veículo"}
              </span>
            </h2>
            {modo === "agendamentos" ? (
              <GraficoRosca dados={metricas.porTipo} total={metricas.total} />
            ) : metricas.totalVeiculos > 0 ? (
              <GraficoRosca
                dados={metricas.porTipoVeic}
                total={metricas.totalVeiculos}
              />
            ) : (
              <p className="text-center text-text-disabled py-4 text-sm">
                Nenhum veículo no período.
              </p>
            )}
          </section>

          {/* ── Top Cidades ── */}
          {(modo === "agendamentos"
            ? metricas.topCidades
            : metricas.topCidadesVeic
          ).length > 0 && (
            <section className="bg-surface rounded-xl border border-border-custom p-3 space-y-2">
              <h2 className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                <MapPin size={14} /> Top Cidades
                <span className="text-xs font-normal text-text-disabled ml-auto">
                  por {modo === "agendamentos" ? "agendamento" : "veículo"}
                </span>
              </h2>
              <GraficoBarras
                dados={
                  modo === "agendamentos"
                    ? metricas.topCidades
                    : metricas.topCidadesVeic
                }
                cor="#f97316"
              />
            </section>
          )}

          {/* ── Top Empresas ── */}
          {(modo === "agendamentos"
            ? metricas.topEmpresas
            : metricas.topEmpresasVeic
          ).length > 0 && (
            <section className="bg-surface rounded-xl border border-border-custom p-3 space-y-2">
              <h2 className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                <Building2 size={14} /> Top Empresas
                <span className="text-xs font-normal text-text-disabled ml-auto">
                  por {modo === "agendamentos" ? "agendamento" : "veículo"}
                </span>
              </h2>
              <GraficoBarras
                dados={
                  modo === "agendamentos"
                    ? metricas.topEmpresas
                    : metricas.topEmpresasVeic
                }
                cor="#3b82f6"
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Gráfico de Rosca (SVG puro)
   ══════════════════════════════════════════════════════ */
function GraficoRosca({ dados, total }) {
  const entries = Object.entries(dados).sort((a, b) => b[1] - a[1]);
  const tamanho = 140;
  const raio = 60;
  const espessura = 22;
  const raioInterno = raio - espessura;
  const cx = tamanho / 2;
  const cy = tamanho / 2;

  /* Calcula os arcos */
  const fatias = entries.reduce((acc, [tipo, count]) => {
    const anguloAnterior =
      acc.length > 0
        ? acc[acc.length - 1].inicio + acc[acc.length - 1].angulo
        : -90;
    const pct = count / total;
    const angulo = pct * 360;
    acc.push({ tipo, count, pct, inicio: anguloAnterior, angulo });
    return acc;
  }, []);

  function polarParaXY(angulo, r) {
    const rad = (angulo * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function descreverArco(inicio, angulo) {
    const fim = inicio + angulo;
    const large = angulo > 180 ? 1 : 0;
    const p1 = polarParaXY(inicio, raio);
    const p2 = polarParaXY(fim, raio);
    const p3 = polarParaXY(fim, raioInterno);
    const p4 = polarParaXY(inicio, raioInterno);
    return `M ${p1.x} ${p1.y} A ${raio} ${raio} 0 ${large} 1 ${p2.x} ${p2.y}
            L ${p3.x} ${p3.y} A ${raioInterno} ${raioInterno} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG da rosca */}
      <svg viewBox={`0 0 ${tamanho} ${tamanho}`} className="w-44 h-44">
        {fatias.map((f) => (
          <path
            key={f.tipo}
            d={descreverArco(f.inicio, f.angulo - 1)}
            fill={TIPO_COR[f.tipo] || "#9ca3af"}
          />
        ))}
        {/* Total no centro */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="text-2xl font-bold"
          fill="currentColor"
          style={{ fontSize: "28px", fontWeight: 700 }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill="#9ca3af"
          style={{ fontSize: "10px" }}
        >
          atendimentos
        </text>
      </svg>

      {/* Legenda */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {fatias.map((f) => (
          <div key={f.tipo} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: TIPO_COR[f.tipo] || "#9ca3af" }}
            />
            <span className="text-xs text-text-secondary">
              {TIPO_LABEL[f.tipo] || f.tipo}
            </span>
            <span className="text-xs font-bold text-text-primary">
              {f.count} ({Math.round(f.pct * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Gráfico de Barras Horizontal
   ══════════════════════════════════════════════════════ */
function GraficoBarras({ dados, cor }) {
  const max = Math.max(...dados.map(([, c]) => c), 1);

  return (
    <div className="space-y-2">
      {dados.map(([label, count]) => {
        const pct = (count / max) * 100;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className="text-xs text-text-secondary truncate shrink-0"
              style={{ width: "90px" }}
              title={label}
            >
              {label}
            </span>
            <div className="flex-1 h-6 bg-bg rounded-md overflow-hidden relative">
              <div
                className="h-full rounded-md transition-all"
                style={{
                  width: `${Math.max(pct, 4)}%`,
                  backgroundColor: cor,
                  opacity: 0.6 + (pct / 100) * 0.4,
                }}
              />
            </div>
            <span className="text-xs font-bold text-text-primary w-6 text-right shrink-0">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
