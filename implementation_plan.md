# Architecture & Implementation Plan: Sistema de Inscrições (30 Anos Visão Cristã)

> Última atualização: 2026-05-13 (v5)

---

## 📝 RESUMO DO ESTADO ATUAL

O sistema está funcional com funções dinâmicas por género, gestão de duplicados via modal, seletor de data estruturado e painel administrativo com exportação customizada.

---

## 🚀 NOVAS IMPLEMENTAÇÕES & AJUSTES (REVISADO v5)

### 1. Refinamento de Funções e Anti-Duplicação
- **Novas Funções:** Adicionar "Nenhum" e "Membro" à lista de funções.
- **Rótulos Unificados:** Garantir a presença de "Pastor/Pastora" e "Diácono/Diaconisa" conforme solicitado.
- **Verificação Anti-Duplicação:** Revisar a lógica para garantir que a comparação seja robusta (insensível a maiúsculas/minúsculas e espaços extras).

### 2. Painel Admin: Filtros Estritos (Presets)
- **Filtros de Especialidade:** Os botões/filtros devem ser excludentes e precisos:
    - **Ordenados:** Apenas quem tem cargo ministerial (Pastor, Diácono, Evangelista).
    - **Dep. Senhoras:** Apenas mulheres vinculadas ao departamento de Mulheres.
    - **Outros Presets:** Conforme a necessidade (Jovens, Crianças, etc.).

### 3. Exportação em Preto e Branco
- **PDF B&W:** Ajustar a geração de PDF para remover cores (tons de cinza/preto) para economia de impressão.

### 4. Otimização de Tokens (Lazy Reader)
- **Header de Código:** Adicionar comentário instrucional no início dos arquivos principais para orientar modelos de IA a processarem o conteúdo de forma eficiente (resumo/cópia).

---

## 🛠️ PRÓXIMOS PASSOS TÉCNICOS

### [App.jsx]
- Atualizar `getFuncoes` com "Nenhum", "Membro" e os rótulos solicitados.
- Revisar `handleSubmit` para garantir busca `ilike` e `trim()` no nome.
- Adicionar o comentário "Lazy Reader" no topo.

### [AdminPanel.jsx]
- Refinar `getFilteredData` para aplicar filtros estritos por preset.
- Modificar `exportPDF` para usar cores de cabeçalho e texto em preto/cinza.
- Adicionar o comentário "Lazy Reader" no topo.

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

1. **Duplicados:** O sistema não deve permitir duplicados acidentais e o modal deve ser infalível.
2. **Filtros:** Ao selecionar "Ordenados", a lista deve conter *apenas* oficiais da igreja.
3. **Exportação:** O PDF gerado deve ser visualmente limpo e sem cores vibrantes.
4. **Funções:** "Nenhum" e "Membro" devem estar disponíveis para seleção.

