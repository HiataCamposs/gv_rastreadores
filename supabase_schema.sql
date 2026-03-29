-- ============================================================
-- GV RASTREADORES — Script de criação do banco de dados
-- Execute no Supabase SQL Editor (https://supabase.com/dashboard)
-- ⚠️  Este script APAGA e RECRIA todas as tabelas do zero.
-- ============================================================

-- Limpar tabelas na ordem correta (dependências primeiro)
DROP TABLE IF EXISTS atendimento_veiculos CASCADE;
DROP TABLE IF EXISTS atendimentos         CASCADE;
DROP TABLE IF EXISTS estoque              CASCADE;
DROP TABLE IF EXISTS empresas             CASCADE;

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
  deleted_at           TIMESTAMPTZ,                       -- soft delete
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
  deleted_at     TIMESTAMPTZ,                -- soft delete
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
  deleted_at     TIMESTAMPTZ,                -- soft delete
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

-- Índices parciais: queries ignoram registros soft-deleted
CREATE INDEX IF NOT EXISTS idx_empresas_not_deleted      ON empresas(id)          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_estoque_not_deleted       ON estoque(id)           WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_atendimentos_not_deleted  ON atendimentos(id)      WHERE deleted_at IS NULL;

-- ============================================================
-- DESABILITAR RLS (projeto pessoal, sem multi-tenancy)
-- ============================================================
ALTER TABLE empresas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque               ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimento_veiculos  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total empresas"             ON empresas;
DROP POLICY IF EXISTS "Acesso total estoque"              ON estoque;
DROP POLICY IF EXISTS "Acesso total atendimentos"         ON atendimentos;
DROP POLICY IF EXISTS "Acesso total atendimento_veiculos" ON atendimento_veiculos;

CREATE POLICY "Acesso total empresas"             ON empresas             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total estoque"              ON estoque              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total atendimentos"         ON atendimentos         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total atendimento_veiculos" ON atendimento_veiculos FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DADOS INICIAIS (mockados para testes)
-- ============================================================

-- Empresas
INSERT INTO empresas (razao_social, nome_fantasia, cnpj, inscricao_municipal, logradouro, numero, bairro, cidade, uf, cep, email, telefone) VALUES
  ('RastroTech Ltda',       'RastroTech',    '12.345.678/0001-90', '12345', 'Av. Brasil',              '1500', 'Centro',         'Governador Valadares', 'MG', '35010-000', 'contato@rastrotech.com.br', '3332001000'),
  ('GPS Solutions Ltda',    'GPS Solutions',  '98.765.432/0001-10', '67890', 'Rua Israel Pinheiro',     '300',  'Centro',         'Governador Valadares', 'MG', '35010-050', 'nfe@gpssolutions.com.br',   '3332002000'),
  ('TrackMaster Brasil SA', 'TrackMaster',    '11.222.333/0001-44', '11223', 'Av. Minas Gerais',        '800',  'Centro',         'Ipatinga',             'MG', '35160-000', 'fiscal@trackmaster.com.br', '3138003000');

-- Estoque
INSERT INTO estoque (empresa_id, modelo_equipamento, quantidade, data_recebimento) VALUES
  (1, 'GT06N',    10, '2026-03-20'),
  (1, 'ST-901',    5, '2026-03-22'),
  (2, 'TK-103B',   8, '2026-03-24'),
  (2, 'GT06N',     6, '2026-03-25'),
  (3, 'GT06N',     3, '2026-03-26'),
  (3, 'CRX-3',     4, '2026-03-27');

-- Atendimentos (variados: hoje, passados, futuros, vários status e cidades da região)
INSERT INTO atendimentos (empresa_id, data, cidade, responsavel, tipo_responsavel, telefone, endereco, tipo_servico, status, distancia_km) VALUES
  -- Hoje
  (1, '2026-03-29T08:00:00Z', 'Governador Valadares', 'João Silva',       'funcionario',  '33999991111', 'Av. Brasil, 1500, Centro, Governador Valadares - MG',        'instalacao',  'pendente',     0),
  (1, '2026-03-29T10:30:00Z', 'Governador Valadares', 'Maria Souza',      'proprietario', '33999992222', 'Rua Marechal Floriano, 200, Santa Terezinha, GV - MG',        'instalacao',  'pendente',     0),
  (2, '2026-03-29T14:00:00Z', 'Ipatinga',             'Carlos Oliveira',  'funcionario',  '31999993333', 'Av. Itália, 800, Iguaçu, Ipatinga - MG',                      'instalacao',  'pendente',     100),
  (3, '2026-03-29T16:00:00Z', 'Caratinga',            'Ana Costa',        'proprietario', '33999994444', 'Rua João Pinheiro, 350, Centro, Caratinga - MG',              'manutencao',  'em_andamento', 103),

  -- Ontem (concluídos)
  (1, '2026-03-28T09:00:00Z', 'Governador Valadares', 'Pedro Almeida',    'funcionario',  '33999995555', 'Rua Barão do Rio Branco, 100, Centro, GV - MG',              'instalacao',  'concluido',    0),
  (2, '2026-03-28T11:00:00Z', 'Resplendor',           'Lucia Ferreira',   'outros',       '33999996666', 'Av. JK, 500, Centro, Resplendor - MG',                        'instalacao',  'concluido',    60),
  (2, '2026-03-28T15:00:00Z', 'Aimorés',              'Roberto Santos',   'proprietario', '33999997777', 'Rua Direita, 80, Centro, Aimorés - MG',                       'retirada',    'concluido',    95),

  -- Semana passada (mix de status)
  (1, '2026-03-23T08:30:00Z', 'Teófilo Otoni',        'Fernanda Lima',    'funcionario',  '33999998888', 'Av. Getúlio Vargas, 900, Centro, Teófilo Otoni - MG',         'instalacao',  'concluido',    138),
  (3, '2026-03-24T10:00:00Z', 'Manhuaçu',             'Diego Rocha',      'proprietario', '33988881111', 'Rua Tiradentes, 150, Centro, Manhuaçu - MG',                  'manutencao',  'concluido',    128),
  (1, '2026-03-25T14:00:00Z', 'Coronel Fabriciano',   'Patrícia Mendes',  'funcionario',  '31988882222', 'Rua Caladinho, 200, Centro, Cel. Fabriciano - MG',            'instalacao',  'concluido',    108),
  (2, '2026-03-26T09:00:00Z', 'Conselheiro Pena',     'Marcos Vieira',    'outros',       '33988883333', 'Rua Principal, 50, Centro, Conselheiro Pena - MG',            'outros',      'cancelado',    75),
  (3, '2026-03-27T11:00:00Z', 'Inhapim',              'Juliana Martins',  'funcionario',  '33988884444', 'Av. Brasil, 300, Centro, Inhapim - MG',                       'instalacao',  'pendente',     60),

  -- Futuro (agendados)
  (1, '2026-03-30T08:00:00Z', 'Belo Horizonte',       'Thiago Neves',     'proprietario', '31988885555', 'Av. Afonso Pena, 1200, Centro, BH - MG',                      'instalacao',  'pendente',     320),
  (2, '2026-03-30T14:00:00Z', 'Timóteo',              'Camila Ramos',     'funcionario',  '31988886666', 'Rua Limoeiro, 75, Bromélias, Timóteo - MG',                   'manutencao',  'pendente',     112),
  (3, '2026-03-31T09:00:00Z', 'Governador Valadares', 'Renato Augusto',   'funcionario',  '33988887777', 'Rua Prudente de Morais, 600, Vila Bretas, GV - MG',           'instalacao',  'pendente',     0),
  (1, '2026-04-01T10:00:00Z', 'Nanuque',              'Simone Oliveira',  'proprietario', '33988888888', 'Rua São Paulo, 400, Centro, Nanuque - MG',                    'retirada',    'pendente',     220);

-- Veículos vinculados
INSERT INTO atendimento_veiculos (atendimento_id, placa, modelo) VALUES
  -- Hoje
  (1,  'ABC1D23', 'Fiat Strada 2022'),
  (1,  'XYZ4E56', 'VW Gol 2020'),
  (2,  'DEF7G89', 'Toyota Hilux 2023'),
  (3,  'GHI0J12', 'Chevrolet S10 2021'),
  (3,  'KLM3N45', 'Fiat Toro 2022'),
  (4,  'OPQ6R78', 'Honda Civic 2020'),
  -- Ontem
  (5,  'RST1U23', 'VW Saveiro 2021'),
  (6,  'VWX4Y56', 'Fiat Mobi 2023'),
  (7,  'ZAB7C89', 'Chevrolet Onix 2022'),
  -- Semana passada
  (8,  'DEF0G12', 'Ford Ranger 2023'),
  (8,  'HIJ3K45', 'Toyota Corolla 2021'),
  (9,  'LMN6O78', 'Hyundai HB20 2022'),
  (10, 'PQR9S01', 'VW T-Cross 2023'),
  (11, 'TUV2W34', 'Fiat Pulse 2022'),
  (12, 'XYZ5A67', 'Renault Kwid 2021'),
  -- Futuro
  (13, 'BCD8E90', 'Jeep Compass 2023'),
  (14, 'FGH1I23', 'Chevrolet Tracker 2022'),
  (14, 'JKL4M56', 'Fiat Argo 2023'),
  (15, 'NOP7Q89', 'Honda HR-V 2022'),
  (16, 'RST0U12', 'VW Amarok 2023'),
  (16, 'VWX3Y45', 'Toyota Yaris 2021');
