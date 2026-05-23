import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Download, FileText, FileSpreadsheet, Table } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const HISTORICO_TABLE = 'ievc_historico';
const G = '#c5a059';

const COLS = [
  { key: 'created_at',       label: 'Data' },
  { key: 'nome',             label: 'Nome' },
  { key: 'sexo',             label: 'Sexo' },
  { key: 'funcao',           label: 'Função' },
  { key: 'provincia',        label: 'Província' },
  { key: 'distrito',         label: 'Distrito' },
  { key: 'igreja',           label: 'Igreja' },
  { key: 'localidade',       label: 'Localidade' },
  { key: 'quando_ingressou', label: 'Ingressou' },
  { key: 'telefone',         label: 'Telefone' },
  { key: 'whatsapp',         label: 'WhatsApp' },
  { key: 'email',            label: 'E-mail' },
  { key: 'onde_comecou',     label: 'Início da Igreja' },
  { key: 'igrejas_distrito', label: 'Igrejas Distrito' },
  { key: 'primeira_congregacao', label: '1ª Congregação' },
  { key: 'possui_documentos', label: 'Tem Docs' },
  { key: 'declaracao_verdadeira', label: 'Declaração' },
];

function fmt(col, val) {
  if (val === null || val === undefined || val === '') return '—';
  if (col.key === 'created_at') return new Date(val).toLocaleDateString('pt-MZ');
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
  return String(val);
}

export default function HistoricoAdminTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [filterProv, setFilterProv] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from(HISTORICO_TABLE)
        .select('*')
        .order('created_at', { ascending: false });
      setLoading(false);
      if (error) { setFetchError('Erro ao carregar dados.'); return; }
      setData(rows);
    })();
  }, []);

  const provincias = [...new Set(data.map(r => r.provincia).filter(Boolean))].sort();

  const filtered = data.filter(r => {
    if (filterProv && r.provincia !== filterProv) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return ['nome', 'funcao', 'provincia', 'distrito', 'igreja', 'telefone'].some(
        k => r[k] && String(r[k]).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: filtered.length,
    provincias: [...new Set(filtered.map(r => r.provincia).filter(Boolean))].length,
    comDocs: filtered.filter(r => r.possui_documentos === true).length,
    comMissionarios: filtered.filter(r => (r.missionarios || []).length > 0).length,
  };

  const exportCSV = () => {
    const sep = ';';
    const header = COLS.map(c => c.label).join(sep);
    const rows = filtered.map(r => COLS.map(c => {
      const v = fmt(c, r[c.key]);
      return v === '—' ? '' : `"${String(v).replace(/"/g, '""')}"`;
    }).join(sep)).join('\n');
    const blob = new Blob(['﻿' + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `historico_${new Date().toISOString().slice(0,10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const exportXLSX = () => {
    const ws = XLSX.utils.aoa_to_sheet([COLS.map(c => c.label), ...filtered.map(r => COLS.map(c => { const v = fmt(c, r[c.key]); return v === '—' ? '' : v; }))]);
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
      head: [COLS.map(c => c.label)],
      body: filtered.map(r => COLS.map(c => { const v = fmt(c, r[c.key]); return v === '—' ? '' : String(v); })),
      styles: { fontSize: 6, cellPadding: 2, overflow: 'linebreak', textColor: [0,0,0] },
      headStyles: { fillColor: [40,40,40], textColor: [255,255,255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240,240,240] },
      margin: { left: 14, right: 14 },
    });
    doc.save(`historico_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const sCard = { background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' };

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Pesquisar (Nome, Igreja, Telefone...)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', background: '#1a1a24', border: '1px solid #333', color: '#fff', fontSize: '0.9rem', flex: '1 1 200px', maxWidth: 280 }}
        />
        <select value={filterProv} onChange={e => setFilterProv(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', background: '#1e1e2d', color: '#fff', border: '1px solid #333', fontSize: '0.9rem' }}>
          <option value="">Todas as províncias</option>
          {provincias.map(p => <option key={p}>{p}</option>)}
        </select>
        <button className="btn-export" onClick={exportXLSX} title="Excel"><Table size={15} /> Excel</button>
        <button className="btn-export" onClick={exportCSV}  title="CSV"><FileSpreadsheet size={15} /> CSV</button>
        <button className="btn-export" onClick={exportPDF}  title="PDF"><FileText size={15} /> PDF</button>
      </div>

      {/* Stats */}
      {!loading && !fetchError && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div style={sCard}><div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>Total</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: G }}>{stats.total}</div></div>
          <div style={sCard}><div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>Províncias</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{stats.provincias}</div></div>
          <div style={sCard}><div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>Com Documentos</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{stats.comDocs}</div></div>
          <div style={sCard}><div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>Com Missionários</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{stats.comMissionarios}</div></div>
        </div>
      )}

      {loading && <p className="admin-status">A carregar...</p>}
      {fetchError && <p className="admin-status" style={{ color: '#f87171' }}>{fetchError}</p>}

      {!loading && !fetchError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {COLS.map(c => <th key={c.key}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={COLS.length} style={{ textAlign: 'center', color: '#555', padding: 24 }}>Nenhum registo encontrado.</td></tr>
              )}
              {filtered.map((r, i) => (
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
