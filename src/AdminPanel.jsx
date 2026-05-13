// ✏️  LOG: após qualquer alteração neste ficheiro, execute "npm run logs"
import { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { LogOut, Download, FileText, FileSpreadsheet, Table } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

const COLS = [
  { key: 'created_at',            label: 'Data Inscrição' },
  { key: 'nome',                  label: 'Nome' },
  { key: 'sexo',                  label: 'Sexo' },
  { key: 'idade',                 label: 'Faixa Etária' },
  { key: 'distrito',              label: 'Distrito' },
  { key: 'localizacao',           label: 'Localização' },
  { key: 'funcao',                label: 'Função' },
  { key: 'departamento',          label: 'Departamento' },
  { key: 'contacto',              label: 'Telefone' },
  { key: 'whatsapp',              label: 'WhatsApp' },
  { key: 'batizado_agua',         label: 'Bat. Água' },
  { key: 'data_batizado_agua',    label: 'Data Bat. Água' },
  { key: 'batizado_espirito',     label: 'Bat. Espírito' },
  { key: 'data_batizado_espirito',label: 'Data Bat. Espírito' },
  { key: 'hospedagem',            label: 'Hospedagem' },
  { key: 'contribuicao',          label: 'Contribuição' },
  { key: 'valor_contribuicao',    label: 'Valor' },
];

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
    const sep = ';';
    const header = COLS.map(c => c.label).join(sep);
    const rows = data.map(r =>
      COLS.map(c => {
        const v = fmt(c, r[c.key]);
        return v === '—' ? '' : `"${String(v).replace(/"/g, '""')}"`;
      }).join(sep)
    ).join('\n');
    // UTF-8 BOM so Excel opens with correct encoding
    const bom = '﻿';
    const blob = new Blob([bom + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `inscricoes_30anos_${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(197, 160, 89);
    doc.text('Visão Cristã — Inscrições 30 Anos', 14, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-MZ')} · ${data.length} registos`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [COLS.map(c => c.label)],
      body: data.map(r => COLS.map(c => {
        const v = fmt(c, r[c.key]);
        return v === '—' ? '' : String(v);
      })),
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 30, 50], textColor: [197, 160, 89], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [20, 20, 35] },
      bodyStyles: { fillColor: [15, 15, 25], textColor: [220, 220, 220] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`inscricoes_30anos_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportXLSX = () => {
    const header = COLS.map(c => c.label);
    const rows = data.map(r => COLS.map(c => {
      const v = fmt(c, r[c.key]);
      return v === '—' ? '' : v;
    }));
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inscrições');
    XLSX.writeFile(wb, `inscricoes_30anos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportDOC = () => {
    const headerRow = `<tr>${COLS.map(c => `<th style="background:#1e1e32;color:#c5a059;padding:6px 10px;border:1px solid #333;white-space:nowrap">${c.label}</th>`).join('')}</tr>`;
    const bodyRows = data.map((r, idx) => {
      const bg = idx % 2 === 0 ? '#0f0f19' : '#141428';
      return `<tr style="background:${bg}">${COLS.map(c => {
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
<h2>Visão Cristã — Inscrições 30 Anos</h2>
<p style="color:#999">Gerado em ${new Date().toLocaleDateString('pt-MZ')} · ${data.length} registos</p>
<table>
  <thead>${headerRow}</thead>
  <tbody>${bodyRows}</tbody>
</table>
</body></html>`;

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `inscricoes_30anos_${new Date().toISOString().slice(0, 10)}.doc`,
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
