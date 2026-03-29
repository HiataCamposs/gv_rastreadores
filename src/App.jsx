import { useState } from "react";
import {
  Radio,
  CalendarPlus,
  Building2,
  Package,
  Calendar,
} from "lucide-react";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import NovoAgendamento from "./pages/NovoAgendamento";
import Agendamentos from "./pages/Agendamentos";
import Empresas from "./pages/Empresas";
import Estoque from "./pages/Estoque";

/* ── Configuração de cada página ── */
const CONFIG_PAGINAS = {
  dashboard: {
    titulo: "GV Rastreadores",
    icone: <Radio size={22} />,
  },
  novo: {
    titulo: "Novo Agendamento",
    icone: <CalendarPlus size={22} />,
    temVoltar: true,
  },
  agendamentos: {
    titulo: "Agendamentos",
    icone: <Calendar size={22} />,
    temVoltar: true,
  },
  empresas: {
    titulo: "Empresas",
    icone: <Building2 size={22} />,
    temVoltar: true,
  },
  estoque: {
    titulo: "Estoque",
    icone: <Package size={22} />,
    temVoltar: true,
  },
};

function App() {
  const [pagina, setPagina] = useState("dashboard");
  const config = CONFIG_PAGINAS[pagina] || CONFIG_PAGINAS.dashboard;

  const voltar = () => setPagina("dashboard");

  /* ── Conteúdo do header (ação extra) vem do Dashboard ── */
  /* Será passado via callback */
  const [acaoHeader, setAcaoHeader] = useState(null);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ══════════ HEADER FIXO ══════════ */}
      <Header
        titulo={config.titulo}
        icone={config.icone}
        onVoltar={config.temVoltar ? voltar : undefined}
        acaoExtra={acaoHeader}
      />

      {/* ══════════ CONTEÚDO ROLÁVEL ══════════ */}
      <main className="flex-1 pt-[68px]">
        {pagina === "dashboard" && (
          <Dashboard
            onNovoAgendamento={() => setPagina("novo")}
            onAgendamentos={() => setPagina("agendamentos")}
            onEmpresas={() => setPagina("empresas")}
            onEstoque={() => setPagina("estoque")}
            onAcaoHeader={setAcaoHeader}
          />
        )}
        {pagina === "novo" && <NovoAgendamento onVoltar={voltar} />}
        {pagina === "agendamentos" && <Agendamentos />}
        {pagina === "empresas" && <Empresas />}
        {pagina === "estoque" && <Estoque />}
      </main>
    </div>
  );
}

export default App;
