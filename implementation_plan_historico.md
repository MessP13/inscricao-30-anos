# Plano de Implementacao: IEVC Historico

Atualizado em: 2026-05-15

Este documento e a fonte de verdade operacional do projeto. Deve ser lido e atualizado antes e depois de alteracoes estruturais, integracoes externas, mudancas de schema ou novas funcionalidades relevantes.

## 1. Estado Atual do Projeto

- Aplicacao: sistema de levantamento historico da IEVC para recolha de memorias, testemunhos, fotos e documentos dos 30 anos.
- Stack: Next.js 14, TypeScript, Tailwind CSS, Prisma, Supabase, next-i18next, Zustand, PWA, Vercel.
- Repositorio Git remoto local: `https://github.com/MessP13/ievc-historico.git`.
- Deploy publico verificado em 2026-05-15: `https://ievc-historico.vercel.app` respondeu `200 OK` e carregou a home `IEVC - Memoria Historica`.
- Vercel local: `.vercel/repo.json` aponta para o projeto `ievc-historico`, id `prj_nUGSSqiQjhTBV8z0T1Tnd3eNbD35`, org/team `team_ktUSD6nGv1seMXKTwVGLXwOV`.
- Supabase local: o projeto usa variaveis `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. Nao expor valores secretos no repositorio ou em logs.
- Storage: upload usa bucket Supabase `ievc-historico`.
- Banco: schema Prisma define `Province`, `District`, `User`, `Form`, `Answer`, `PersonEntry` (pastores, missionários, obreiros) e `Attachment`, com cascata em respostas, membros registados e anexos quando o formulario e removido.
- Idiomas configurados: `pt`, `en`, `sn`, `ts`, `nd`.
- PWA: configurado via `@ducanh2912/next-pwa`, com service worker gerado em build.
- Direcao de produto: quem preenche o formulario e um usuario simples, sem login externo, sem Google e sem exigencia tecnica. A experiencia publica deve ser direta: abrir, preencher, anexar, enviar. Contas internas ficam restritas a administradores/pastores da plataforma.

## 2. Funcionalidades Implementadas

- Home publica com chamada para preenchimento do formulario.
- Formulario em 10 secoes com progresso, autosave local e campos especializados.
- Seletor de localizacao por provincia, distrito e igreja.
- Autenticacao por telefone/SMS via Supabase Auth em `/entrar`.
- APIs de formularios, respostas, submissao, status e exportacao.
- Painel admin com lista de formularios, estatisticas e links de exportacao.
- Exportacao individual em PDF, DOCX e XLSX.
- Exportacao geral via `/api/admin/export-all`.
- Upload de ficheiros para Supabase Storage.
- Seed Prisma com provincias e distritos de Mocambique.

## 3. Validacao de 2026-05-15

- `npx tsc --noEmit`: passou sem erros.
- `npm run build`: Prisma Client foi gerado, Next compilou com sucesso, PWA foi gerado e as 12 paginas estaticas foram geradas. A execucao excedeu 300s durante `Finalizing page optimization / Collecting build traces`, portanto o comando nao fechou com codigo de sucesso dentro do limite.
- `npm run lint`: nao executou lint real porque `next lint` abriu o assistente interativo de configuracao ESLint. Ainda falta adicionar uma configuracao ESLint para CI/local.
- Site publico: verificado via requisicao HTTP com `200 OK`.

## 4. Riscos e Problemas Encontrados

- Resolvido na Fase 1: `/entrar` agora envia `userId` para `/api/users/me` quando usado.
- Resolvido na Fase 1: `/formulario` nao confirma submissao sem `formId`; ele cria rascunho automatico e pede nova tentativa se o formulario online ainda nao estiver pronto.
- Resolvido na Fase 1: `/api/forms/[id]/submit` e `/api/forms/[id]/answers` usam helper unico para secao.
- Admin e APIs sensiveis: painel `/admin` e exportacoes dependem de dados Prisma, mas precisam de protecao clara por sessao, role ou `ADMIN_API_KEY`.
- Supabase RLS: ainda precisa ser confirmado/aplicado para as tabelas do projeto sem alterar tabelas legadas de outros subprojetos.
- Build em Windows: a etapa final de traces pode ser lenta demais ou ficar presa; investigar se ha impacto de `.next`, PWA, antivirus/indexacao ou dependencias.
- Encoding: algumas saidas do PowerShell exibiram acentos quebrados, embora o HTML publico esteja correto em UTF-8. Evitar regravar ficheiros de conteudo sem garantir encoding.

## 5. Cuidados Operacionais

- Nao fazer commit, push, upload ou deploy sem ordem explicita.
- Nao editar `next-env.d.ts`; ele e gerado pelo Next.js.
- Nao rodar comandos destrutivos de Prisma contra Supabase.
- Antes de qualquer migracao, gerar SQL em modo revisavel e confirmar que tabelas legadas, como `inscricoes_30_anos`, nao serao alteradas ou removidas.
- Nunca registrar valores de `.env`, tokens Vercel, service role key ou credenciais de banco em documentos versionados.

## 6. Proximos Passos Recomendados

### Fase 1 - Plano

- [x] Remover dependencia de login para o publico.
- [x] Criar ou recuperar automaticamente um rascunho de formulario por dispositivo.
- [x] Guardar nome, telefone, localizacao e igreja a partir do proprio formulario.
- [x] Normalizar a secao salva por todas as APIs de respostas.
- [x] Vincular uploads ao formulario no banco.
- [x] Manter admin como area interna da plataforma, com protecao a evoluir nas fases seguintes.

### Fase 1 - Coding

- [x] Criar helper unico para mapear `questionKey` para secao.
- [x] Ajustar `/api/forms` para aceitar criacao simples sem autenticacao publica.
- [x] Ajustar autosave para funcionar com rascunho automatico.
- [x] Ajustar submit para salvar metadados do formulario e secoes corretas.
- [x] Ajustar upload para registrar `Attachment` quando houver `formId`.

### Fase 1 - Upload

- [x] Garantir que anexos adicionados pelo usuario sejam enviados para Supabase Storage.
- [x] Persistir URL, thumbnail, nome original, MIME, tamanho e descricao na tabela `Attachment`.
- [x] Mostrar estado compreensivel no formulario: pendente, a enviar, enviado ou falhou.

### Fase 1 - Test

- [x] `npx tsc --noEmit`.
- [x] `npm run build`.
- [ ] Validar manualmente no browser: criacao de formulario sem login.
- [ ] Validar manualmente no browser: autosave e submissao.
- [ ] Validar manualmente no browser: upload com `formId` e Supabase Storage.
- [x] Registrar qualquer bloqueio de ambiente sem expor secrets.

### Fases Seguintes

- [x] Fase 2: painel admin com filtros por estado/provincia, busca por igreja, paginacao e contagem filtrada.
- [ ] Fase 2b: painel admin com metricas por provincia/distrito e revisao mais clara.
- [ ] Fase 3: logs/auditoria, `requestId`, padronizacao de erros e historico de decisoes.
- [ ] Fase 4: protecao interna de admin/pastores por credenciais da plataforma, roles e escopo por provincia/distrito.
- [ ] Fase 5: RLS Supabase, migrations revisaveis, hardening de storage e exports.
- [ ] Fase 6: performance, build, lint nao interativo, testes automatizados e polimento UX.

## 7. Historico Recente

- 2026-05-15: executada contextualizacao do ToDo `.todo4vcode/shared-tasks.json`; analisados arquivos principais, schema Prisma, integracao Supabase, configuracao Vercel local, Git remoto e site publico; plano atualizado com estado atual, riscos e proximos passos.
- 2026-05-15: iniciada Fase 1. Implementado fluxo publico sem login: `/formulario` cria rascunho automatico por dispositivo, autosave salva respostas sem exigir `userId` no cliente, APIs gravam metadados do formulario, secoes sao mapeadas por helper unico, pastores sao sincronizados em `PastorEntry`, upload registra `Attachment`, e `/entrar` foi corrigido para enviar `userId` quando usado. Validacoes: `npx tsc --noEmit` e `npm run build` passaram.
- 2026-05-15: iniciada Fase 2 do admin. `/admin` passou a usar filtros por estado e provincia, busca por nome da igreja, paginacao de 20 itens e contagem de resultados filtrados para reduzir carga e facilitar revisao. Validacao: `npx tsc --noEmit` passou; `npm run build` compilou server/client/PWA, mas excedeu 600s em `Collecting page data`.
- 2026-05-23: Reestruturação global do banco e formulário. Substituída a tabela `PastorEntry` por `PersonEntry` (suportando múltiplas categorias de líderes/membros); adicionados campos estatísticos de igreja e identificação (documentos, data de preenchimento, etc.). Reescrito o componente de listagem de pessoas para `PersonTableField.tsx`. Ajustadas APIs e a interface de administração para suportar visualização e exportação da nova estrutura. Migração aplicada em produção e build validado sem erros.

