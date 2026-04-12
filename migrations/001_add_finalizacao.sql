-- ============================================================
-- Migration 001: Adicionar campos de finalização
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Novas colunas na tabela atendimentos
ALTER TABLE atendimentos
  ADD COLUMN IF NOT EXISTS pedagio_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS equipamento_utilizado TEXT;

-- 2. Expandir o CHECK de status para incluir 'finalizado'
--    (Postgres não suporta ALTER CONSTRAINT, então recriamos)
ALTER TABLE atendimentos DROP CONSTRAINT IF EXISTS atendimentos_status_check;
ALTER TABLE atendimentos ADD CONSTRAINT atendimentos_status_check
  CHECK (status IN ('pendente','em_andamento','concluido','cancelado','finalizado'));
