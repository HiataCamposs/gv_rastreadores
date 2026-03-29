-- ============================================================
-- GV RASTREADORES — Migração da tabela EMPRESAS
-- Use APENAS se você já rodou o supabase_schema.sql anterior.
-- Se ainda não criou nada, rode o supabase_schema.sql atualizado.
-- ============================================================

-- 1) Renomear coluna "nome" para "razao_social"
ALTER TABLE empresas RENAME COLUMN nome TO razao_social;

-- 2) Adicionar novos campos
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS nome_fantasia        TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS inscricao_municipal  TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS inscricao_estadual   TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logradouro           TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS numero               TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS complemento          TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS bairro               TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cidade               TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS uf                   TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cep                  TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ativo                BOOLEAN NOT NULL DEFAULT true;

-- Pronto! A tabela agora tem todos os campos para emissão de NFS-e.
