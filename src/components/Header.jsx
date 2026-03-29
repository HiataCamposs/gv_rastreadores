import { ArrowLeft, Radio } from "lucide-react";

/**
 * Header fixo do App Shell.
 *
 * Props:
 *  - titulo       (string)  Texto principal do header
 *  - subtitulo    (string)  Texto secundário (ex.: data), opcional
 *  - icone        (ReactNode) Ícone ao lado do título, opcional
 *  - onVoltar     (fn)      Se passado, exibe botão ← para voltar
 *  - acaoExtra    (ReactNode) Elemento extra no lado direito (ex.: botão atualizar)
 */
export default function Header({
  titulo = "GV Rastreadores",
  icone,
  onVoltar,
  acaoExtra,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-2xl mx-auto flex items-center justify-between h-11">
        {/* ── Lado esquerdo ── */}
        <div className="flex items-center gap-3 min-w-0">
          {onVoltar ? (
            <button
              onClick={onVoltar}
              className="p-2 -ml-2 rounded-full hover:bg-primary-700 active:bg-primary-800
                         transition-colors cursor-pointer flex-shrink-0"
              title="Voltar"
            >
              <ArrowLeft size={22} />
            </button>
          ) : null}

          {icone && <span className="flex-shrink-0">{icone}</span>}

          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight truncate">
              {titulo}
            </h1>
          </div>
        </div>

        {/* ── Lado direito (ação extra) ── */}
        {acaoExtra && <div className="flex-shrink-0 ml-3">{acaoExtra}</div>}
      </div>
    </header>
  );
}
