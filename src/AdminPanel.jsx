import { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { LogOut, Download } from 'lucide-react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

const COLS = [
  { key: 'created_at',        label: 'Data' },
  { key: 'nome',              label: 'Nome' },
  { key: 'sexo',              label: 'Sexo' },
  { key: 'idade',             label: 'Faixa Etária' },
  { key: 'distrito',          label: 'Distrito' },
  { key: 'localizacao',       label: 'Localização' },
  { key: 'funcao',            label: 'Função' },
  { key: 'departamento',      label: 'Departamento' },
  { key: 'contacto',          label: 'Telefone' },
  { key: 'whatsapp',          label: 'WhatsApp' },
  { key: 'batizado_agua',     label: 'Bat. Água' },
  { key: 'batizado_espirito', label: 'Bat. Espírito' },
  { key: 'hospedagem',        label: 'Hospedagem' },
  { key: 'contribuicao',      label: 'Contribuição' },
  { key: 'valor_contribuicao',label: 'Valor' },
];

function fmt(col, val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
  if (col.key === 'created_at') return new Date(val).toLocaleDateString('pt-MZ');
  return val;
}

export default function AdminPanel({ onBack }) {
  const [authed, setAuthed]         = useState(false);
  const [password, setPassword]     = useState('');
  const [loginError, setLoginError] = useState('');
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [fetchError, setFetchError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      loadData();
    } else {
      setLoginError('Senha incorreta.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('inscricoes_30_anos')
      .select('*')
      .order('nome', { ascending: true });
    setLoading(false);
    if (error) { setFetchError('Erro ao carregar dados.'); return; }
    setData(rows);
  };

  const exportCSV = () => {
    const header = COLS.map(c => c.label).join(',');
    const rows = data.map(r =>
      COLS.map(c => {
        const v = fmt(c, r[c.key]);
        return v === '—' ? '' : `"${String(v).replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');
    const blob = new Blob([`${header}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `inscricoes_30anos_${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authed) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: 360, margin: '80px auto 0' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: 24, fontSize: '1.25rem' }}>
            Acesso Administrativo
          </h2>
          <form onSubmit={handleLogin}>
            <div className="field" style={{ marginBottom: 16 }}>
              <label>Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            {loginError && (
              <p style={{ color: '#f87171', fontSize: '0.875rem', margin: '0 0 12px' }}>{loginError}</p>
            )}
            <button type="submit" className="btn-primary btn-full">Entrar</button>
          </form>
          <button onClick={onBack} className="admin-back-link">← Voltar ao formulário</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-bar">
        <h2 className="admin-title">
          Inscrições · 30 Anos
          <span className="admin-count">{data.length} registos</span>
        </h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.9rem' }} onClick={exportCSV}>
            <Download size={15} /> CSV
          </button>
          <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.9rem' }} onClick={() => { setAuthed(false); onBack(); }}>
            <LogOut size={15} /> Sair
          </button>
        </div>
      </div>

      {loading   && <p className="admin-status">A carregar...</p>}
      {fetchError && <p className="admin-status" style={{ color: '#f87171' }}>{fetchError}</p>}

      {!loading && !fetchError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>{COLS.map(c => <th key={c.key}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={r.id || i}>
                  {COLS.map(c => <td key={c.key}>{fmt(c, r[c.key])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
