-- ============================================================
-- GV RASTREADORES — Script de criação do banco de dados
-- Execute no Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- ╔══════════════════════════════════════════════════════════╗
-- ║  1. EMPRESAS                                            ║
-- ║  Empresas clientes que fornecem os rastreadores.        ║
-- ║  Campos completos para emissão de NFS-e.                ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS empresas (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cnpj                 TEXT        UNIQUE,               -- CNPJ formatado ou só números
  razao_social         TEXT        NOT NULL,              -- nome jurídico (obrigatório)
  nome_fantasia        TEXT,                              -- nome comercial
  inscricao_municipal  TEXT,                              -- para NFS-e
  inscricao_estadual   TEXT,                              -- se contribuinte ICMS
  logradouro           TEXT,                              -- rua/av
  numero               TEXT,
  complemento          TEXT,
  bairro               TEXT,
  cidade               TEXT,
  uf                   TEXT,                              -- sigla do estado (2 chars)
  cep                  TEXT,
  email                TEXT,                              -- para envio da NFS-e
  telefone             TEXT,
  observacoes          TEXT,
  ativo                BOOLEAN     NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ╔══════════════════════════════════════════════════════════╗
-- ║  2. ESTOQUE                                             ║
-- ║  Controle de rastreadores recebidos das empresas.       ║
-- ║  Cada linha = 1 lote/entrada de equipamentos.           ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS estoque (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  empresa_id     BIGINT      NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  modelo_equipamento TEXT    NOT NULL,       -- ex: "GT06N", "ST-901"
  quantidade     INTEGER     NOT NULL DEFAULT 1,
  data_recebimento DATE     NOT NULL DEFAULT CURRENT_DATE,
  observacoes    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ╔══════════════════════════════════════════════════════════╗
-- ║  3. ATENDIMENTOS                                        ║
-- ║  Cada agendamento de serviço.                           ║
-- ║  Agrupados por cidade para planejar a rota diária.      ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS atendimentos (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  empresa_id     BIGINT      NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data           TIMESTAMPTZ NOT NULL,       -- data/hora do agendamento
  cidade         TEXT        NOT NULL,
  responsavel    TEXT        NOT NULL,        -- nome de quem recebe o técnico
  tipo_responsavel TEXT       NOT NULL DEFAULT 'funcionario'
                   CHECK (tipo_responsavel IN ('funcionario','proprietario','outros')),
  telefone       TEXT        NOT NULL,
  endereco       TEXT,                        -- endereço completo p/ Google Maps
  tipo_servico   TEXT        NOT NULL DEFAULT 'instalacao'
                   CHECK (tipo_servico IN ('instalacao','manutencao','outros','retirada')),
  status         TEXT        NOT NULL DEFAULT 'pendente'
                   CHECK (status IN ('pendente','em_andamento','concluido','cancelado')),
  observacoes    TEXT,
  distancia_km   INTEGER,                  -- distância rodoviária (km) de GV, estimada via IA
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ╔══════════════════════════════════════════════════════════╗
-- ║  4. ATENDIMENTO_VEICULOS                                ║
-- ║  Veículos vinculados a cada atendimento.                ║
-- ║  Um atendimento pode ter N veículos.                    ║
-- ║  O mesmo veículo (placa) pode aparecer em vários        ║
-- ║  atendimentos diferentes (manutenções futuras etc).     ║
-- ╚══════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS atendimento_veiculos (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  atendimento_id  BIGINT NOT NULL REFERENCES atendimentos(id) ON DELETE CASCADE,
  placa           TEXT   NOT NULL,
  modelo          TEXT   NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_atendimentos_data     ON atendimentos(data);
CREATE INDEX IF NOT EXISTS idx_atendimentos_cidade   ON atendimentos(cidade);
CREATE INDEX IF NOT EXISTS idx_atendimentos_status   ON atendimentos(status);
CREATE INDEX IF NOT EXISTS idx_atendimentos_empresa  ON atendimentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_atend_veiculos_atend  ON atendimento_veiculos(atendimento_id);
CREATE INDEX IF NOT EXISTS idx_atend_veiculos_placa  ON atendimento_veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_estoque_empresa       ON estoque(empresa_id);

-- ============================================================
-- DADOS DE EXEMPLO (opcional — apague se não quiser)
-- ============================================================
INSERT INTO empresas (razao_social, nome_fantasia, cnpj, inscricao_municipal, logradouro, numero, bairro, cidade, uf, cep, email, telefone) VALUES
  ('RastroTech Ltda',       'RastroTech',    '12.345.678/0001-90', '12345', 'Av. Brasil',         '1500', 'Centro',       'Uberlândia', 'MG', '38400-100', 'contato@rastrotech.com.br', '3432001000'),
  ('GPS Solutions Ltda',    'GPS Solutions', '98.765.432/0001-10', '67890', 'Rua Goiás',          '300',  'Martins',      'Uberlândia', 'MG', '38400-200', 'nfe@gpssolutions.com.br',   '3432002000'),
  ('TrackMaster Brasil SA', 'TrackMaster',   '11.222.333/0001-44', '11223', 'Rua Pará',           '800',  'Saraiva',      'Uberlândia', 'MG', '38400-300', 'fiscal@trackmaster.com.br', '3432003000');

INSERT INTO estoque (empresa_id, modelo_equipamento, quantidade, data_recebimento) VALUES
  (1, 'GT06N',   10, '2026-03-25'),
  (1, 'ST-901',   5, '2026-03-26'),
  (2, 'TK-103B',  8, '2026-03-27'),
  (3, 'GT06N',    3, '2026-03-28');

INSERT INTO atendimentos (empresa_id, data, cidade, responsavel, tipo_responsavel, telefone, endereco, tipo_servico, status) VALUES
  (1, '2026-03-29T09:00:00Z', 'Uberlândia',  'João Silva',      'funcionario',   '34999991111', 'Av. Rondon Pacheco, 1000, Uberlândia - MG',      'instalacao', 'pendente'),
  (1, '2026-03-29T10:30:00Z', 'Uberlândia',  'Maria Souza',     'proprietario',  '34999992222', 'Rua Olegário Maciel, 500, Uberlândia - MG',       'instalacao', 'pendente'),
  (2, '2026-03-29T14:00:00Z', 'Uberaba',     'Carlos Oliveira', 'funcionario',   '34999993333', 'Rua Major Eustáquio, 200, Uberaba - MG',          'outros',     'pendente'),
  (3, '2026-03-29T08:00:00Z', 'Uberlândia',  'Ana Costa',       'proprietario',  '34999994444', 'Rua Santos Dumont, 750, Uberlândia - MG',         'manutencao', 'pendente');

INSERT INTO atendimento_veiculos (atendimento_id, placa, modelo) VALUES
  (1, 'ABC1D23', 'Fiat Strada 2022'),
  (1, 'XYZ4E56', 'VW Gol 2020'),
  (2, 'DEF7G89', 'Toyota Hilux 2023'),
  (3, 'GHI0J12', 'Chevrolet S10 2021'),
  (3, 'KLM3N45', 'Fiat Toro 2022'),
  (4, 'OPQ6R78', 'Honda Civic 2020');
