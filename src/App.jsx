import { useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import {
  Radio,
  CalendarPlus,
  Building2,
  Package,
  Calendar,
  BarChart3,
} from "lucide-react";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import NovoAgendamento from "./pages/NovoAgendamento";
import Agendamentos from "./pages/Agendamentos";
import Empresas from "./pages/Empresas";
import Estoque from "./pages/Estoque";
import FinalizarAtendimento from "./pages/FinalizarAtendimento";
import EditarAtendimento from "./pages/EditarAtendimento";
import Estatisticas from "./pages/Estatisticas";

/* == Configuracao de cada rota == */
const CONFIG_ROTAS = {
  "/": {
    titulo: "GV Rastreadores",
    icone: <Radio size={22} />,
  },
  "/novo": {
    titulo: "Novo Agendamento",
    icone: <CalendarPlus size={22} />,
    temVoltar: true,
  },
  "/agendamentos": {
    titulo: "Agendamentos",
    icone: <Calendar size={22} />,
    temVoltar: true,
  },
  "/empresas": {
    titulo: "Empresas",
    icone: <Building2 size={22} />,
    temVoltar: true,
  },
  "/estoque": {
    titulo: "Estoque",
    icone: <Package size={22} />,
    temVoltar: true,
  },
  "/estatisticas": {
    titulo: "Dashboard",
    icone: <BarChart3 size={22} />,
    temVoltar: true,
  },
};

/* Rotas dinâmicas (com parâmetros) */
function getConfig(pathname) {
  if (pathname.startsWith("/finalizar/")) {
    return {
      titulo: "Finalizar Atendimento",
      icone: <Calendar size={22} />,
      temVoltar: true,
    };
  }
  if (pathname.startsWith("/editar/")) {
    return {
      titulo: "Editar Agendamento",
      icone: <CalendarPlus size={22} />,
      temVoltar: true,
    };
  }
  return CONFIG_ROTAS[pathname] || CONFIG_ROTAS["/"];
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = getConfig(location.pathname);

  /* Acao extra do header (ex.: botao atualizar do Dashboard) */
  const [acaoHeader, setAcaoHeader] = useState(null);

  const voltar = () => navigate(-1);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* HEADER FIXO */}
      <Header
        titulo={config.titulo}
        icone={config.icone}
        onVoltar={config.temVoltar ? voltar : undefined}
        acaoExtra={acaoHeader}
      />

      {/* CONTEUDO ROLAVEL */}
      <main className="flex-1 pt-[68px]">
        <Routes>
          <Route
            path="/"
            element={<Dashboard onAcaoHeader={setAcaoHeader} />}
          />
          <Route path="/novo" element={<NovoAgendamento />} />
          <Route path="/agendamentos" element={<Agendamentos />} />
          <Route path="/empresas" element={<Empresas />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/finalizar/:id" element={<FinalizarAtendimento />} />
          <Route path="/editar/:id" element={<EditarAtendimento />} />
          <Route path="/estatisticas" element={<Estatisticas />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
