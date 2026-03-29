import {
  Phone,
  MapPin,
  Car,
  Wrench,
  ArrowDownCircle,
  ArrowUpCircle,
  HelpCircle,
  Clock,
} from "lucide-react";

/* ── Mapeamento de tipo de serviço → ícone + cor ── */
const TIPO_CONFIG = {
  instalacao: {
    label: "Instalação",
    icon: ArrowDownCircle,
    cor: "bg-green-100 text-green-700",
  },
  retirada: {
    label: "Retirada",
    icon: ArrowUpCircle,
    cor: "bg-red-100 text-red-700",
  },
  troca: {
    label: "Troca",
    icon: HelpCircle,
    cor: "bg-yellow-100 text-yellow-700",
  },
  outros: {
    label: "Outros",
    icon: HelpCircle,
    cor: "bg-gray-100 text-gray-700",
  },
  manutencao: {
    label: "Manutenção",
    icon: Wrench,
    cor: "bg-accent-50 text-accent-700",
  },
};

/**
 * Card de atendimento — projetado para ser grande e fácil de tocar.
 *
 * Props:
 *  - cidade          (string)
 *  - responsavel     (string)
 *  - telefone        (string)  ex: "34999999999"
 *  - endereco        (string)  ex: "Rua X, 123, Cidade - MG"
 *  - tipo_servico    (string)  "instalacao" | "retirada" | "troca" | "manutencao"
 *  - veiculos        (array)   [{ placa, modelo }]
 */
export default function CardAtendimento({
  cidade,
  responsavel,
  telefone,
  endereco,
  tipo_servico,
  data,
  veiculos = [],
}) {
  const tipo = TIPO_CONFIG[tipo_servico] ?? TIPO_CONFIG.instalacao;
  const TipoIcon = tipo.icon;

  /* ── Horário formatado ── */
  const horario = data
    ? new Date(data).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  /* ── Ações ── */
  function ligar() {
    if (!telefone) return;
    // Remove tudo que não for dígito
    const tel = telefone.replace(/\D/g, "");
    window.open(`tel:${tel}`, "_self");
  }

  function abrirMapa() {
    if (!endereco) return;
    const query = encodeURIComponent(endereco);
    // Abre Google Maps (funciona em mobile e desktop)
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      "_blank"
    );
  }

  return (
    <div className="bg-surface rounded-2xl shadow-md border border-border-custom overflow-hidden">
      {/* ── Cabeçalho: cidade + tipo de serviço ── */}
      <div className="bg-accent-500 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="text-white" size={22} />
          <span className="text-white font-bold text-lg">{cidade}</span>
          {horario && (
            <span className="flex items-center gap-1 text-accent-100 text-sm font-medium ml-1">
              <Clock size={14} />
              {horario}
            </span>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${tipo.cor}`}
        >
          <TipoIcon size={14} />
          {tipo.label}
        </span>
      </div>

      {/* ── Corpo ── */}
      <div className="px-5 py-4 space-y-3">
        {/* Responsável */}
        <p className="text-base font-semibold text-text-primary leading-tight">
          {responsavel}
        </p>

        {/* Lista de veículos */}
        {veiculos.length > 0 && (
          <div className="space-y-1">
            {veiculos.map((v) => (
              <div
                key={v.id ?? v.placa}
                className="flex items-center gap-2 bg-surface-alt rounded-lg px-3 py-2"
              >
                <Car size={18} className="text-text-secondary shrink-0" />
                <span className="font-mono text-sm font-bold text-text-primary tracking-wide">
                  {v.placa}
                </span>
                <span className="text-sm text-text-secondary">
                  — {v.modelo}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Botões de ação (grandes para facilitar o toque) ── */}
      <div className="grid grid-cols-2 border-t border-border-custom">
        <button
          onClick={ligar}
          disabled={!telefone}
          className="flex items-center justify-center gap-2 py-4 text-base font-semibold
                     text-success bg-green-50 hover:bg-green-100 active:bg-green-200
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                     border-r border-border-custom cursor-pointer"
        >
          <Phone size={22} />
          Ligar
        </button>

        <button
          onClick={abrirMapa}
          disabled={!endereco}
          className="flex items-center justify-center gap-2 py-4 text-base font-semibold
                     text-accent-600 bg-accent-50 hover:bg-accent-100 active:bg-accent-200
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                     cursor-pointer"
        >
          <MapPin size={22} />
          Mapa
        </button>
      </div>
    </div>
  );
}
