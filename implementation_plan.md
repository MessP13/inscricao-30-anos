# Architecture & Implementation Plan: Sistema de Inscrições (30 Anos Visão Cristã)

> Última atualização: 2026-05-13

---

## 📝 RESUMO DO ESTADO ATUAL

O sistema está funcional e em produção, permitindo inscrições completas e gestão administrativa.

---

## 🚀 NOVAS IMPLEMENTAÇÕES SOLICITADAS (REVISADO v4)

### 1. Dinâmica de Funções e Género
- **Funções Inteligentes:** A lista de funções será alterada dinamicamente com base no **Sexo** selecionado:
    - **Masculino:** Pastor, Diácono, Evangelista, Líder, Vice-Líder...
    - **Feminino:** Pastora, Diaconisa, Evangelista, Líder, Vice-Líder...
- **Inclusão de Vice-Líderes:** Adição da categoria de Vice-Líder para todas as áreas relevantes.
- **Ajuste de Conjunções:** Uso correto de "do/da" nas descrições (ex: Líder do Departamento, Líder da Igreja).

### 2. Gestão de Duplicados (Linguagem Clara)
- **Interface de Decisão Amigável:** O modal de comparação usará mensagens diretas para o usuário:
    - **"Sim, sou eu. Atualizar meus dados"** — Para quem quer corrigir uma inscrição anterior.
    - **"Não, somos pessoas diferentes"** — Para quem tem o mesmo nome de outro inscrito.
    - **"Cancelar"** — Se já estiver inscrito e não precisar enviar novamente.

### 3. Relatórios e Listagens
- **Listas Especializadas:** Geral, Ordenados (agrupados por cargo, independente do género), Departamentos e Faixas Etárias.
- **Exportação Customizada:** Painel para escolher quais colunas exportar.

### 4. Seletor de Data Estruturado
- **Dropdowns de Data:** Ano (Obrigatório), Mês e Dia (Opcionais).
- **Formatação:** Gravação nos formatos `YYYY`, `YYYY-MM` ou `YYYY-MM-DD`.

---

## 🛠️ PROPOSTA TÉCNICA

### [Componente] Formulário (`src/App.jsx`)
- **Lógica de Género:** Filtragem dinâmica da lista de funções.
- **Comparação de Duplicados:** Modal com as três opções de decisão claras.
- **Datas:** Implementação do componente com seletores suspensos.

### [Componente] Painel Admin (`src/AdminPanel.jsx`)
- **Exportação:** Adição de interface de seleção de colunas (checkboxes).
- **Filtros Avançados:** Botões de acesso rápido para as novas listas solicitadas.

---

## ✅ PLANO DE VERIFICAÇÃO

1. **Género:** Validar a troca automática de "Pastor" para "Pastora" ao mudar o sexo.
2. **Duplicados:** Simular uma atualização de dados via modal de decisão.
3. **Datas:** Confirmar que o seletor não permite texto livre.
4. **Relatórios:** Testar a exportação personalizada de colunas selecionadas.
