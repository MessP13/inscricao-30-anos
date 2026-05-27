# Architecture & Implementation Plan: Sistema de Inscricoes (30 Anos Visao Crista)

> Ultima atualizacao: 2026-05-27 (v10)

> **Dica para agentes:** Quando for necessário alterar algo no Supabase (RLS, storage, schema), gere os comandos SQL e peça ao utilizador para os enviar ao agente do IDE com o MCP do Supabase — não os execute directamente.

---

## Resumo Atual

O sistema esta operacional com formulario publico, prevencao de duplicados, painel admin com edicao/remoção, e geracao de logs locais por periodo (`today/week/month/year`).

---

## Ja Implementado (Resumo)

1. Formulario e admin alinhados com a tabela `inscricoes_30_anos`.
2. Campo obrigatorio `inscrito_por` no cadastro e na edicao.
3. Tratamento de erro de inscricao melhorado no frontend para diagnostico mais claro.
4. Ajuste para enviar `contacto` e `whatsapp` sempre como texto (sem `null`).
5. Setup SQL atualizado com migracao basica de `inscricoes` -> `inscricoes_30_anos` e politicas RLS.
6. Lista de tarefas migrada para `.todo4vcode/shared-tasks.json`.
7. Vinculo inicial logs <-> todo4vcode: `npm run logs` atualiza estado da task `l4c_logs_cloud`.
8. Anti-duplicacao refeita com pontuacao de semelhanca e limite de alerta de 50%.
9. Faixa etaria "Ate aos 11 anos" removida do formulario.
10. Funcao "Nenhum" ajustada para "Nenhuma".
11. Logistica passou a perguntar "Vai participar na Celebracao?".
12. Sistema de report de erros implementado no frontend e previsto no `setup.sql` com tabela dedicada.
13. Painel admin: checkboxes de selecção, flags por registo, filtro "Marcados p/ Revisão", eliminação em massa.
14. Script `scripts/daily-flag.mjs` detecta registos suspeitos 1x/dia e escreve em `tasks.todo4vcode`.
15. Políticas RLS `delete_anon` e `update_anon` executadas no Supabase — admin pode editar e apagar.
16. Modal de edição do admin corrigido (selects sem opção vazia bloqueavam submissão silenciosamente).
17. Filtros por departamento e por distrito adicionados ao dropdown do admin.
18. Secção de Logística desactivada temporariamente no formulário público.
19. Distritos Mutoe e Sussundenga (bairros Inhamezara, Chichira) e Ministério de Louvor adicionados.

---

## Pendencias Prioritarias (Concluidas)

1. Executar `setup.sql` no Supabase para ativar a coluna `participa_celebracao` e a tabela `inscricoes_30_anos_erros`. [OK - 2026-05-15]
2. Validar report de erro em producao depois da migracao SQL.
3. Melhorar leitura segura dos reports pelo admin sem expor logs via `anon select`.
4. Concluir logs cloud reais (Vercel/Supabase) quando `SUPABASE_SERVICE_ROLE_KEY` estiver disponivel.

---

## Logs e Cloud

Estado atual dos logs:

- Vercel e Supabase ainda estao em modo "placeholder" no arquivo de log.
- O script atual nao baixa logs reais da Vercel/Supabase; ele apenas gera arquivos estruturados.

Plano de evolucao:

1. Integrar Vercel API com `VERCEL_TOKEN` para salvar ultimo deploy e status real.
2. Integrar consulta segura de logs Supabase com credencial apropriada de servico.
3. Atualizar automaticamente a task `l4c_logs_cloud` para `Done` quando ambos os canais estiverem ativos.

---

## Criterios de Aceitacao

1. Cadastro sem telefone/whatsapp nao deve falhar por tipo de dado.
2. Lista de TODO deve refletir estado real de trabalho no `todo4vcode`.
3. Logs devem indicar claramente se sao reais (cloud) ou placeholders locais.
4. Sistema de report de erros deve registrar falhas com contexto suficiente para diagnostico.

## To do

- [ ] Normalizar registos na BD: nomes (maiúsculas/minúsculas), funcao="Nenhum" → "Nenhuma", departamentos com valores sujos
- [ ] Apagar registos de teste da BD (TESTE CODEX, jjjjj, Teste Himano, etc.) — ver [FLAG] no tasks.todo4vcode
- [ ] Verificar logs Cloud reais (Vercel/Supabase) quando SUPABASE_SERVICE_ROLE_KEY estiver disponível
- [ ] Reactivar secção de Logística quando necessário (mudar `false` para `true` em App.jsx:700)

