/**
 * update-logs.js — Gerador automático de logs
 * Uso: npm run logs
 *
 * Gera logs de coding a partir do git history.
 * Cada pasta (today/week/month/year) mantém apenas UM ficheiro — o período actual.
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOGS = join(ROOT, 'logs');
const TODO_SHARED = join(ROOT, '.todo4vcode', 'shared-tasks.json');
const now = new Date();

// ── Helpers de data ───────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0'); }

const todayStr  = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const monthStr  = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
const yearStr   = String(now.getFullYear());

function getMondayStr(d) {
  const date = new Date(d);
  const day  = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getWeekLabel(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${pad(week)}`;
}

const mondayStr = getMondayStr(now);
const weekLabel = getWeekLabel(now);

// ── Git log ───────────────────────────────────────────────────────────────────

function gitLog(since) {
  try {
    const out = execSync(
      `git log --since="${since} 00:00:00" --pretty=format:"- %s%n  Ficheiros: %D | Data: %ad | Autor: %an" --date=short`,
      { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    return out || '_Nenhuma alteração neste período._';
  } catch {
    return '_Erro ao ler histórico git._';
  }
}

function gitLogSimple(since) {
  try {
    const out = execSync(
      `git log --since="${since} 00:00:00" --pretty=format:"- %s (%ad)" --date=short`,
      { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    return out || '_Nenhuma alteração neste período._';
  } catch {
    return '_Erro ao ler histórico git._';
  }
}

// ── Escrita de ficheiro (limpa o anterior na mesma pasta) ─────────────────────

function writeLog(dir, filename, content) {
  mkdirSync(dir, { recursive: true });
  if (existsSync(dir)) {
    readdirSync(dir)
      .filter(f => f !== '.gitkeep' && f !== filename)
      .forEach(f => { try { unlinkSync(join(dir, f)); } catch {} });
  }
  writeFileSync(join(dir, filename), content, 'utf8');
  console.log(`  ✅ ${join(dir, filename).replace(ROOT + '\\', '').replace(ROOT + '/', '')}`);
}

function readEnvVar(name) {
  try {
    const raw = readFileSync(join(ROOT, '.env'), 'utf8');
    const line = raw.split(/\r?\n/).find(l => l.startsWith(`${name}=`));
    if (!line) return '';
    return line.slice(name.length + 1).trim();
  } catch {
    return '';
  }
}

function syncLogsTask({ vercelEnabled, supabaseEnabled }) {
  if (!existsSync(TODO_SHARED)) return;

  try {
    const data = JSON.parse(readFileSync(TODO_SHARED, 'utf8'));
    if (!Array.isArray(data.tasks)) return;

    const task = data.tasks.find(t => t.id === 'l4c_logs_cloud');
    if (!task) return;

    const stateText = `Vercel token: ${vercelEnabled ? 'OK' : 'MISSING'} | Supabase service role: ${supabaseEnabled ? 'OK' : 'MISSING'} | Updated: ${new Date().toISOString()}`;
    const allReady = vercelEnabled && supabaseEnabled;
    task.description = stateText;
    task.status = allReady ? 'Done' : 'Doing';
    task.completed = allReady;
    task.tags = Array.isArray(task.tags) ? task.tags : ['Infra'];

    writeFileSync(TODO_SHARED, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`  ✅ .todo4vcode/shared-tasks.json (logs cloud: ${task.status})`);
  } catch {
    console.log('  ⚠️ Falha ao sincronizar task de logs cloud no todo4vcode.');
  }
}

// ── CODING LOGS ───────────────────────────────────────────────────────────────

console.log('\n📝 Coding Logs\n');

writeLog(
  join(LOGS, 'coding', 'today'),
  `${todayStr}.md`,
  `# Coding Log — ${todayStr} (Hoje)\n\n` +
  `> Gerado automaticamente em ${new Date().toLocaleString('pt-MZ')}\n\n` +
  `## Commits do Dia\n\n${gitLog(todayStr)}\n`
);

writeLog(
  join(LOGS, 'coding', 'week'),
  `${weekLabel}.md`,
  `# Coding Log — ${weekLabel} (Semana Actual)\n\n` +
  `> Período: ${mondayStr} → ${todayStr}\n` +
  `> Gerado automaticamente em ${new Date().toLocaleString('pt-MZ')}\n\n` +
  `## Commits da Semana\n\n${gitLog(mondayStr)}\n`
);

writeLog(
  join(LOGS, 'coding', 'month'),
  `${monthStr}.md`,
  `# Coding Log — ${monthStr} (Mês Actual)\n\n` +
  `> Gerado automaticamente em ${new Date().toLocaleString('pt-MZ')}\n\n` +
  `## Commits do Mês\n\n${gitLogSimple(`${monthStr}-01`)}\n`
);

writeLog(
  join(LOGS, 'coding', 'year'),
  `${yearStr}.md`,
  `# Coding Log — ${yearStr} (Ano Actual)\n\n` +
  `> Gerado automaticamente em ${new Date().toLocaleString('pt-MZ')}\n\n` +
  `## Commits do Ano\n\n${gitLogSimple(`${yearStr}-01-01`)}\n`
);

// ── BUILDING LOGS — VERCEL ────────────────────────────────────────────────────

console.log('\n🚀 Building Logs — Vercel\n');

const vercelTip =
  `> **Para obter logs automáticos:** adicione \`VERCEL_TOKEN\` ao .env e execute \`npm run logs\`.\n` +
  `> Dashboard: https://vercel.com/MessP13/inscricao-30-anos\n\n` +
  `_Download automático requer VERCEL_TOKEN (não exposto por segurança)._\n`;

for (const [folder, label] of [
  ['today', todayStr],
  ['week',  weekLabel],
  ['month', monthStr],
  ['year',  yearStr],
]) {
  writeLog(
    join(LOGS, 'building', 'vercel', folder),
    `${label}.md`,
    `# Vercel Build Log — ${label}\n\n` +
    `> Gerado em ${new Date().toLocaleString('pt-MZ')}\n\n` +
    vercelTip
  );
}

// ── BUILDING LOGS — SUPABASE ──────────────────────────────────────────────────

console.log('\n🗄️  Building Logs — Supabase\n');

const supabaseTip =
  `> **Para obter logs automáticos:** os logs do Supabase requerem a \`service_role\` key.\n` +
  `> Dashboard: https://supabase.com/dashboard/project/wyynplryfcbosnoqtydh/logs/explorer\n\n` +
  `_Download automático requer service_role key (não exposta por segurança)._\n`;

for (const [folder, label] of [
  ['today', todayStr],
  ['week',  weekLabel],
  ['month', monthStr],
  ['year',  yearStr],
]) {
  writeLog(
    join(LOGS, 'building', 'supabase', folder),
    `${label}.md`,
    `# Supabase Log — ${label}\n\n` +
    `> Gerado em ${new Date().toLocaleString('pt-MZ')}\n\n` +
    supabaseTip
  );
}

console.log('\n🎉 Todos os logs actualizados!\n');

const hasVercelToken = Boolean(readEnvVar('VERCEL_TOKEN'));
const hasSupabaseServiceRole = Boolean(readEnvVar('SUPABASE_SERVICE_ROLE_KEY'));
syncLogsTask({ vercelEnabled: hasVercelToken, supabaseEnabled: hasSupabaseServiceRole });
