-- Feed de Gestão: segmentação por departamento.
-- Departamentos ocultos por publicação; vazio (default) = todos com acesso veem.
ALTER TABLE "studies" ADD COLUMN "excluded_departments" TEXT[] NOT NULL DEFAULT '{}';
