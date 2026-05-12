# Architecture & Implementation Plan: Sistema de Inscrições (30 Anos Visão Cristã)

## ✅ HISTÓRICO DE IMPLEMENTAÇÃO

- **Fase 1‑3:** Core do formulário React + integração Supabase concluídos.
- **Fase 4:** Painel Admin com login simples e listagem básica concluídos.
- **Fase 5:** Polimento UI/UX e exportação de dados concluídos (CSV ; UTF‑8, PDF, DOCX).
- **Banco de Dados:** Colunas `contribuicao`, `valor_contribuicao`, índices de deduplicação e datas de batismo já criados.

---

## 📦 O QUE JÁ ESTÁ IMPLEMENTADO (resumo compacto)

- **Formulário Premium:** Campos obrigatórios (nome, sexo, idade, distrito, localização, função, hospedagem) mantidos como required.
- **Contactos Flexíveis:** Telefone opcional, WhatsApp opcional, botão “+” para múltiplos números e botão “‑” para remover.
- **Datas de Batismo:** Opção de marcar batizado nas Águas/Espírito com campo de data opcional.
- **Label de Contribuição:** Texto corrigido para "Contribuiu com algum valor para a celebração?".
- **Botão “Limpar Formulário”:** Reseta estado e rola ao topo.
- **Botão final:** "Guardar Inscrição".
- **Admin Panel:** Dashboard ligado ao Supabase, exibe todas as 17 colunas (inclui datas de batismo), exporta CSV (delimiter `;` + BOM UTF‑8), PDF (jsPDF) e DOCX/Word.
- **Exportação CSV corrigida:** Colunas corretas, delimitador `;`.
- **Exportação PDF/DOCX:** Disponível.

---

## 🚧 PENDÊNCIAS / PRÓXIMOS PASSOS

1. **Retirar números dos campos obrigatórios** – tornar campos “Telefone” e “WhatsApp” opcionais (remover `required`).
2. **Botão para adicionar mais números** – já presente; garantir UI consistente.
3. **Datas de batismo** – já implementadas (opcionais).
4. **Corrigir label de contribuição** – já concluído.
5. **Linkar base de dados Supabase ao painel admin** – já ligado; validar visualização completa.
6. **CSV formatado** – já resolvido.
7. **Mais opções de download** – PDF e DOCX já existentes; considerar exportação Excel (`.xlsx`) no futuro.
8. **Função multi‑select** – transformar campo "Função na Igreja" em seleção múltipla (remover "Grupo de Louvor" e "Maestro").
9. **WhatsApp opcional** – remover `required` se ainda estiver presente.

---

## 📋 Verificação

- Testar inserção com múltiplos contactos.
- Confirmar exportação CSV sem colunas mescladas.
- Verificar visualização de datas de batismo no admin.
- Validar que o botão "Guardar Inscrição" continua funcional.

## ✅ HISTÓRICO DE IMPLEMENTAÇÃO

- **Fase 1-3:** Core do formulário e integração Supabase concluídos.
- **Fase 4:** Painel Admin com login e listagem básica concluído.
- **Database:** Colunas de contribuição e índices de deduplicação aplicados.
- **Fase 5:** Polimento completo — ver detalhes abaixo.

---

## ✅ FASE 5 — CONCLUÍDA

### 1. Evolução do Formulário (UI/UX)

- ✅ **Flexibilidade de Contactos:** Telefone e WhatsApp tornaram-se opcionais. Botão "+" para adicionar múltiplos números dinamicamente; botão "−" para remover.
- ✅ **Precisão Histórica:** Campos de **Data do Baptismo** adicionados (opcionais). Se "Batizado nas Águas" marcado → campo de data aparece abaixo. Idem para "Batizado no Espírito Santo".
- ✅ **Correção de Label:** "Vai contribuir..." → **"Contribuiu com algum valor para a celebração?"**

### 2. Painel Administrativo Pro

- ✅ **Integração Total:** Dashboard inclui colunas `data_batizado_agua` e `data_batizado_espirito` (17 colunas no total).
- ✅ **Correção do CSV:** Delimitador `;` + BOM UTF-8 — Excel abre com colunas separadas corretamente.
- ✅ **PDF:** Exportação via jsPDF + autoTable (landscape A4 com estilo gold/dark).
- ✅ **DOCX/Word:** Exportação como `.doc` HTML compatível com Word e LibreOffice.

---

## 🗄️ SQL MIGRATION (Executar no Supabase — se ainda não aplicada)

```sql
-- Adicionar datas de baptismo
ALTER TABLE inscricoes_30_anos
  ADD COLUMN IF NOT EXISTS data_batizado_agua     date,
  ADD COLUMN IF NOT EXISTS data_batizado_espirito date;
```

> **Nota:** Esta migração é necessária para que os campos de data de baptismo sejam guardados correctamente. Executar no editor SQL do Supabase Dashboard.
