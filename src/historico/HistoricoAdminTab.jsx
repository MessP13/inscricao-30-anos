import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Download, FileText, FileSpreadsheet, Table, Columns, Edit2, Trash2, X, Save, Flag, ChevronDown, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const HISTORICO_TABLE = 'ievc_historico';
const G = '#c5a059';

const PROVINCIAS = ['Cabo Delgado','Gaza','Inhambane','Manica','Maputo Cidade','Maputo Província','Nampula','Niassa','Sofala','Tete','Zambézia'];

const COLS = [
  { key: 'created_at',         label: 'Data' },
  { key: 'nome',               label: 'Nome' },
  { key: 'sexo',               label: 'Sexo' },
  { key: 'funcao',             label: 'Função' },
  { key: 'provincia',          label: 'Província' },
  { key: 'distrito',           label: 'Distrito' },
  { key: 'igreja',             label: 'Cidade/Vila' },
  { key: 'localidade',         label: 'Localidade' },
  { key: 'quando_ingressou',   label: 'Ingressou' },
  { key: 'telefone',           label: 'Telefone' },
  { key: 'whatsapp',           label: 'WhatsApp' },
  { key: 'email',              label: 'E-mail' },
  { key: 'onde_comecou',       label: 'Início da Igreja' },
  { key: 'igrejas_distrito',   label: 'Igrejas Distrito' },
  { key: 'templos_concluidos_distrito', label: 'Templos Concluídos' },
  { key: 'templos_construcao_distrito', label: 'Templos Construção' },
  { key: 'templos_material_distrito',   label: 'Templos Material' },
  { key: 'primeira_congregacao', label: '1ª Congregação' },
  { key: 'possui_documentos',  label: 'Tem Docs' },
  { key: 'declaracao_verdadeira', label: 'Declaração' },
];

function fmt(col, val) {
  if (val === null || val === undefined || val === '') return '—';
  if (col.key === 'created_at') return new Date(val).toLocaleDateString('pt-MZ');
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
  return String(val);
}


function hasMissionarios(r) {
  const m = r.missionarios;
  if (!m) return false;
  return (Array.isArray(m.coordenadores) && m.coordenadores.length > 0) ||
         (Array.isArray(m.outros) && m.outros.length > 0);
}

function hasObreiros(r) {
  const o = r.obreiros_nacionais;
  if (!o) return false;
  return (Array.isArray(o.coordenadores) && o.coordenadores.length > 0) ||
         (Array.isArray(o.lideres) && o.lideres.length > 0);
}

function JsonBlock({ label, value }) {
  const [open, setOpen] = useState(false);
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const isEmpty = typeof value === 'object' && !Array.isArray(value) &&
    Object.values(value).every(v => !v || (Array.isArray(v) && v.length === 0));
  if (isEmpty) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: G, cursor: 'pointer', fontSize: '0.87rem', padding: 0 }}>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} {label}
      </button>
      {open && (
        <pre style={{ background: '#0a0a14', border: '1px solid #2a2a3a', borderRadius: 6, padding: '10px', fontSize: '0.75rem', color: '#aaa', overflowX: 'auto', marginTop: 6, maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function HistoricoAdminTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [filterProv, setFilterProv] = useState('');
  const [filterFlag, setFilterFlag] = useState(false);
  const [selectedCols, setSelectedCols] = useState(COLS.map(c => c.key));
  const [showColPicker, setShowColPicker] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [flaggedIds, setFlaggedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('historico_admin_flagged') || '[]')); }
    catch { return new Set(); }
  });

  useEffect(() => {
    localStorage.setItem('historico_admin_flagged', JSON.stringify([...flaggedIds]));
  }, [flaggedIds]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from(HISTORICO_TABLE)
        .select('*')
        .order('created_at', { ascending: false });
      setLoading(false);
      if (error) { setFetchError('Erro ao carregar dados: ' + error.message); return; }
      setData(rows);
    })();
  }, []);

  const provincias = [...new Set(data.map(r => r.provincia).filter(Boolean))].sort();

  const filtered = data.filter(r => {
    if (filterProv && r.provincia !== filterProv) return false;
    if (filterFlag && !flaggedIds.has(r.id)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return ['nome', 'funcao', 'provincia', 'distrito', 'igreja', 'telefone', 'email'].some(
        k => r[k] && String(r[k]).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: filtered.length,
    provincias: [...new Set(filtered.map(r => r.provincia).filter(Boolean))].length,
    comMissionarios: filtered.filter(hasMissionarios).length,
    comObreiros: filtered.filter(hasObreiros).length,
    comDocs: filtered.filter(r => r.possui_documentos === true).length,
    declaracaoSim: filtered.filter(r => r.declaracao_verdadeira === true).length,
  };

  const activeCols = COLS.filter(c => selectedCols.includes(c.key));

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const toggleFlag = (id) => setFlaggedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este registo permanentemente?')) return;
    setSaving(true);
    const { error } = await supabase.from(HISTORICO_TABLE).delete().eq('id', id);
    setSaving(false);
    if (error) { alert('Erro: ' + error.message); return; }
    setData(prev => prev.filter(r => r.id !== id));
    setFlaggedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    if (!window.confirm(`Eliminar permanentemente ${selectedIds.size} registo(s)?`)) return;
    setSaving(true);
    const ids = [...selectedIds];
    const { error } = await supabase.from(HISTORICO_TABLE).delete().in('id', ids);
    setSaving(false);
    if (error) { alert('Erro: ' + error.message); return; }
    setData(prev => prev.filter(r => !selectedIds.has(r.id)));
    setFlaggedIds(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n; });
    setSelectedIds(new Set());
  };

  const handleEdit = (row) => setEditingRow({ ...row });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { created_at: _ca, id: _id, missionarios, obreiros_nacionais, congregacoes, referencias, data_inauguracao, anexos, notas_adicionais, ...payload } = editingRow;
    const { error } = await supabase.from(HISTORICO_TABLE).update(payload).eq('id', editingRow.id);
    setSaving(false);
    if (error) { alert('Erro: ' + error.message); return; }
    setData(prev => prev.map(r => r.id === editingRow.id ? { ...r, ...payload } : r));
    setEditingRow(null);
  };

  // ── Exports ──────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const sep = ';';
    const header = activeCols.map(c => c.label).join(sep);
    const rows = filtered.map(r => activeCols.map(c => {
      const v = fmt(c, r[c.key]); return v === '—' ? '' : `"${String(v).replace(/"/g, '""')}"`;
    }).join(sep)).join('\n');
    const blob = new Blob(['﻿' + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `historico_${new Date().toISOString().slice(0,10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const exportXLSX = () => {
    const ws = XLSX.utils.aoa_to_sheet([activeCols.map(c => c.label), ...filtered.map(r => activeCols.map(c => { const v = fmt(c, r[c.key]); return v === '—' ? '' : v; }))]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Levantamento');
    XLSX.writeFile(wb, `historico_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(197, 160, 89);
    doc.text('IEVC — Levantamento Histórico', 14, 16);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-MZ')} · ${filtered.length} registos`, 14, 22);
    autoTable(doc, {
      startY: 27,
      head: [activeCols.map(c => c.label)],
      body: filtered.map(r => activeCols.map(c => { const v = fmt(c, r[c.key]); return v === '—' ? '' : String(v); })),
      styles: { fontSize: 6, cellPadding: 2, overflow: 'linebreak', textColor: [0,0,0] },
      headStyles: { fillColor: [40,40,40], textColor: [255,255,255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240,240,240] },
      margin: { left: 14, right: 14 },
    });
    doc.save(`historico_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const exportDOC = () => {
    const headerRow = `<tr>${activeCols.map(c => `<th style="background:#1e1e32;color:#c5a059;padding:6px 10px;border:1px solid #333">${c.label}</th>`).join('')}</tr>`;
    const bodyRows = filtered.map((r, idx) => {
      const bg = idx % 2 === 0 ? '#0f0f19' : '#141428';
      return `<tr style="background:${bg}">${activeCols.map(c => {
        const v = fmt(c, r[c.key]);
        return `<td style="padding:5px 10px;border:1px solid #333;color:#ddd">${v === '—' ? '' : v}</td>`;
      }).join('')}</tr>`;
    }).join('');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial,sans-serif;font-size:10pt}h2{color:#c5a059}table{border-collapse:collapse;width:100%;font-size:9pt}</style></head><body><h2>IEVC — Levantamento Histórico</h2><p style="color:#999">Gerado em ${new Date().toLocaleDateString('pt-MZ')} · ${filtered.length} registos</p><table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `historico_${new Date().toISOString().slice(0,10)}.doc` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const sCard = { background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' };
  const sSectionTitle = { color: G, marginBottom: 12, fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: 8 };

  return (
    <div style={{ padding: '0 0 40px' }}>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <input type="text" placeholder="Pesquisar (Nome, Igreja, Telefone...)" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', background: '#1a1a24', border: '1px solid #333', color: '#fff', fontSize: '0.9rem', flex: '1 1 200px', maxWidth: 280 }} />

        <select value={filterProv} onChange={e => setFilterProv(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', background: '#1e1e2d', color: '#fff', border: '1px solid #333', fontSize: '0.9rem' }}>
          <option value="">Todas as províncias</option>
          {provincias.map(p => <option key={p}>{p}</option>)}
        </select>

        <button type="button"
          onClick={() => setFilterFlag(f => !f)}
          style={{ padding: '7px 12px', borderRadius: '6px', border: `1px solid ${filterFlag ? G : '#444'}`, background: filterFlag ? `${G}22` : 'transparent', color: filterFlag ? G : '#888', cursor: 'pointer', fontSize: '0.87rem', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Flag size={13} /> {filterFlag ? `Marcados (${flaggedIds.size})` : 'Todos'}
        </button>

        <div style={{ position: 'relative' }}>
          <button className="btn-export" onClick={() => setShowColPicker(v => !v)} title="Colunas">
            <Columns size={15} /> Colunas
          </button>
          {showColPicker && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#1a1a24', border: '1px solid #333', borderRadius: '8px', padding: '12px', zIndex: 100, width: 220, maxHeight: 300, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              <div style={{ marginBottom: 8, fontWeight: 'bold', color: G, fontSize: '0.9rem' }}>Colunas visíveis</div>
              {COLS.map(c => (
                <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: '0.85rem', cursor: 'pointer', color: '#ddd' }}>
                  <input type="checkbox" checked={selectedCols.includes(c.key)}
                    onChange={e => setSelectedCols(prev => e.target.checked ? [...prev, c.key] : prev.filter(k => k !== c.key))} />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <button className="btn-export" onClick={exportXLSX} title="Excel"><Table size={15} /> Excel</button>
        <button className="btn-export" onClick={exportCSV}  title="CSV"><FileSpreadsheet size={15} /> CSV</button>
        <button className="btn-export" onClick={exportPDF}  title="PDF"><FileText size={15} /> PDF</button>
        <button className="btn-export" onClick={exportDOC}  title="Word"><Download size={15} /> Word</button>
      </div>

      {/* Stats */}
      {!loading && !fetchError && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div style={sCard}><div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>Total</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: G }}>{stats.total}</div></div>
          <div style={sCard}><div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>Províncias</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{stats.provincias}</div></div>
          <div style={sCard}><div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>Missionários</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{stats.comMissionarios}</div></div>
          <div style={sCard}><div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>Obreiros Nac.</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{stats.comObreiros}</div></div>
          <div style={sCard}><div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>Com Docs</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{stats.comDocs}</div></div>
          <div style={sCard}><div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>Declaração ✓</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{stats.declaracaoSim}</div></div>
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, padding: '10px 16px', background: `${G}1a`, borderRadius: 8, border: `1px solid ${G}4d` }}>
          <span style={{ color: G, fontWeight: 'bold', fontSize: '0.9rem' }}>{selectedIds.size} seleccionado(s)</span>
          <button className="btn-export" onClick={() => setFlaggedIds(prev => { const n = new Set(prev); selectedIds.forEach(id => n.add(id)); return n; })}>
            <Flag size={13} /> Marcar
          </button>
          <button className="btn-export" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.4)' }} onClick={handleBulkDelete} disabled={saving}>
            <Trash2 size={13} /> Eliminar seleccionados
          </button>
          <button className="btn-export" onClick={() => setSelectedIds(new Set())}><X size={13} /> Limpar</button>
        </div>
      )}

      {loading && <p className="admin-status">A carregar...</p>}
      {fetchError && <p className="admin-status" style={{ color: '#f87171' }}>{fetchError}</p>}

      {!loading && !fetchError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 36, textAlign: 'center' }}>
                  <input type="checkbox"
                    checked={filtered.length > 0 && filtered.every(r => selectedIds.has(r.id))}
                    onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map(r => r.id)) : new Set())} />
                </th>
                <th style={{ width: 28 }} />
                <th style={{ width: 28 }} />
                {activeCols.map(c => <th key={c.key}>{c.label}</th>)}
                <th style={{ width: 80, textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={activeCols.length + 4} style={{ textAlign: 'center', color: '#555', padding: 24 }}>Nenhum registo encontrado.</td></tr>
              )}
              {filtered.map((r, i) => (
                <Fragment key={r.id || i}>
                  <tr style={flaggedIds.has(r.id) ? { background: `${G}0f` } : {}}>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Flag size={13} style={{ cursor: 'pointer', color: flaggedIds.has(r.id) ? G : '#444' }}
                        onClick={() => toggleFlag(r.id)} title={flaggedIds.has(r.id) ? 'Desmarcar' : 'Marcar'} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button type="button" onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 2 }}>
                        {expandedRow === r.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>
                    </td>
                    {activeCols.map(c => <td key={c.key}>{fmt(c, r[c.key])}</td>)}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn-action btn-action-edit" onClick={() => handleEdit(r)} title="Editar"><Edit2 size={15} /></button>
                        <button className="btn-action btn-action-delete" onClick={() => handleDelete(r.id)} title="Eliminar" disabled={saving}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === r.id && (
                    <tr>
                      <td colSpan={activeCols.length + 4} style={{ background: '#0a0a14', padding: '16px 20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                          <JsonBlock label="Missionários" value={r.missionarios} />
                          <JsonBlock label="Obreiros Nacionais" value={r.obreiros_nacionais} />
                          <JsonBlock label="Congregações" value={r.congregacoes} />
                          <JsonBlock label="Referências" value={r.referencias} />
                          <JsonBlock label="Anexos" value={r.anexos} />
                          <JsonBlock label="Notas Adicionais" value={r.notas_adicionais} />
                        </div>
                        {r.observacoes_finais && (
                          <div style={{ marginTop: 8 }}>
                            <span style={{ color: '#888', fontSize: '0.82rem' }}>Observações finais: </span>
                            <span style={{ color: '#ccc', fontSize: '0.87rem' }}>{r.observacoes_finais}</span>
                          </div>
                        )}
                        {r.experiencia_marcante && (
                          <div style={{ marginTop: 6 }}>
                            <span style={{ color: '#888', fontSize: '0.82rem' }}>Experiência marcante: </span>
                            <span style={{ color: '#ccc', fontSize: '0.87rem' }}>{r.experiencia_marcante}</span>
                          </div>
                        )}
                        {r.impacto_comunidade && (
                          <div style={{ marginTop: 6 }}>
                            <span style={{ color: '#888', fontSize: '0.82rem' }}>Impacto: </span>
                            <span style={{ color: '#ccc', fontSize: '0.87rem' }}>{r.impacto_comunidade}</span>
                          </div>
                        )}
                        {r.momentos_marcantes && (
                          <div style={{ marginTop: 6 }}>
                            <span style={{ color: '#888', fontSize: '0.82rem' }}>Momentos marcantes: </span>
                            <span style={{ color: '#ccc', fontSize: '0.87rem' }}>{r.momentos_marcantes}</span>
                          </div>
                        )}
                        {(r.desafios || []).length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <span style={{ color: '#888', fontSize: '0.82rem' }}>Desafios: </span>
                            <span style={{ color: '#ccc', fontSize: '0.87rem' }}>{(r.desafios || []).join(', ')}{r.desafios_outros ? ` — ${r.desafios_outros}` : ''}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editingRow && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Registo</h3>
              <button className="modal-close" onClick={() => setEditingRow(null)}><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdate}>

              <div className="form-section">
                <h4 style={sSectionTitle}>Identificação</h4>
                <div className="field">
                  <label>Nome completo</label>
                  <input value={editingRow.nome || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, nome: v })); }} required />
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Sexo</label>
                    <select value={editingRow.sexo || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, sexo: v })); }}>
                      <option value="">—</option>
                      <option>Masculino</option>
                      <option>Feminino</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Função</label>
                    <input value={editingRow.funcao || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, funcao: v })); }} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Ano de ingresso</label>
                    <input value={editingRow.quando_ingressou || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, quando_ingressou: v })); }} placeholder="Ex: 2003" />
                  </div>
                  <div className="field">
                    <label>E-mail</label>
                    <input type="email" value={editingRow.email || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, email: v })); }} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Telefone</label>
                    <input value={editingRow.telefone || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, telefone: v })); }} />
                  </div>
                  <div className="field">
                    <label>WhatsApp</label>
                    <input value={editingRow.whatsapp || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, whatsapp: v })); }} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 style={sSectionTitle}>Localização</h4>
                <div className="grid-2">
                  <div className="field">
                    <label>Província</label>
                    <select value={editingRow.provincia || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, provincia: v, distrito: '' })); }}>
                      <option value="">—</option>
                      {PROVINCIAS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Distrito</label>
                    <input value={editingRow.distrito || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, distrito: v })); }} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Cidade/Vila</label>
                    <input value={editingRow.igreja || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, igreja: v })); }} />
                  </div>
                  <div className="field">
                    <label>Localidade/Bairro</label>
                    <input value={editingRow.localidade || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, localidade: v })); }} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 style={sSectionTitle}>Igreja Local</h4>
                <div className="grid-2">
                  <div className="field">
                    <label>Onde começou</label>
                    <select value={editingRow.onde_comecou || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, onde_comecou: v })); }}>
                      <option value="">—</option>
                      <option>Num templo</option><option>Numa casa</option>
                      <option>Numa escola</option><option>Ao ar livre</option><option>Outro</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>1ª Congregação inaugurada</label>
                    <input value={editingRow.primeira_congregacao || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, primeira_congregacao: v })); }} />
                  </div>
                </div>
                {editingRow.onde_comecou === 'Outro' && (
                  <div className="field">
                    <label>Especifique onde começou</label>
                    <input value={editingRow.onde_comecou_outro || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, onde_comecou_outro: v })); }} />
                  </div>
                )}
                <div className="grid-2">
                  <div className="field">
                    <label>Igrejas no distrito</label>
                    <input type="number" min="0" value={editingRow.igrejas_distrito ?? ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, igrejas_distrito: v === '' ? null : parseInt(v) })); }} />
                  </div>
                  <div className="field">
                    <label>Templos concluídos</label>
                    <input type="number" min="0" value={editingRow.templos_concluidos_distrito ?? ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, templos_concluidos_distrito: v === '' ? null : parseInt(v) })); }} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Templos em construção</label>
                    <input type="number" min="0" value={editingRow.templos_construcao_distrito ?? ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, templos_construcao_distrito: v === '' ? null : parseInt(v) })); }} />
                  </div>
                  <div className="field">
                    <label>Templos material local</label>
                    <input type="number" min="0" value={editingRow.templos_material_distrito ?? ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, templos_material_distrito: v === '' ? null : parseInt(v) })); }} />
                  </div>
                </div>
                <div className="field">
                  <label>Possui documentos históricos</label>
                  <select value={editingRow.possui_documentos === true ? 'Sim' : editingRow.possui_documentos === false ? 'Não' : ''}
                    onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, possui_documentos: v === 'Sim' ? true : v === 'Não' ? false : null })); }}>
                    <option value="">—</option><option>Sim</option><option>Não</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h4 style={sSectionTitle}>Desafios e Testemunhos</h4>
                <div className="field">
                  <label>Desafios enfrentados</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {['Financeiros', 'Falta de liderança', 'Resistência da comunidade', 'Outros'].map(d => (
                      <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#ccc', fontSize: '0.95rem' }}>
                        <input type="checkbox" style={{ accentColor: G }}
                          checked={(editingRow.desafios || []).includes(d)}
                          onChange={e => {
                            const checked = e.target.checked;
                            setEditingRow(prev => {
                              const cur = prev.desafios || [];
                              return { ...prev, desafios: checked ? [...cur, d] : cur.filter(x => x !== d) };
                            });
                          }} />
                        {d}
                      </label>
                    ))}
                  </div>
                </div>
                {(editingRow.desafios || []).includes('Outros') && (
                  <div className="field">
                    <label>Outros desafios — descrição</label>
                    <textarea value={editingRow.desafios_outros || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, desafios_outros: v })); }} rows={2} />
                  </div>
                )}
                <div className="field">
                  <label>Momentos marcantes</label>
                  <textarea value={editingRow.momentos_marcantes || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, momentos_marcantes: v })); }} rows={3} />
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Experiência marcante</label>
                    <textarea value={editingRow.experiencia_marcante || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, experiencia_marcante: v })); }} rows={4} />
                  </div>
                  <div className="field">
                    <label>Impacto na comunidade</label>
                    <textarea value={editingRow.impacto_comunidade || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, impacto_comunidade: v })); }} rows={4} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 style={sSectionTitle}>Declaração e Observações</h4>
                <div className="field">
                  <label>Declaração de veracidade</label>
                  <select value={editingRow.declaracao_verdadeira === true ? 'Sim' : editingRow.declaracao_verdadeira === false ? 'Não' : ''}
                    onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, declaracao_verdadeira: v === 'Sim' ? true : v === 'Não' ? false : null })); }}>
                    <option value="">—</option><option>Sim</option><option>Não</option>
                  </select>
                </div>
                <div className="field">
                  <label>Observações finais</label>
                  <textarea value={editingRow.observacoes_finais || ''} onChange={e => { const v = e.target.value; setEditingRow(prev => ({ ...prev, observacoes_finais: v })); }} rows={4} />
                </div>
              </div>

              <div className="btn-row">
                <button type="button" className="btn-secondary btn-grow" onClick={() => setEditingRow(null)}>Cancelar</button>
                <button type="submit" className="btn-primary btn-grow" disabled={saving}>
                  <Save size={18} /> {saving ? 'A gravar...' : 'Gravar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
