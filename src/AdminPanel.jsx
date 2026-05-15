// 🤖 AI Lazy Reader: Ao ler este arquivo, faça uma cópia resumida para economizar tokens.
// ✏️  LOG: após qualquer alteração neste ficheiro, execute "npm run logs"
import { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { LogOut, Download, FileText, FileSpreadsheet, Table, Columns, Edit2, Trash2, X, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin000609';

const COLS = [
  { key: 'created_at', label: 'Data Inscrição' },
  { key: 'nome', label: 'Nome' },
  { key: 'sexo', label: 'Sexo' },
  { key: 'idade', label: 'Faixa Etária' },
  { key: 'distrito', label: 'Distrito' },
  { key: 'localizacao', label: 'Localização' },
  { key: 'funcao', label: 'Função' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'contacto', label: 'Telefone' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'batizado_agua', label: 'Bat. Água' },
  { key: 'data_batizado_agua', label: 'Data Bat. Água' },
  { key: 'batizado_espirito', label: 'Bat. Espírito' },
  { key: 'data_batizado_espirito', label: 'Data Bat. Espírito' },
  { key: 'hospedagem', label: 'Hospedagem' },
  { key: 'participa_celebracao', label: 'Participa' },
  { key: 'contribuicao', label: 'Contribuição' },
  { key: 'valor_contribuicao', label: 'Valor' },
  { key: 'inscrito_por', label: 'Inscrito por' },
];

const DateSelector = ({ value, onChange, name, required }) => {
  const parts = (value || '').split('-');
  const year = parts[0] || '';
  const month = parts[1] || '';
  const day = parts[2] || '';

  const update = (y, m, d) => {
    if (!y) return onChange(name, '');
    if (!m) return onChange(name, y);
    if (!d) return onChange(name, `${y}-${m}`);
    return onChange(name, `${y}-${m}-${d}`);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  return (
    <div className="date-selector" style={{ display: 'flex', gap: '8px' }}>
      <select value={year} onChange={e => update(e.target.value, month, day)} required={required} style={{ flex: 1 }}>
        <option value="">Ano</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select value={month} onChange={e => update(year, e.target.value, day)} disabled={!year} style={{ flex: 1 }}>
        <option value="">Mês</option>
        {months.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={day} onChange={e => update(year, month, e.target.value)} disabled={!month} style={{ flex: 1 }}>
        <option value="">Dia</option>
        {days.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
    </div>
  );
};

function fmt(col, val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
  if (col.key === 'created_at') return new Date(val).toLocaleDateString('pt-MZ');
  if (col.key === 'data_batizado_agua' || col.key === 'data_batizado_espirito') {
    return val ? new Date(val + 'T00:00:00').toLocaleDateString('pt-MZ') : '—';
  }
  return val;
}

export default function AdminPanel({ onBack }) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [filterType, setFilterType] = useState('Geral');
  const [selectedCols, setSelectedCols] = useState(COLS.map(c => c.key));
  const [showColPicker, setShowColPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRow, setEditingRow] = useState(null);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Tem a certeza que deseja eliminar esta inscrição permanentemente?')) return;
    setLoading(true);
    const { error } = await supabase.from('inscricoes_30_anos').delete().eq('id', id);
    setLoading(false);
    if (error) { alert('Erro ao eliminar registo.'); return; }
    setData(data.filter(r => r.id !== id));
  };

  const handleEdit = (row) => {
    setEditingRow({ ...row });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Preparar dados (remover created_at se existir para não dar erro no update)
    const { created_at, ...payload } = editingRow;
    
    const { error } = await supabase
      .from('inscricoes_30_anos')
      .update(payload)
      .eq('id', editingRow.id);
    
    setLoading(false);
    if (error) {
      alert('Erro ao atualizar dados: ' + error.message);
      return;
    }
    
    setData(data.map(r => r.id === editingRow.id ? editingRow : r));
    setEditingRow(null);
  };

  const getFilteredData = () => {
    let filtered = [...data];
    if (filterType === 'Ordenados') {
      const cargosOrdenados = ['Pastor', 'Pastora', 'Evangelista', 'Diácono', 'Diaconisa'];
      filtered = filtered.filter(r => {
        const funcoes = (r.funcao || '').split(',').map(f => f.trim());
        return funcoes.some(f => cargosOrdenados.includes(f));
      });
      filtered.sort((a, b) => (a.funcao || '').localeCompare(b.funcao || ''));
    } else if (filterType === 'Dep. Mulheres') {
      filtered = filtered.filter(r =>
        (r.sexo === 'Feminino') &&
        ((r.departamento || '').toLowerCase().includes('mulher') || (r.departamento || '').toLowerCase().includes('senhora'))
      );
    } else if (filterType === 'Departamentos') {
      filtered = filtered.filter(r => r.departamento && r.departamento.trim() !== '');
      filtered.sort((a, b) => (a.departamento || '').localeCompare(b.departamento || ''));
    } else if (filterType === 'Faixas Etárias') {
      filtered.sort((a, b) => (a.idade || '').localeCompare(b.idade || ''));
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        (r.nome && r.nome.toLowerCase().includes(q)) ||
        (r.funcao && r.funcao.toLowerCase().includes(q)) ||
        (r.departamento && r.departamento.toLowerCase().includes(q)) ||
        (r.localizacao && r.localizacao.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  };

  const activeCols = COLS.filter(c => selectedCols.includes(c.key));
  const currentData = getFilteredData();

  const stats = {
    total: currentData.length,
    homens: currentData.filter(r => r.sexo === 'Masculino').length,
    mulheres: currentData.filter(r => r.sexo === 'Feminino').length,
    ordenados: currentData.filter(r => {
      const cargos = ['Pastor', 'Pastora', 'Evangelista', 'Diácono', 'Diaconisa', 'Líder de Diáconos'];
      const funcoes = (r.funcao || '').split(',').map(f => f.trim());
      return funcoes.some(f => cargos.includes(f));
    }).length,
    batizadosAgua: currentData.filter(r => r.batizado_agua).length,
    batizadosEspirito: currentData.filter(r => r.batizado_espirito).length
  };

  const exportCSV = () => {
    const sep = ';';
    const header = activeCols.map(c => c.label).join(sep);
    const rows = currentData.map(r =>
      activeCols.map(c => {
        const v = fmt(c, r[c.key]);
        return v === '—' ? '' : `"${String(v).replace(/"/g, '""')}"`;
      }).join(sep)
    ).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `inscricoes_30anos_${filterType.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(197, 160, 89);
    doc.text(`Visão Cristã — Inscrições 30 Anos (${filterType})`, 14, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-MZ')} · ${currentData.length} registos`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [activeCols.map(c => c.label)],
      body: currentData.map(r => activeCols.map(c => {
        const v = fmt(c, r[c.key]);
        return v === '—' ? '' : String(v);
      })),
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak', textColor: [0, 0, 0] },
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`inscricoes_30anos_${filterType.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportXLSX = () => {
    const header = activeCols.map(c => c.label);
    const rows = currentData.map(r => activeCols.map(c => {
      const v = fmt(c, r[c.key]);
      return v === '—' ? '' : v;
    }));
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, filterType);
    XLSX.writeFile(wb, `inscricoes_30anos_${filterType.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportDOC = () => {
    const headerRow = `<tr>${activeCols.map(c => `<th style="background:#1e1e32;color:#c5a059;padding:6px 10px;border:1px solid #333;white-space:nowrap">${c.label}</th>`).join('')}</tr>`;
    const bodyRows = currentData.map((r, idx) => {
      const bg = idx % 2 === 0 ? '#0f0f19' : '#141428';
      return `<tr style="background:${bg}">${activeCols.map(c => {
        const v = fmt(c, r[c.key]);
        return `<td style="padding:5px 10px;border:1px solid #333;color:#ddd;white-space:nowrap">${v === '—' ? '' : v}</td>`;
      }).join('')}</tr>`;
    }).join('');

    const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; background:#0a0a0f; color:#ddd; }
  h2 { color: #c5a059; }
  table { border-collapse: collapse; width: 100%; font-size: 9pt; }
</style>
</head>
<body>
<h2>Visão Cristã — Inscrições 30 Anos (${filterType})</h2>
<p style="color:#999">Gerado em ${new Date().toLocaleDateString('pt-MZ')} · ${currentData.length} registos</p>
<table>
  <thead>${headerRow}</thead>
  <tbody>${bodyRows}</tbody>
</table>
</body></html>`;

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `inscricoes_30anos_${filterType.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.doc`,
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
      <div className="admin-bar" style={{ flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
        <h2 className="admin-title" style={{ margin: 0, padding: 0 }}>
          Inscrições · 30 Anos
        </h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
          
          <input
            type="text"
            placeholder="Pesquisar (Nome, Função, etc)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', background: '#1a1a24', border: '1px solid #333', color: '#fff', fontSize: '0.9rem', maxWidth: '250px' }}
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', background: '#1e1e2d', color: '#fff', border: '1px solid #333', fontSize: '0.9rem' }}
          >
            <option value="Geral">Geral</option>
            <option value="Ordenados">Ordenados</option>
            <option value="Dep. Mulheres">Dep. Mulheres</option>
            <option value="Departamentos">Todos Departamentos</option>
            <option value="Faixas Etárias">Faixas Etárias</option>
          </select>

          <div style={{ position: 'relative' }}>
            <button className="btn-export" onClick={() => setShowColPicker(!showColPicker)} title="Escolher Colunas">
              <Columns size={15} /> Colunas
            </button>
            {showColPicker && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#1a1a24', border: '1px solid #333', borderRadius: '8px', padding: '12px', zIndex: 100, width: '220px', maxHeight: '300px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#c5a059', fontSize: '0.9rem' }}>Colunas a Exportar</div>
                {COLS.map(c => (
                  <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '0.85rem', cursor: 'pointer', color: '#ddd' }}>
                    <input
                      type="checkbox"
                      checked={selectedCols.includes(c.key)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCols([...selectedCols, c.key]);
                        else setSelectedCols(selectedCols.filter(k => k !== c.key));
                      }}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button className="btn-export" onClick={exportXLSX} title="Exportar Excel (.xlsx)">
            <Table size={15} /> Excel
          </button>
          <button className="btn-export" onClick={exportCSV} title="Exportar CSV">
            <FileSpreadsheet size={15} /> CSV
          </button>
          <button className="btn-export" onClick={exportPDF} title="Exportar PDF">
            <FileText size={15} /> PDF
          </button>
          <button className="btn-export" onClick={exportDOC} title="Exportar Word">
            <Download size={15} /> Word
          </button>
          <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.9rem' }} onClick={() => { setAuthed(false); onBack(); }}>
            <LogOut size={15} /> Sair
          </button>
        </div>
      </div>

      {!loading && !fetchError && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Total</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c5a059' }}>{stats.total}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Homens</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{stats.homens}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Mulheres</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{stats.mulheres}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Ordenados</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{stats.ordenados}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Bat. Águas</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{stats.batizadosAgua}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Bat. Espírito</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{stats.batizadosEspirito}</div>
          </div>
        </div>
      )}


      {loading && <p className="admin-status">A carregar...</p>}
      {fetchError && <p className="admin-status" style={{ color: '#f87171' }}>{fetchError}</p>}

      {!loading && !fetchError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {activeCols.map(c => <th key={c.key}>{c.label}</th>)}
                <th style={{ width: '80px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((r, i) => (
                <tr key={r.id || i}>
                  {activeCols.map(c => <td key={c.key}>{fmt(c, r[c.key])}</td>)}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button className="btn-action btn-action-edit" onClick={() => handleEdit(r)} title="Editar">
                        <Edit2 size={15} />
                      </button>
                      <button className="btn-action btn-action-delete" onClick={() => handleDelete(r.id)} title="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingRow && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Inscrição</h3>
              <button className="modal-close" onClick={() => setEditingRow(null)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdate}>
              <div className="form-section" style={{ marginBottom: '24px' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '12px', fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Informação Pessoal</h4>
                <div className="field">
                  <label>Nome Completo</label>
                  <input value={editingRow.nome} onChange={e => setEditingRow({...editingRow, nome: e.target.value})} required />
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Sexo</label>
                    <select value={editingRow.sexo} onChange={e => setEditingRow({...editingRow, sexo: e.target.value})} required>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Faixa Etária</label>
                    <input value={editingRow.idade} onChange={e => setEditingRow({...editingRow, idade: e.target.value})} required />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Telefone</label>
                    <input value={editingRow.contacto || ''} onChange={e => setEditingRow({...editingRow, contacto: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>WhatsApp</label>
                    <input value={editingRow.whatsapp || ''} onChange={e => setEditingRow({...editingRow, whatsapp: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="form-section" style={{ marginBottom: '24px' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '12px', fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Igreja e Função</h4>
                <div className="grid-2">
                  <div className="field">
                    <label>Distrito</label>
                    <input value={editingRow.distrito} onChange={e => setEditingRow({...editingRow, distrito: e.target.value})} required />
                  </div>
                  <div className="field">
                    <label>Localização</label>
                    <input value={editingRow.localizacao} onChange={e => setEditingRow({...editingRow, localizacao: e.target.value})} required />
                  </div>
                </div>
                <div className="field">
                  <label>Função (Cargos)</label>
                  <input value={editingRow.funcao} onChange={e => setEditingRow({...editingRow, funcao: e.target.value})} required />
                </div>
                <div className="field">
                  <label>Departamento</label>
                  <input value={editingRow.departamento || ''} onChange={e => setEditingRow({...editingRow, departamento: e.target.value})} />
                </div>
              </div>

              <div className="form-section" style={{ marginBottom: '24px' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '12px', fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Logística e Baptismo</h4>
                <div className="grid-2">
                  <div className="field">
                    <label>Hospedagem</label>
                    <select value={editingRow.hospedagem} onChange={e => setEditingRow({...editingRow, hospedagem: e.target.value})} required>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Participa na Celebração</label>
                    <select value={editingRow.participa_celebracao || ''} onChange={e => setEditingRow({...editingRow, participa_celebracao: e.target.value})} required>
                      <option value="">Selecione</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Contribuição</label>
                    <select value={editingRow.contribuicao} onChange={e => setEditingRow({...editingRow, contribuicao: e.target.value})} required>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                </div>
                {editingRow.contribuicao === 'Sim' && (
                  <div className="field">
                    <label>Valor Contribuição</label>
                    <input value={editingRow.valor_contribuicao || ''} onChange={e => setEditingRow({...editingRow, valor_contribuicao: e.target.value})} />
                  </div>
                )}
                
                <div className="field" style={{ marginTop: '10px' }}>
                  <label>Responsável pelo Registo</label>
                  <input value={editingRow.inscrito_por || ''} onChange={e => setEditingRow({...editingRow, inscrito_por: e.target.value})} required />
                </div>
                
                <div className="grid-2" style={{ marginTop: '10px' }}>
                  <div className="field">
                    <label className="check-label">
                      <input type="checkbox" checked={editingRow.batizado_agua} onChange={e => setEditingRow({...editingRow, batizado_agua: e.target.checked})} />
                      <span>Bat. Água</span>
                    </label>
                    {editingRow.batizado_agua && (
                      <DateSelector 
                        value={editingRow.data_batizado_agua} 
                        onChange={(name, val) => setEditingRow({...editingRow, [name]: val})} 
                        name="data_batizado_agua" 
                        required={false} 
                      />
                    )}
                  </div>
                  <div className="field">
                    <label className="check-label">
                      <input type="checkbox" checked={editingRow.batizado_espirito} onChange={e => setEditingRow({...editingRow, batizado_espirito: e.target.checked})} />
                      <span>Bat. Espírito</span>
                    </label>
                    {editingRow.batizado_espirito && (
                      <DateSelector 
                        value={editingRow.data_batizado_espirito} 
                        onChange={(name, val) => setEditingRow({...editingRow, [name]: val})} 
                        name="data_batizado_espirito" 
                        required={false} 
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="btn-row">
                <button type="button" className="btn-secondary btn-grow" onClick={() => setEditingRow(null)}>Cancelar</button>
                <button type="submit" className="btn-primary btn-grow" disabled={loading}>
                  <Save size={18} /> {loading ? 'A gravar...' : 'Gravar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
