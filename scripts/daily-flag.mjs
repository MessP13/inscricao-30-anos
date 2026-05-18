import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- Verificar se já correu hoje ---
const STATE_FILE = join(ROOT, '.todo4vcode-flag-state.json');
const today = new Date().toISOString().slice(0, 10);
if (existsSync(STATE_FILE)) {
  const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  if (state.lastRun === today) {
    process.exit(0); // Já correu hoje, sair silenciosamente
  }
}

// --- Carregar credenciais do .env ---
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// --- Padrões suspeitos ---
const SUSPICIOUS = [
  { re: /^teste/i,             reason: 'Nome começa com "Teste"' },
  { re: /CODEX/i,              reason: 'Nome contém "CODEX"' },
  { re: /^j{4,}$/i,           reason: 'Nome repetido (jjjj...)' },
  { re: /^\d{5,}/,            reason: 'Nome começa com número longo' },
  { re: /Inserção \d{10,}/i,  reason: 'Nome gerado automaticamente' },
  { re: /^.{1,2}$/,           reason: 'Nome muito curto' },
];

// --- Buscar dados ---
const { data, error } = await supabase
  .from('inscricoes_30_anos')
  .select('id, nome, funcao, departamento')
  .limit(1000);

if (error) { console.error('daily-flag: erro Supabase:', error.message); process.exit(1); }

const flagged = [];
for (const r of data) {
  const reasons = [];
  for (const { re, reason } of SUSPICIOUS) {
    if (r.nome && re.test(r.nome.trim())) { reasons.push(reason); break; }
  }
  if (r.funcao === 'Nenhum') reasons.push('Função desactualizada ("Nenhum")');
  if (reasons.length) flagged.push({ id: r.id, nome: r.nome, reasons });
}

// --- Actualizar tasks.todo4vcode ---
const TASKS_FILE = join(ROOT, 'tasks.todo4vcode');
const tasks = JSON.parse(readFileSync(TASKS_FILE, 'utf8'));

// Remover flags anteriores geradas por este script
tasks.tasks = tasks.tasks.filter(t => !t.text.startsWith('[FLAG]'));

// Adicionar novas flags
const maxId = Math.max(0, ...tasks.tasks.map(t => t.id));
flagged.forEach((r, i) => {
  tasks.tasks.push({
    id: maxId + i + 1,
    text: `[FLAG] ${r.nome} — ${r.reasons.join('; ')} (id: ${r.id.slice(0,8)})`,
    completed: false,
  });
});

writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));

// --- Guardar estado ---
writeFileSync(STATE_FILE, JSON.stringify({ lastRun: today }));

console.log(`daily-flag: ${flagged.length} registo(s) marcado(s) em tasks.todo4vcode`);
