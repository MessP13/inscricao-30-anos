import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import './historico.css';

const HISTORICO_PASSWORD = import.meta.env.VITE_HISTORICO_PASSWORD || 'ievc2010';
const HISTORICO_TABLE = 'ievc_historico';
const LS_FORM = 'historico_form_v1';
const LS_SUB = 'historico_sub_v1';
const G = 'var(--primary)';

const PD = {
  'Cabo Delgado': ['Ancuabe','Balama','Chiúre','Ibo','Macomia','Mecúfi','Meluco','Metuge','Mocímboa da Praia','Montepuez','Mueda','Muidumbe','Namuno','Nangade','Palma','Pemba','Quissanga'],
  'Gaza': ['Bilene','Chibuto','Chicualacuala','Chigubo','Chókwè','Chongoene','Guijá','Limpopo','Mabalane','Manjacaze','Mapai','Massangena','Massingir','Xai-Xai'],
  'Inhambane': ['Funhalouro','Govuro','Homoíne','Inhambane','Inharrime','Inhassoro','Jangamo','Mabote','Massinga','Maxixe','Morrumbene','Panda','Vilanculos','Zavala'],
  'Manica': ['Bárue','Chimoio','Gondola','Guro','Macate','Machaze','Macossa','Manica','Mossurize','Sussundenga','Tambara','Vanduzi'],
  'Maputo Cidade': ['KaMpfumo','KaNlhamankulu','KaMaxaquene','KaMavota','KaMubukwana','KaTembe','KaNyaka'],
  'Maputo Província': ['Boane','Magude','Manhiça','Marracuene','Matola','Matutuíne','Moamba','Namaacha'],
  'Nampula': ['Angoche','Eráti','Ilha de Moçambique','Lalaua','Larde','Liúpo','Malema','Meconta','Mecubúri','Memba','Mogincual','Mogovolas','Moma','Monapo','Mossuril','Muecate','Murrupula','Nacala Porto','Nacala-a-Velha','Nacarôa','Nampula','Rapale','Ribaué'],
  'Niassa': ['Chimbonila','Cuamba','Lago','Lichinga','Majune','Mandimba','Marrupa','Maúa','Mavago','Mecanhelas','Mecula','Metarica','Muembe',"N'gauma",'Nipepe','Sanga'],
  'Sofala': ['Beira','Búzi','Caia','Chemba','Cheringoma','Chibabava','Dondo','Gorongosa','Machanga','Maringué','Marromeu','Muanza','Nhamatanda'],
  'Tete': ['Angónia','Cahora-Bassa','Changara','Chifunde','Chiuta','Dôa','Macanga','Magoé','Marara','Marávia','Moatize','Mutarara','Tete','Tsangano','Zumbo'],
  'Zambézia': ['Alto Molócue','Chinde','Derre','Gilé','Gurué','Ile','Inhassunge','Luabo','Lugela','Maganja da Costa','Milange','Mocuba','Mocubela','Molumbo','Mopeia','Morrumbala','Mulevala','Namacurra','Namarroi','Nicoadala','Pebane','Quelimane'],
};

const PROVINCIAS = Object.keys(PD);
const uid = () => Math.random().toString(36).slice(2, 9);

const emptyPeriodo = () => ({ id: uid(), periodo: '', funcao: '', proveniencia: '', saidaPara: '' });
const emptyPessoa = () => ({ id: uid(), nome: '', distritoCidade: '', periodos: [emptyPeriodo()], destaques: '', numObreiros: '', acrescimo: '' });
const emptyCongregacao = () => ({ id: uid(), distrito: '', localidade: '', data: { mode: 'unknown' } });
const emptyReferencia = () => ({ id: uid(), nome: '', contacto: '' });
const emptyCoordenador = () => ({ id: uid(), nome: '', inicio: { mode: 'unknown' }, cessacao: { mode: 'unknown' }, conquistasDestaques: '', desafiosDestaques: '' });
const emptyOutroMissionario = () => ({ id: uid(), nome: '', distrito: '', areaAtuacao: '', inicio: { mode: 'unknown' }, cessacao: { mode: 'unknown' }, conquistasDestaques: '', desafiosDestaques: '' });
const emptyObreiroLider = () => ({
  id: uid(), nome: '', categorias: [], distrito: '',
  periodoEvangelista: { inicio: { mode: 'unknown' }, cessacao: { mode: 'unknown' } },
  periodoPastor:      { inicio: { mode: 'unknown' }, cessacao: { mode: 'unknown' } },
  conquistasDestaques: '', desafiosDestaques: '',
});

const EMPTY_FORM = {
  nome: '', sexo: '', provincia: '', distrito: '', igreja: '', localidade: '',
  funcao: '', quando_ingressou: '', whatsapp: '', telefone: '', email: '',
  coordenadores_provinciais: [emptyCoordenador()], outros_missionarios: [emptyOutroMissionario()],
  obreiros_coordenadores: [emptyCoordenador()], obreiros_lideres: [emptyObreiroLider()],
  onde_comecou: '', onde_comecou_outro: '',
  igrejas_distrito: '', templos_concluidos_distrito: '', templos_construcao_distrito: '', templos_material_distrito: '',
  primeira_congregacao: '', congregacoes: [], data_inauguracao: { mode: 'unknown' },
  desafios: [], desafios_outros: '', momentos_marcantes: '',
  experiencia_marcante: '', impacto_comunidade: '',
  possui_documentos: null, referencias: [emptyReferencia()], observacoes_finais: '',
  declaracao_verdadeira: null,
  anexos: [],
};

const YEAR_OPTS = Array.from({ length: 31 }, (_, i) => 2026 - i);

// ── DateFlex ───────────────────────────────────────────────────────────────────
function DateFlex({ value = { mode: 'unknown' }, onChange }) {
  return (
    <select
      style={{ padding: '6px 10px', borderRadius: '6px', background: '#1a1a24', border: '1px solid #333', color: '#fff', fontSize: '1.02rem', width: '100%' }}
      value={value?.year || ''}
      onChange={e => onChange({ mode: e.target.value ? 'exact' : 'unknown', year: e.target.value || null })}
    >
      <option value="">Ano desconhecido</option>
      {YEAR_OPTS.map(y => <option key={y} value={y}>{y}</option>)}
    </select>
  );
}

function serializeDateFlex(df) {
  if (!df || !df.mode) return null;
  if (df.mode === 'unknown') return { mode: 'unknown' };
  if (df.mode === 'exact') {
    const obj = { mode: 'exact' };
    if (df.year)  obj.year  = parseInt(df.year);
    if (df.month) obj.month = parseInt(df.month);
    if (df.day)   obj.day   = parseInt(df.day);
    return obj;
  }
  if (df.mode === 'approximate') {
    const obj = { mode: 'approximate' };
    const pick = (part) => {
      if (!part) return undefined;
      const p = {};
      if (part.year)  p.year  = parseInt(part.year);
      if (part.month) p.month = parseInt(part.month);
      if (part.day)   p.day   = parseInt(part.day);
      return Object.keys(p).length ? p : undefined;
    };
    const from = pick(df.from);
    const to   = pick(df.to);
    if (from) obj.from = from;
    if (to)   obj.to   = to;
    return obj;
  }
  return null;
}

// ── PersonTable ────────────────────────────────────────────────────────────────
function PersonTable({ title, items, onChange, provinciaAtual }) {
  const upd = (id, patch) => onChange(items.map(p => p.id === id ? { ...p, ...patch } : p));
  const updPer = (pid, perId, patch) => onChange(items.map(p =>
    p.id === pid ? { ...p, periodos: p.periodos.map(per => per.id === perId ? { ...per, ...patch } : per) } : p
  ));

  // estilos → .hf-input.hf-input-sm em CSS; inline só para overrides pontuais

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: G, fontWeight: 600, fontSize: '1.12rem' }}>{title}</span>
        <button type="button" onClick={() => onChange([...items, emptyPessoa()])} style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px',
          borderRadius: '6px', background: G, color: '#000', border: 'none', cursor: 'pointer', fontSize: '0.97rem', fontWeight: 600,
        }}>
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {items.length === 0 && <p style={{ color: '#555', fontSize: '1.02rem', fontStyle: 'italic' }}>Nenhum registo adicionado.</p>}

      {items.map((p, idx) => (
        <div key={p.id} style={{ background: '#0d0d1a', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '16px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: '#666', fontSize: '1.12rem' }}>#{idx + 1}</span>
            <button type="button" onClick={() => onChange(items.filter(x => x.id !== p.id))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
              <Trash2 size={15} />
            </button>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: '1.12rem', color: '#aaa', marginBottom: 4 }}>Nome *</label>
            <input className="hf-input hf-input-sm" value={p.nome} onChange={e => upd(p.id, { nome: e.target.value })} placeholder="Nome completo" />
          </div>

          {p.nome && <>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: '1.12rem', color: '#aaa', marginBottom: 4 }}>Distrito</label>
              <select className="hf-input hf-input-sm" value={p.distritoCidade} onChange={e => upd(p.id, { distritoCidade: e.target.value })}>
                <option value="">— Seleccione —</option>
                {(PD[provinciaAtual] || []).map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '1.12rem', color: '#aaa' }}>Períodos</label>
                <button type="button" onClick={() => onChange(items.map(x => x.id === p.id ? { ...x, periodos: [...x.periodos, emptyPeriodo()] } : x))}
                  style={{ background: '#1a1a2e', border: `1px solid ${G}55`, color: G, padding: '3px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem' }}>
                  + Período
                </button>
              </div>
              {p.periodos.map((per, pIdx) => (
                <div key={per.id} style={{ background: '#0a0a14', border: '1px solid #1e1e2e', borderRadius: '6px', padding: '10px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#555', fontSize: '1.07rem' }}>Período {pIdx + 1}</span>
                    {p.periodos.length > 1 && (
                      <button type="button" onClick={() => onChange(items.map(x => x.id === p.id ? { ...x, periodos: x.periodos.filter(per2 => per2.id !== per.id) } : x))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <input className="hf-input hf-input-sm" value={per.periodo}     onChange={e => updPer(p.id, per.id, { periodo:     e.target.value })} placeholder="Período (ex: 2003–2010)" />
                    <input className="hf-input hf-input-sm" value={per.funcao}      onChange={e => updPer(p.id, per.id, { funcao:      e.target.value })} placeholder="Função" />
                    <input className="hf-input hf-input-sm" value={per.proveniencia} onChange={e => updPer(p.id, per.id, { proveniencia: e.target.value })} placeholder="Proveniência" />
                    <input className="hf-input hf-input-sm" value={per.saidaPara}   onChange={e => updPer(p.id, per.id, { saidaPara:   e.target.value })} placeholder="Saída para?" />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: '1.12rem', color: '#aaa', marginBottom: 4 }}>Nº de Obreiros</label>
                <input className="hf-input hf-input-sm" type="number" min="0" value={p.numObreiros} onChange={e => upd(p.id, { numObreiros: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '1.12rem', color: '#aaa', marginBottom: 4 }}>Acréscimo</label>
                <input className="hf-input hf-input-sm" value={p.acrescimo} onChange={e => upd(p.id, { acrescimo: e.target.value })} placeholder="Campo aberto" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '1.12rem', color: '#aaa', marginBottom: 4 }}>Destaques</label>
              <textarea className="hf-input hf-input-sm" style={{ minHeight: 60, resize: 'vertical' }} value={p.destaques} onChange={e => upd(p.id, { destaques: e.target.value })} placeholder="Destaques relevantes..." />
            </div>
          </>}
        </div>
      ))}
    </div>
  );
}

const AREAS_ATUACAO = ['Liderança da igreja','Secretaria','EBD','Jovens','Senhoras','C. de Oração','Formação','Outro'];

function CoordenadorTable({ items, onChange, title = 'Coordenadores Provinciais' }) {
  const upd = (id, patch) => onChange(items.map(x => x.id === id ? { ...x, ...patch } : x));

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#ccc', fontSize: '1.02rem', fontWeight: 600 }}>{title}</span>
      </div>
      {items.map((p, idx) => (
        <div key={p.id} style={{ background: '#0d0d1a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '12px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: '#555', fontSize: '1.07rem' }}>#{idx + 1}</span>
            <button type="button" onClick={() => onChange(items.filter(x => x.id !== p.id))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}><Trash2 size={14} /></button>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="hf-label-sm">Nome</label>
            <input className="hf-input hf-input-sm" value={p.nome} onChange={e => upd(p.id, { nome: e.target.value })} placeholder="Nome completo" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
            <div>
              <label className="hf-label-sm">Início da função</label>
              <DateFlex value={p.inicio} onChange={v => upd(p.id, { inicio: v })} hideUnknown />
            </div>
            <div>
              <label className="hf-label-sm">Cessação</label>
              <DateFlex value={p.cessacao} onChange={v => upd(p.id, { cessacao: v })} hideUnknown />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="hf-label-sm">Destaques relevantes (conquistas)</label>
              <textarea className="hf-input hf-input-sm" style={{ minHeight: 64, resize: 'vertical' }} value={p.conquistasDestaques} onChange={e => upd(p.id, { conquistasDestaques: e.target.value })} placeholder="Conquistas e marcos positivos..." />
            </div>
            <div>
              <label className="hf-label-sm">Destaques relevantes (desafios)</label>
              <textarea className="hf-input hf-input-sm" style={{ minHeight: 64, resize: 'vertical' }} value={p.desafiosDestaques} onChange={e => upd(p.id, { desafiosDestaques: e.target.value })} placeholder="Dificuldades e obstáculos enfrentados..." />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, emptyCoordenador()])}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: '6px', background: G, color: '#000', border: 'none', cursor: 'pointer', fontSize: '1.0rem', fontWeight: 600, marginTop: 4 }}>
        <Plus size={13} /> Adicionar
      </button>
    </div>
  );
}

function OutroMissionarioTable({ items, onChange, provinciaAtual }) {
  const upd = (id, patch) => onChange(items.map(x => x.id === id ? { ...x, ...patch } : x));
  const distritos = PD[provinciaAtual] || [];

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#ccc', fontSize: '1.02rem', fontWeight: 600 }}>Outros Missionários e Missionárias</span>
      </div>
      {items.map((p, idx) => (
        <div key={p.id} style={{ background: '#0d0d1a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '12px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: '#555', fontSize: '1.07rem' }}>#{idx + 1}</span>
            <button type="button" onClick={() => onChange(items.filter(x => x.id !== p.id))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}><Trash2 size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label className="hf-label-sm">Nome</label>
              <input className="hf-input hf-input-sm" value={p.nome} onChange={e => upd(p.id, { nome: e.target.value })} placeholder="Nome completo" />
            </div>
            <div>
              <label className="hf-label-sm">Distrito</label>
              <select className="hf-input hf-input-sm" value={p.distrito} onChange={e => upd(p.id, { distrito: e.target.value })}>
                <option value="">— Seleccione —</option>
                {distritos.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="hf-label-sm">Área de actuação</label>
            <select className="hf-input hf-input-sm" value={p.areaAtuacao} onChange={e => upd(p.id, { areaAtuacao: e.target.value })}>
              <option value="">— Seleccione —</option>
              {AREAS_ATUACAO.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
            <div>
              <label className="hf-label-sm">Início da função</label>
              <DateFlex value={p.inicio} onChange={v => upd(p.id, { inicio: v })} hideUnknown />
            </div>
            <div>
              <label className="hf-label-sm">Cessação</label>
              <DateFlex value={p.cessacao} onChange={v => upd(p.id, { cessacao: v })} hideUnknown />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="hf-label-sm">Destaques relevantes (conquistas)</label>
              <textarea className="hf-input hf-input-sm" style={{ minHeight: 64, resize: 'vertical' }} value={p.conquistasDestaques} onChange={e => upd(p.id, { conquistasDestaques: e.target.value })} placeholder="Conquistas e marcos positivos..." />
            </div>
            <div>
              <label className="hf-label-sm">Destaques relevantes (desafios)</label>
              <textarea className="hf-input hf-input-sm" style={{ minHeight: 64, resize: 'vertical' }} value={p.desafiosDestaques} onChange={e => upd(p.id, { desafiosDestaques: e.target.value })} placeholder="Dificuldades e obstáculos enfrentados..." />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, emptyOutroMissionario()])}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: '6px', background: G, color: '#000', border: 'none', cursor: 'pointer', fontSize: '1.0rem', fontWeight: 600, marginTop: 4 }}>
        <Plus size={13} /> Adicionar
      </button>
    </div>
  );
}

const CATEGORIAS_MIN = ['Pastor', 'Evangelista'];

function ObreiroLiderTable({ items, onChange, provinciaAtual }) {
  const upd = (id, patch) => onChange(items.map(x => x.id === id ? { ...x, ...patch } : x));
  const distritos = PD[provinciaAtual] || [];

  const toggleCat = (p, cat) => {
    const cats = p.categorias.includes(cat)
      ? p.categorias.filter(c => c !== cat)
      : [...p.categorias, cat];
    upd(p.id, { categorias: cats });
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#ccc', fontSize: '1.02rem', fontWeight: 600 }}>Pastores/Líderes de Congregação</span>
      </div>
      {items.map((p, idx) => (
        <div key={p.id} className="hf-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="hf-row-num">#{idx + 1}</span>
            <button type="button" onClick={() => onChange(items.filter(x => x.id !== p.id))} className="hf-btn-icon"><Trash2 size={14} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label className="hf-label-sm">Nome</label>
              <input className="hf-input hf-input-sm" value={p.nome} onChange={e => upd(p.id, { nome: e.target.value })} placeholder="Nome completo" />
            </div>
            <div>
              <label className="hf-label-sm">Distrito</label>
              <select className="hf-input hf-input-sm" value={p.distrito} onChange={e => upd(p.id, { distrito: e.target.value })}>
                <option value="">— Seleccione —</option>
                {distritos.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="hf-label-sm" style={{ marginBottom: 6 }}>Função desempenhada</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {CATEGORIAS_MIN.map(cat => (
                <button key={cat} type="button" onClick={() => toggleCat(p, cat)} style={{
                  padding: '5px 16px', borderRadius: '6px', fontSize: '1.02rem', cursor: 'pointer',
                  background: p.categorias.includes(cat) ? G : '#1a1a24',
                  color: p.categorias.includes(cat) ? '#000' : '#aaa',
                  border: `1px solid ${p.categorias.includes(cat) ? G : '#333'}`,
                  fontWeight: p.categorias.includes(cat) ? 600 : 400,
                }}>{cat}</button>
              ))}
            </div>
          </div>

          {p.categorias.length === 2 && (
            <div className="hf-card-period" style={{ marginTop: 12 }}>
              <p style={{ color: '#aaa', fontSize: '1.0rem', margin: '0 0 14px', lineHeight: 1.6 }}>
                Esta pessoa desempenhou as duas funções ao longo do tempo.
                Indique, tanto quanto possível, o período em que exerceu cada uma:
              </p>

              <div style={{ marginBottom: 14 }}>
                <p style={{ color: G, fontSize: '1.02rem', fontWeight: 600, margin: '0 0 8px' }}>Como Evangelista</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="hf-label-sm">Início</label>
                    <DateFlex value={p.periodoEvangelista.inicio}
                      onChange={v => upd(p.id, { periodoEvangelista: { ...p.periodoEvangelista, inicio: v } })} hideUnknown />
                  </div>
                  <div>
                    <label className="hf-label-sm">Cessação</label>
                    <DateFlex value={p.periodoEvangelista.cessacao}
                      onChange={v => upd(p.id, { periodoEvangelista: { ...p.periodoEvangelista, cessacao: v } })} hideUnknown />
                  </div>
                </div>
              </div>

              <div>
                <p style={{ color: G, fontSize: '1.02rem', fontWeight: 600, margin: '0 0 8px' }}>Como Pastor do distrito</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="hf-label-sm">Início</label>
                    <DateFlex value={p.periodoPastor.inicio}
                      onChange={v => upd(p.id, { periodoPastor: { ...p.periodoPastor, inicio: v } })} hideUnknown />
                  </div>
                  <div>
                    <label className="hf-label-sm">Cessação</label>
                    <DateFlex value={p.periodoPastor.cessacao}
                      onChange={v => upd(p.id, { periodoPastor: { ...p.periodoPastor, cessacao: v } })} hideUnknown />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <div>
              <label className="hf-label-sm">Destaques relevantes (conquistas)</label>
              <textarea className="hf-input hf-input-sm" style={{ minHeight: 64, resize: 'vertical' }} value={p.conquistasDestaques} onChange={e => upd(p.id, { conquistasDestaques: e.target.value })} placeholder="Conquistas e marcos positivos..." />
            </div>
            <div>
              <label className="hf-label-sm">Destaques relevantes (desafios)</label>
              <textarea className="hf-input hf-input-sm" style={{ minHeight: 64, resize: 'vertical' }} value={p.desafiosDestaques} onChange={e => upd(p.id, { desafiosDestaques: e.target.value })} placeholder="Dificuldades e obstáculos enfrentados..." />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, emptyObreiroLider()])}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: '6px', background: G, color: '#000', border: 'none', cursor: 'pointer', fontSize: '1.0rem', fontWeight: 600, marginTop: 4 }}>
        <Plus size={13} /> Adicionar
      </button>
    </div>
  );
}

// ── FileUploadSection ──────────────────────────────────────────────────────────
function FileUploadSection({ label, category, files, onAdd, onRemove, onUpdateNota, uploading, setUploading }) {
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const safeName = file.name
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `ievc/${category}/${uid()}_${safeName}`;
    const { error } = await supabase.storage.from('ievc-uploads').upload(path, file, { upsert: false });
    setUploading(false);
    if (error) { alert('Erro ao carregar ficheiro: ' + error.message); e.target.value = ''; return; }
    const { data: { publicUrl } } = supabase.storage.from('ievc-uploads').getPublicUrl(path);
    onAdd({ url: publicUrl, categoria: category, nome_original: file.name, mime_type: file.type, nota: '' });
    e.target.value = '';
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontSize: '1.0rem', color: '#888', margin: '0 0 8px' }}>{label}</p>
      {files.map((f, i) => (
        <div key={i} style={{ background: '#0d0d1a', border: '1px solid #2a2a3a', borderRadius: '6px', padding: '8px 10px', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <a href={f.url} target="_blank" rel="noopener noreferrer"
              style={{ color: G, fontSize: '0.97rem', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.nome_original}
            </a>
            <button type="button" onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', flexShrink: 0 }}>
              <X size={13} />
            </button>
          </div>
          <input
            className="hf-input hf-input-sm"
            value={f.nota || ''}
            onChange={e => onUpdateNota(i, e.target.value)}
            placeholder="Ex: Foto da inauguração do templo, 2003; Documento de registo da congregação..."
          />
        </div>
      ))}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: uploading ? 'not-allowed' : 'pointer', padding: '6px 12px', borderRadius: '6px', border: `1px dashed ${G}55`, color: G, fontSize: '0.97rem' }}>
        <Upload size={14} />
        {uploading ? 'A carregar...' : 'Adicionar ficheiro'}
        <input type="file" accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
      </label>
    </div>
  );
}

// ── Banners ────────────────────────────────────────────────────────────────────
function SupportBanner() {
  return (
    <div style={{ background: '#0d1a0d', border: '1px solid #1a3a1a', borderRadius: '10px', padding: '16px 20px', marginBottom: 24 }}>
      <p style={{ margin: '0 0 8px', color: '#aaa', fontSize: '1.0rem' }}>
        Tem dificuldade em preencher alguma parte ou secção? Fale conosco pelo WhatsApp ou chamadas:
      </p>
      <div style={{ fontSize: '1.02rem', color: '#ccc', lineHeight: '1.9' }}>
        <div>📱 85 015 3315 — WhatsApp e Chamadas</div>
        <div>📱 82 536 1510 — WhatsApp</div>
        <div>📞 87 775 3315 — Chamadas</div>
        <div>📱 85 564 3212 — WhatsApp</div>
      </div>
    </div>
  );
}

function ProvinceBanner() {
  return (
    <div style={{ background: '#1a160a', border: '1px solid #3a2e0a', borderRadius: '8px', padding: '10px 16px', marginBottom: 16, fontSize: '0.97rem', color: '#c5a05999' }}>
      As informações devem ser preenchidas apenas sobre a sua província de actuação. Para informações sobre outras províncias, utilize as Observações Finais.
    </div>
  );
}

// ── buildPayload ───────────────────────────────────────────────────────────────
function buildPayload(f) {
  const cleanPessoa = ({ id: _id, ...p }) => ({
    ...p,
    numObreiros: p.numObreiros ? parseInt(p.numObreiros) : null,
    periodos: p.periodos.map(({ id: _pid, ...per }) => per),
  });

  return {
    nome:               f.nome || null,
    sexo:               f.sexo || null,
    provincia:          f.provincia || null,
    distrito:           f.distrito || null,
    igreja:             f.igreja || null,
    localidade:         f.localidade || null,
    funcao:             f.funcao || null,
    quando_ingressou:   f.quando_ingressou || null,
    whatsapp:           f.whatsapp || null,
    telefone:           f.telefone || null,
    email:              f.email || null,
    missionarios: {
      coordenadores: f.coordenadores_provinciais.filter(c => c.nome.trim()).map(({ id: _id, ...c }) => ({
        ...c,
        inicio: serializeDateFlex(c.inicio),
        cessacao: serializeDateFlex(c.cessacao),
      })),
      outros: f.outros_missionarios.filter(o => o.nome.trim()).map(({ id: _id, ...o }) => ({
        ...o,
        inicio: serializeDateFlex(o.inicio),
        cessacao: serializeDateFlex(o.cessacao),
      })),
    },
    obreiros_nacionais: {
      coordenadores: f.obreiros_coordenadores.filter(c => c.nome.trim()).map(({ id: _id, ...c }) => ({
        ...c,
        inicio: serializeDateFlex(c.inicio),
        cessacao: serializeDateFlex(c.cessacao),
      })),
      lideres: f.obreiros_lideres.filter(l => l.nome.trim()).map(({ id: _id, periodoEvangelista, periodoPastor, ...l }) => {
        const obj = { ...l };
        if (l.categorias.length === 2) {
          obj.periodoEvangelista = {
            inicio:   serializeDateFlex(periodoEvangelista.inicio),
            cessacao: serializeDateFlex(periodoEvangelista.cessacao),
          };
          obj.periodoPastor = {
            inicio:   serializeDateFlex(periodoPastor.inicio),
            cessacao: serializeDateFlex(periodoPastor.cessacao),
          };
        }
        return obj;
      }),
    },
    onde_comecou:       f.onde_comecou || null,
    onde_comecou_outro: f.onde_comecou_outro || null,
    igrejas_distrito:              f.igrejas_distrito              ? parseInt(f.igrejas_distrito)              : null,
    templos_concluidos_distrito:   f.templos_concluidos_distrito   ? parseInt(f.templos_concluidos_distrito)   : null,
    templos_construcao_distrito:   f.templos_construcao_distrito   ? parseInt(f.templos_construcao_distrito)   : null,
    templos_material_distrito:     f.templos_material_distrito     ? parseInt(f.templos_material_distrito)     : null,
    primeira_congregacao: f.primeira_congregacao || null,
    congregacoes: f.congregacoes.map(({ id: _id, ...c }) => ({ ...c, data: serializeDateFlex(c.data) })),
    data_inauguracao:   serializeDateFlex(f.data_inauguracao),
    desafios:           f.desafios.length ? f.desafios : null,
    desafios_outros:    f.desafios_outros || null,
    momentos_marcantes: f.momentos_marcantes || null,
    experiencia_marcante: f.experiencia_marcante || null,
    impacto_comunidade:   f.impacto_comunidade || null,
    possui_documentos:  f.possui_documentos === 'Sim' ? true : f.possui_documentos === 'Não' ? false : null,
    referencias: f.referencias.filter(r => r.nome || r.contacto).map(({ id: _id, ...r }) => r),
    observacoes_finais: f.observacoes_finais || null,
    declaracao_verdadeira: f.declaracao_verdadeira === true,
    anexos: f.anexos,
  };
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function HistoricoForm() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState('');
  const [loginError, setLoginError] = useState('');

  const [formData, setFormData] = useState(() => {
    try { const s = localStorage.getItem(LS_FORM); return s ? JSON.parse(s) : EMPTY_FORM; }
    catch { return EMPTY_FORM; }
  });
  const [submissionId, setSubmissionId] = useState(() => localStorage.getItem(LS_SUB));
  const [submissionData, setSubmissionData] = useState(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const [ingressouRange, setIngressouRange] = useState(() => {
    const v = formData.quando_ingressou;
    if (v === '1996') return '1996';
    if (v >= '1997' && v <= '2010') return '1997-2010';
    if (v >= '2011') return '2011-2026';
    return '';
  });

  const [noteModal, setNoteModal] = useState(false);
  const [noteSecao, setNoteSecao] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteAnexos, setNoteAnexos] = useState([]);
  const [noteUploading, setNoteUploading] = useState(false);
  const [clearStep, setClearStep] = useState(0);
  const [clearInput, setClearInput] = useState('');
  const [clearCountdown, setClearCountdown] = useState(5);

  useEffect(() => {
    if (!submissionId) localStorage.setItem(LS_FORM, JSON.stringify(formData));
  }, [formData, submissionId]);

  useEffect(() => {
    if (clearStep !== 6) { setClearCountdown(5); return; }
    if (clearCountdown === 0) return;
    const t = setTimeout(() => setClearCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [clearStep, clearCountdown]);

  useEffect(() => {
    if (submissionId && !submissionData) {
      setLoadingSubmission(true);
      supabase.from(HISTORICO_TABLE).select('*').eq('id', submissionId).single()
        .then(({ data }) => {
          setLoadingSubmission(false);
          if (data) { setSubmissionData(data); }
          else { localStorage.removeItem(LS_SUB); setSubmissionId(null); }
        });
    }
  }, [submissionId, submissionData]);

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const filesFor = (cat) => formData.anexos.filter(a => a.categoria === cat);
  const addFile = (file) => set('anexos', [...formData.anexos, file]);
  const removeFile = (cat, idx) => {
    const catFiles = filesFor(cat);
    set('anexos', formData.anexos.filter(a => a !== catFiles[idx]));
  };
  const updateFileNota = (cat, idx, nota) => {
    const catFiles = filesFor(cat);
    const target = catFiles[idx];
    set('anexos', formData.anexos.map(a => a === target ? { ...a, nota } : a));
  };

  const funcoes = formData.sexo === 'Feminino'
    ? ['Pastora', 'Evangelista', 'Diaconisa', 'Obreira', 'Membro apenas', 'Congregado apenas', 'Outro']
    : ['Pastor', 'Evangelista', 'Diácono', 'Obreiro', 'Membro apenas', 'Congregado apenas', 'Outro'];

  const distritos = PD[formData.provincia] || [];

  const handleLogin = (e) => {
    e.preventDefault();
    if (pwd === HISTORICO_PASSWORD) { setAuthed(true); }
    else { setLoginError('Senha incorreta.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.declaracao_verdadeira) {
      setError('Tem de aceitar a declaração antes de guardar.');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }
    setLoading(true); setError(null);

    if (formData.nome && formData.telefone) {
      const { data: dups } = await supabase.from(HISTORICO_TABLE)
        .select('id')
        .eq('nome', formData.nome.trim())
        .eq('telefone', formData.telefone.trim());
      if (dups && dups.length > 0) {
        setLoading(false);
        const go = window.confirm(`Já existe um registo com o nome "${formData.nome}" e telefone "${formData.telefone}". Deseja continuar mesmo assim?`);
        if (!go) return;
        setLoading(true);
      }
    }

    const payload = buildPayload(formData);
    const { data: inserted, error: err } = await supabase.from(HISTORICO_TABLE).insert([payload]).select('id').single();
    setLoading(false);
    if (err) { setError('Erro ao guardar: ' + err.message); return; }

    localStorage.setItem(LS_SUB, inserted.id);
    localStorage.removeItem(LS_FORM);
    setSubmissionId(inserted.id);
    setSubmissionData({ ...payload, id: inserted.id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setLoading(true);
    const notes = [...(submissionData.notas_adicionais || []), { nota: noteText.trim(), created_at: new Date().toISOString(), anexos: noteAnexos, secao: noteSecao || null }];
    const { error: err } = await supabase.from(HISTORICO_TABLE).update({ notas_adicionais: notes }).eq('id', submissionId);
    setLoading(false);
    if (err) { alert('Erro: ' + err.message); return; }
    setSubmissionData(prev => ({ ...prev, notas_adicionais: notes }));
    setNoteText(''); setNoteAnexos([]); setNoteSecao(null); setNoteModal(false);
  };


  const doClear = () => {
    localStorage.removeItem(LS_FORM); localStorage.removeItem(LS_SUB);
    setFormData(EMPTY_FORM); setSubmissionId(null); setSubmissionData(null);
    setClearStep(0); setClearInput('');
  };

  // estilos movidos para historico.css — classes: hf-input, hf-textarea, hf-label, hf-field, hf-section, hf-section-title

  // ── Password Gate ────────────────────────────────────────
  if (!authed) return (
    <div className="container">
      <div style={{ textAlign: 'center', paddingTop: 40, marginBottom: 32 }}>
        <p style={{ color: G, textTransform: 'uppercase', letterSpacing: '3px', fontSize: '1.12rem', margin: '0 0 12px' }}>Visão Cristã</p>
        <h1 style={{ fontSize: '1.8rem', background: `linear-gradient(to bottom, #fff, ${G})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }}>
          Levantamento Histórico
        </h1>
      </div>
      <div className="card" style={{ maxWidth: 360, margin: '0 auto' }}>
        <h2 style={{ color: G, marginBottom: 24, fontSize: '1.25rem' }}>Acesso ao Formulário</h2>
        <form onSubmit={handleLogin}>
          <div className="hf-field">
            <label className="hf-label">Senha de acesso</label>
            <input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setLoginError(''); }}
              placeholder="••••••••" autoFocus className="hf-input" />
          </div>
          {loginError && <p style={{ color: '#f87171', fontSize: '1.02rem', margin: '0 0 12px' }}>{loginError}</p>}
          <button type="submit" className="btn-primary btn-full">Entrar</button>
        </form>
      </div>
    </div>
  );

  // ── Loading submitted data ───────────────────────────────
  if (submissionId && loadingSubmission) return (
    <div className="container">
      <p style={{ color: '#aaa', textAlign: 'center', padding: '80px 0' }}>A carregar...</p>
    </div>
  );

  // ── Summary page ─────────────────────────────────────────
  if (submissionId && submissionData) {
    const s = submissionData;

    const displayDF = (df) => {
      if (!df || df.mode === 'unknown') return null;
      if (df.mode === 'exact') return df.year ? String(df.year) : null;
      if (df.mode === 'approximate') {
        const from = df.from?.year; const to = df.to?.year;
        if (from && to) return `${from} – ${to}`;
        return from ? `a partir de ${from}` : to ? `até ${to}` : null;
      }
      return null;
    };

    const RO = ({ label, val }) => {
      if (val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) return null;
      const display = typeof val === 'boolean' ? (val ? 'Sim' : 'Não') : Array.isArray(val) ? val.join(', ') : String(val);
      return display.length > 80 ? (
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: 3 }}>{label}</div>
          <div style={{ color: '#ddd', fontSize: '0.95rem', lineHeight: 1.6 }}>{display}</div>
        </div>
      ) : (
        <div style={{ marginBottom: 6, fontSize: '0.97rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ color: '#888', flexShrink: 0 }}>{label}:</span>
          <span style={{ color: '#ddd' }}>{display}</span>
        </div>
      );
    };

    const openNote = (secao) => { setNoteSecao(secao); setNoteModal(true); };

    const SectionNotes = ({ secao }) => {
      const notes = (s.notas_adicionais || []).filter(n => n.secao === secao);
      if (!notes.length) return null;
      return (
        <div style={{ marginTop: 10, borderTop: '1px solid #1a1a1a', paddingTop: 10 }}>
          {notes.map((n, i) => (
            <div key={i} style={{ background: '#0d0d1a', borderRadius: 6, padding: '8px 12px', marginBottom: 6, fontSize: '0.9rem', color: '#ccc' }}>
              <div style={{ color: '#555', fontSize: '0.78rem', marginBottom: 3 }}>{new Date(n.created_at).toLocaleDateString('pt-MZ')}</div>
              {n.nota}
            </div>
          ))}
        </div>
      );
    };

    const Card = ({ title, secao, children }) => (
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #222', paddingBottom: 8 }}>
          <h3 style={{ color: G, fontSize: '1rem', margin: 0 }}>{title}</h3>
          {secao && (
            <button type="button" onClick={() => openNote(secao)}
              style={{ background: G, color: '#000', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, letterSpacing: '0.02em' }}>
              + Adicionar
            </button>
          )}
        </div>
        {children}
        {secao && <SectionNotes secao={secao} />}
      </div>
    );

    const missionarios = s.missionarios || {};
    const obreiros = s.obreiros_nacionais || {};
    const missAll = [...(missionarios.coordenadores || []), ...(missionarios.outros || [])];
    const obrAll  = [...(obreiros.coordenadores || []), ...(obreiros.lideres || [])];

    return (
      <div className="container">
        <SupportBanner />
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ color: '#4ade80', fontSize: '2.5rem', marginBottom: 10 }}>✓</div>
          <h2 style={{ color: G, margin: 0 }}>Formulário submetido com sucesso!</h2>
          <p style={{ color: '#aaa', marginTop: 6 }}>Obrigado pela sua contribuição.</p>
        </div>

        <Card title="1. Identificação" secao="identificacao">
          <RO label="Nome" val={s.nome} />
          <RO label="Sexo" val={s.sexo} />
          <RO label="Função" val={s.funcao} />
          <RO label="Ingressou em" val={s.quando_ingressou} />
          <RO label="Telefone" val={s.telefone} />
          <RO label="WhatsApp" val={s.whatsapp} />
          <RO label="E-mail" val={s.email} />
          <RO label="Província" val={s.provincia} />
          <RO label="Distrito" val={s.distrito} />
          <RO label="Cidade/Vila" val={s.igreja} />
          <RO label="Localidade" val={s.localidade} />
        </Card>

        {(missAll.length > 0 || obrAll.length > 0 || s.onde_comecou || s.igrejas_distrito != null) && (
          <Card title="2. Igreja Local" secao="igreja_local">
            {missAll.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: 6 }}>Missionários ({missAll.length})</div>
                {missAll.map((p, i) => (
                  <div key={i} style={{ background: '#0d0d1a', borderRadius: 6, padding: '8px 12px', marginBottom: 6, fontSize: '0.9rem', color: '#ccc' }}>
                    <strong>{p.nome}</strong>
                    {p.areaAtuacao && <span style={{ color: '#888' }}> · {p.areaAtuacao}</span>}
                    {(displayDF(p.inicio) || displayDF(p.cessacao)) && (
                      <span style={{ color: '#666', marginLeft: 6 }}>({displayDF(p.inicio) || '?'} – {displayDF(p.cessacao) || '?'})</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {obrAll.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: 6 }}>Obreiros Nacionais ({obrAll.length})</div>
                {obrAll.map((p, i) => (
                  <div key={i} style={{ background: '#0d0d1a', borderRadius: 6, padding: '8px 12px', marginBottom: 6, fontSize: '0.9rem', color: '#ccc' }}>
                    <strong>{p.nome}</strong>
                    {p.categorias?.length > 0 && <span style={{ color: '#888' }}> · {p.categorias.join(', ')}</span>}
                  </div>
                ))}
              </div>
            )}
            <RO label="Onde começou" val={s.onde_comecou === 'Outro' && s.onde_comecou_outro ? `Outro: ${s.onde_comecou_outro}` : s.onde_comecou} />
            <RO label="Igrejas no distrito" val={s.igrejas_distrito} />
            <RO label="Templos concluídos" val={s.templos_concluidos_distrito} />
            <RO label="Templos em construção" val={s.templos_construcao_distrito} />
            <RO label="Templos material local" val={s.templos_material_distrito} />
          </Card>
        )}

        {(s.primeira_congregacao || (s.congregacoes || []).length > 0 || displayDF(s.data_inauguracao)) && (
          <Card title="3. Cronologia" secao="cronologia">
            <RO label="1ª Congregação" val={s.primeira_congregacao} />
            {(s.congregacoes || []).length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: 6 }}>Congregações ({s.congregacoes.length})</div>
                {s.congregacoes.map((c, i) => (
                  <div key={i} style={{ background: '#0d0d1a', borderRadius: 6, padding: '8px 12px', marginBottom: 6, fontSize: '0.9rem', color: '#ccc' }}>
                    {c.localidade || c.distrito || `#${i + 1}`}
                    {c.distrito && c.localidade && <span style={{ color: '#666' }}> · {c.distrito}</span>}
                    {displayDF(c.data) && <span style={{ color: '#666', marginLeft: 6 }}>({displayDF(c.data)})</span>}
                  </div>
                ))}
              </div>
            )}
            {displayDF(s.data_inauguracao) && <RO label="Inauguração da congregação" val={displayDF(s.data_inauguracao)} />}
          </Card>
        )}

        {((s.desafios || []).length > 0 || s.momentos_marcantes) && (
          <Card title="4. Desafios" secao="desafios">
            <RO label="Desafios" val={s.desafios} />
            <RO label="Outros desafios" val={s.desafios_outros} />
            <RO label="Momentos marcantes" val={s.momentos_marcantes} />
          </Card>
        )}

        {(s.experiencia_marcante || s.impacto_comunidade) && (
          <Card title="5. Testemunhos e Impacto" secao="testemunhos">
            <RO label="Experiência marcante" val={s.experiencia_marcante} />
            <RO label="Impacto na comunidade" val={s.impacto_comunidade} />
          </Card>
        )}

        {(s.possui_documentos != null || (s.referencias || []).some(r => r.nome || r.contacto) || s.observacoes_finais) && (
          <Card title="6. Dados Complementares" secao="complementares">
            <RO label="Possui documentos históricos" val={s.possui_documentos} />
            {(s.referencias || []).filter(r => r.nome || r.contacto).map((r, i) => (
              <div key={i} style={{ marginBottom: 6, fontSize: '0.97rem', display: 'flex', gap: 6 }}>
                <span style={{ color: '#888', flexShrink: 0 }}>Referência {i + 1}:</span>
                <span style={{ color: '#ddd' }}>{r.nome}{r.contacto ? ` (${r.contacto})` : ''}</span>
              </div>
            ))}
            <RO label="Observações finais" val={s.observacoes_finais} />
          </Card>
        )}

        <Card title="7. Declaração">
          <RO label="Declaração de veracidade" val={s.declaracao_verdadeira} />
        </Card>

        {(s.notas_adicionais || []).filter(n => !n.secao).length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ color: '#aaa', marginBottom: 12, fontSize: '1rem' }}>Informações adicionadas</h3>
            {s.notas_adicionais.filter(n => !n.secao).map((n, i) => (
              <div key={i} style={{ background: '#1a1a24', borderRadius: '6px', padding: '10px', marginBottom: 6, fontSize: '0.97rem', color: '#ccc' }}>
                <div style={{ color: '#555', marginBottom: 4, fontSize: '0.82rem' }}>{new Date(n.created_at).toLocaleDateString('pt-MZ')}</div>
                {n.nota}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <button type="button" className="btn-primary" onClick={() => setNoteModal(true)} style={{ flex: 1 }}>
            Adicionar informação
          </button>
        </div>

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <button type="button" onClick={() => setClearStep(1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7f1d1d', fontSize: '0.82rem', textDecoration: 'underline', opacity: 0.6 }}>
            Limpar formulário
          </button>
        </div>

        {noteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: '#1a1a24', borderRadius: '12px', padding: '28px', maxWidth: 480, width: '100%', border: '1px solid #333' }}>
              <h3 style={{ color: G, marginBottom: 16 }}>
                Adicionar informação{noteSecao ? ` — ${noteSecao.replace(/_/g, ' ')}` : ''}
              </h3>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Ex: Escreva aqui informações adicionais..."
                className="hf-textarea" style={{ width: '100%', marginBottom: 12 }} autoFocus />
              <FileUploadSection
                label="Anexar ficheiro (opcional)"
                category={`notas/${submissionId}`}
                files={noteAnexos}
                onAdd={f => setNoteAnexos(prev => [...prev, f])}
                onRemove={i => setNoteAnexos(prev => prev.filter((_, j) => j !== i))}
                uploading={noteUploading}
                setUploading={setNoteUploading}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-primary" onClick={handleAddNote} disabled={loading || noteUploading || !noteText.trim()}>
                  {loading ? 'A guardar...' : 'Guardar'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setNoteModal(false); setNoteText(''); setNoteAnexos([]); setNoteSecao(null); }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {clearStep > 0 && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: '#1a1a24', borderRadius: '12px', padding: '28px', maxWidth: 420, width: '100%', border: '1px solid #444', textAlign: 'center' }}>
            {clearStep === 1 && <>
              <h3 style={{ color: '#f87171', marginBottom: 12 }}>Atenção</h3>
              <p style={{ color: '#ccc', marginBottom: 20, lineHeight: 1.6 }}>Para editar as suas respostas, não precisa de limpar o formulário — basta alterar directamente os campos.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-primary" type="button" onClick={() => setClearStep(0)}>Cancelar</button>
                <button className="btn-secondary" type="button" onClick={() => setClearStep(2)}>Continuar mesmo assim</button>
              </div>
            </>}
            {clearStep === 2 && <>
              <h3 style={{ color: '#f87171', marginBottom: 12 }}>Atenção</h3>
              <p style={{ color: '#ccc', marginBottom: 20, lineHeight: 1.6 }}>Use esta função APENAS se quiser preencher o formulário por outra pessoa.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-primary" type="button" onClick={() => setClearStep(0)}>Cancelar</button>
                <button className="btn-secondary" type="button" onClick={() => setClearStep(3)}>Percebo, continuar</button>
              </div>
            </>}
            {clearStep === 3 && <>
              <h3 style={{ color: '#f87171', marginBottom: 12 }}>Atenção</h3>
              <p style={{ color: '#ccc', marginBottom: 20, lineHeight: 1.6 }}>Não será mais possível editar essas informações, nem enviar um formulário com dados pessoais semelhantes.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-primary" type="button" onClick={() => setClearStep(0)}>Cancelar</button>
                <button className="btn-secondary" type="button" onClick={() => setClearStep(4)}>Entendi, continuar</button>
              </div>
            </>}
            {clearStep === 4 && <>
              <h3 style={{ color: '#f87171', marginBottom: 12 }}>Atenção</h3>
              <p style={{ color: '#ccc', marginBottom: 20, lineHeight: 1.6 }}>O seu registo ficará guardado mas não poderá ser alterado a partir deste dispositivo.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-primary" type="button" onClick={() => setClearStep(0)}>Cancelar</button>
                <button className="btn-secondary" type="button" onClick={() => setClearStep(5)}>Sim, quero continuar</button>
              </div>
            </>}
            {clearStep === 5 && <>
              <h3 style={{ color: '#f87171', marginBottom: 12 }}>Atenção</h3>
              <p style={{ color: '#ccc', marginBottom: 20, lineHeight: 1.6 }}>Esta acção não pode ser desfeita.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-primary" type="button" onClick={() => setClearStep(0)}>Cancelar</button>
                <button className="btn-secondary" type="button" onClick={() => setClearStep(6)}>Tenho a certeza</button>
              </div>
            </>}
            {clearStep === 6 && <>
              <h3 style={{ color: '#f87171', marginBottom: 12 }}>Último Aviso</h3>
              <p style={{ color: '#ccc', marginBottom: 20, lineHeight: 1.6 }}>
                Ao confirmar, todos os dados desta sessão serão removidos deste dispositivo permanentemente.
              </p>
              {clearCountdown > 0 && (
                <p style={{ color: '#f87171', fontSize: '0.97rem', marginBottom: 16 }}>
                  Por favor aguarde <strong>{clearCountdown}</strong> segundo{clearCountdown !== 1 ? 's' : ''}...
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-primary" type="button" onClick={() => setClearStep(0)}>Cancelar</button>
                <button type="button" onClick={doClear} disabled={clearCountdown > 0}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: clearCountdown > 0 ? '#4a1a1a' : '#ef4444', color: clearCountdown > 0 ? '#888' : '#fff', border: 'none', cursor: clearCountdown > 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1.02rem', transition: 'all 0.3s' }}>
                  Confirmar e apagar
                </button>
              </div>
            </>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────
  return (
    <div className="container">
      <SupportBanner />

      <div className="page-header">
        <p className="header-eyebrow">Visão Cristã · Levantamento Histórico</p>
        <h1 className="header-title">Inquérito Histórico</h1>
        <p style={{ color: '#aaa', fontSize: '1.07rem' }}>
          Recolha de informações sobre a história da Visão Cristã na sua região.
        </p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── 1. Identificação ───────────────────────── */}
        <section className="hf-section">
          <span className="hf-section-title">1. Identificação do Inquirido</span>

          <div className="hf-field">
            <label className="hf-label">Nome completo *</label>
            <input required className="hf-input" value={formData.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: António José Machava" />
          </div>

          <div className="hf-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="hf-label">Sexo *</label>
              <select required className="hf-input" value={formData.sexo} onChange={e => { set('sexo', e.target.value); set('funcao', ''); }}>
                <option value="">— Seleccione —</option>
                <option>Masculino</option>
                <option>Feminino</option>
              </select>
            </div>
            <div>
              <label className="hf-label">Função</label>
              <select className="hf-input" value={formData.funcao} onChange={e => set('funcao', e.target.value)}>
                <option value="">— Seleccione —</option>
                {funcoes.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="hf-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="hf-label">Província</label>
              <select className="hf-input" value={formData.provincia} onChange={e => { set('provincia', e.target.value); set('distrito', ''); }}>
                <option value="">— Seleccione —</option>
                {PROVINCIAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="hf-label">Distrito</label>
              <select className="hf-input" value={formData.distrito} onChange={e => set('distrito', e.target.value)} disabled={!formData.provincia}>
                <option value="">— Seleccione —</option>
                {distritos.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="hf-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="hf-label">Cidade/Vila</label>
              <input className="hf-input" value={formData.igreja} onChange={e => set('igreja', e.target.value)} placeholder="Ex: Beira, Chimoio, Quelimane" />
            </div>
            <div>
              <label className="hf-label">Em que localidade/Bairro se localiza a igreja?</label>
              <input className="hf-input" value={formData.localidade} onChange={e => set('localidade', e.target.value)} placeholder="Ex: Esturro, 7 de Setembro, Samora Machel" />
            </div>
          </div>

          <div className="hf-field">
            <label className="hf-label">Em que ano ingressou na IEVC/VCM?</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {[['1996','1996'],['1997-2010','Entre 1997 e 2010'],['2011-2026','Entre 2011 e 2026']].map(([range, label]) => (
                <button key={range} type="button"
                  onClick={() => {
                    setIngressouRange(range);
                    if (range === '1996') set('quando_ingressou', '1996');
                    else set('quando_ingressou', '');
                  }}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', fontSize: '1.02rem', cursor: 'pointer',
                    background: ingressouRange === range ? G : '#1a1a24',
                    color: ingressouRange === range ? '#000' : '#aaa',
                    border: `1px solid ${ingressouRange === range ? G : '#333'}`,
                    fontWeight: ingressouRange === range ? 600 : 400,
                  }}>{label}</button>
              ))}
            </div>
            {ingressouRange === '1997-2010' && (
              <select className="hf-input" value={formData.quando_ingressou} onChange={e => set('quando_ingressou', e.target.value)}>
                <option value="">— Seleccione o ano —</option>
                {Array.from({length: 14}, (_, i) => 1997 + i).map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            )}
            {ingressouRange === '2011-2026' && (
              <select className="hf-input" value={formData.quando_ingressou} onChange={e => set('quando_ingressou', e.target.value)}>
                <option value="">— Seleccione o ano —</option>
                {Array.from({length: 16}, (_, i) => 2011 + i).map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            )}
          </div>

          <div className="hf-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="hf-label">WhatsApp</label>
              <input className="hf-input" type="tel" value={formData.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="Ex: 80 123 4567" />
            </div>
            <div>
              <label className="hf-label">Telefone *</label>
              <input required className="hf-input" type="tel" value={formData.telefone} onChange={e => set('telefone', e.target.value)} placeholder="Ex: 80 123 4567" />
            </div>
          </div>

          <div className="hf-field">
            <label className="hf-label">E-mail</label>
            <input className="hf-input" type="email" value={formData.email} onChange={e => set('email', e.target.value)} placeholder="Ex: email@exemplo.com" />
          </div>
        </section>

        {/* ── 2. Igreja Local ────────────────────────── */}
        <section className="hf-section">
          <span className="hf-section-title">2. Informações sobre a Igreja Local</span>
          <ProvinceBanner />

          <div style={{ marginBottom: 20 }}>
            <p style={{ color: G, fontWeight: 700, fontSize: '1.12rem', marginBottom: 4 }}>Missionários ao longo dos 30 anos</p>
            <p style={{ color: '#777', fontSize: '0.97rem', margin: '0 0 16px' }}>(Se esteve em diferentes lugares, indique um lugar por vez)</p>
            <CoordenadorTable items={formData.coordenadores_provinciais} onChange={v => set('coordenadores_provinciais', v)} />
            <OutroMissionarioTable items={formData.outros_missionarios} onChange={v => set('outros_missionarios', v)} provinciaAtual={formData.provincia} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ color: G, fontWeight: 700, fontSize: '1.12rem', marginBottom: 4 }}>Obreiros Nacionais</p>
            <p style={{ color: '#777', fontSize: '0.97rem', margin: '0 0 16px' }}>(Se esteve em diferentes lugares, indique um lugar por vez)</p>
            <CoordenadorTable title="Coordenadores Provinciais" items={formData.obreiros_coordenadores} onChange={v => set('obreiros_coordenadores', v)} />
            <ObreiroLiderTable items={formData.obreiros_lideres} onChange={v => set('obreiros_lideres', v)} provinciaAtual={formData.provincia} />
          </div>

          <div className="hf-field">
            <label className="hf-label">Onde começou a igreja?</label>
            <select className="hf-input" value={formData.onde_comecou} onChange={e => set('onde_comecou', e.target.value)}>
              <option value="">— Seleccione —</option>
              <option>Num templo</option>
              <option>Numa casa</option>
              <option>Numa escola</option>
              <option>Ao ar livre</option>
              <option>Outro</option>
            </select>
          </div>
          {formData.onde_comecou === 'Outro' && (
            <div className="hf-field">
              <label className="hf-label">Especifique onde começou</label>
              <input className="hf-input" value={formData.onde_comecou_outro} onChange={e => set('onde_comecou_outro', e.target.value)} />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="hf-label">Tem imagens ou vídeos sobre o início da igreja?</label>
            <FileUploadSection label="Partilhe imagens, vídeos ou documentos sobre o início da igreja"
              category="inicio_igreja" files={filesFor('inicio_igreja')} onAdd={addFile}
              onRemove={idx => removeFile('inicio_igreja', idx)}
              onUpdateNota={(idx, nota) => updateFileNota('inicio_igreja', idx, nota)}
              uploading={uploading} setUploading={setUploading} />
          </div>

          <div style={{ background: '#1a1a0a', border: '1px solid #2a2a0a', borderRadius: '8px', padding: '10px 14px', marginBottom: 16, fontSize: '0.97rem', color: '#888' }}>
            Entende-se por igreja um grupo de pessoas e não edifícios.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              ['igrejas_distrito',            'Quantas igrejas tem o distrito?'],
              ['templos_concluidos_distrito',  'Quantos templos de alvenaria concluídos tem o distrito?'],
              ['templos_construcao_distrito',  'Quantos templos de alvenaria em construção há no distrito?'],
              ['templos_material_distrito',    'Quantos templos de material local tem o distrito?'],
            ].map(([key, label]) => (
              <div key={key} className="hf-field">
                <label className="hf-label">{label}</label>
                <input className="hf-input" type="number" min="0" value={formData[key]} onChange={e => set(key, e.target.value)} placeholder="0" />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 8 }}>
            <label className="hf-label">Imagens ou documentos sobre a estrutura</label>
            <FileUploadSection label="Partilhe fotos dos templos ou documentos sobre a estrutura"
              category="estrutura_templos" files={filesFor('estrutura_templos')} onAdd={addFile}
              onRemove={idx => removeFile('estrutura_templos', idx)}
              onUpdateNota={(idx, nota) => updateFileNota('estrutura_templos', idx, nota)}
              uploading={uploading} setUploading={setUploading} />
          </div>
        </section>

        {/* ── 3. Cronologia ──────────────────────────── */}
        <section className="hf-section">
          <span className="hf-section-title">3. Cronologia</span>
          <ProvinceBanner />

          <div className="hf-field">
            <label className="hf-label">Qual foi a primeira igreja a ser inaugurada na sua província?</label>
            <input className="hf-input" value={formData.primeira_congregacao} onChange={e => set('primeira_congregacao', e.target.value)} placeholder="Ex: Igreja de Bela Vista - Gondola" />
          </div>

          <div className="hf-field" style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 8 }}>
              <label className="hf-label" style={{ marginBottom: 0 }}>Igrejas/Congregações na Província</label>
            </div>
            {formData.congregacoes.map((c, i) => (
              <div key={c.id} style={{ background: '#0d0d1a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: '#666', fontSize: '1.12rem' }}>Igreja {c.localidade || `#${i + 1}`}</span>
                  <button type="button" onClick={() => set('congregacoes', formData.congregacoes.filter(x => x.id !== c.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <label className="hf-label-sm">Distrito</label>
                    <select className="hf-input hf-input-sm" value={c.distrito}
                      onChange={e => set('congregacoes', formData.congregacoes.map(x => x.id === c.id ? { ...x, distrito: e.target.value } : x))}>
                      <option value="">— Seleccione —</option>
                      {distritos.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="hf-label-sm">Bairro/Localidade</label>
                    <input className="hf-input hf-input-sm" value={c.localidade}
                      onChange={e => set('congregacoes', formData.congregacoes.map(x => x.id === c.id ? { ...x, localidade: e.target.value } : x))}
                      placeholder="Ex: Maxaquene, Muhala, Coalane" />
                  </div>
                </div>
                <div>
                  <label className="hf-label-sm">Data de inauguração</label>
                  <DateFlex value={c.data}
                    onChange={d => set('congregacoes', formData.congregacoes.map(x => x.id === c.id ? { ...x, data: d } : x))} />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => set('congregacoes', [...formData.congregacoes, emptyCongregacao()])}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: '6px', background: G, color: '#000', border: 'none', cursor: 'pointer', fontSize: '1.0rem', fontWeight: 600, marginTop: 4 }}>
              <Plus size={14} /> Adicionar
            </button>
          </div>

          <div className="hf-field">
            <label className="hf-label">Quando foi inaugurada a sua congregação?</label>
            <DateFlex value={formData.data_inauguracao} onChange={v => set('data_inauguracao', v)} />
          </div>
        </section>

        {/* ── 4. Desafios ────────────────────────────── */}
        <section className="hf-section">
          <span className="hf-section-title">4. Desafios</span>
          <ProvinceBanner />

          <div className="hf-field">
            <label className="hf-label">Quais foram os principais desafios enfrentados?</label>
            {['Financeiros', 'Falta de liderança', 'Resistência da comunidade', 'Outros'].map(d => (
              <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer', color: '#ccc', fontSize: '1.07rem' }}>
                <input type="checkbox" checked={formData.desafios.includes(d)}
                  onChange={e => set('desafios', e.target.checked ? [...formData.desafios, d] : formData.desafios.filter(x => x !== d))}
                  style={{ width: 16, height: 16, accentColor: G }} />
                {d}
              </label>
            ))}
          </div>

          {formData.desafios.includes('Outros') && (
            <div className="hf-field">
              <label className="hf-label">Outros desafios — descrição</label>
              <textarea className="hf-textarea" value={formData.desafios_outros} onChange={e => set('desafios_outros', e.target.value)} placeholder="Descreva outros desafios..." />
            </div>
          )}

          <div className="hf-field">
            <label className="hf-label">Momentos marcantes</label>
            <textarea className="hf-textarea" value={formData.momentos_marcantes} onChange={e => set('momentos_marcantes', e.target.value)} placeholder="Partilhe os momentos mais marcantes..." />
          </div>
        </section>

        {/* ── 5. Testemunhos ─────────────────────────── */}
        <section className="hf-section">
          <span className="hf-section-title">5. Testemunhos e Impacto</span>
          <ProvinceBanner />

          <div className="hf-field">
            <label className="hf-label">Experiência marcante</label>
            <textarea className="hf-textarea" style={{ minHeight: 120 }} value={formData.experiencia_marcante} onChange={e => set('experiencia_marcante', e.target.value)} placeholder="Partilhe uma experiência que marcou o seu percurso..." />
          </div>

          <div className="hf-field">
            <label className="hf-label">Impacto na comunidade</label>
            <textarea className="hf-textarea" style={{ minHeight: 120 }} value={formData.impacto_comunidade} onChange={e => set('impacto_comunidade', e.target.value)} placeholder="Ex: conversão de famílias, construção de uma escola, apoio social..." />
          </div>
        </section>

        {/* ── 6. Dados Complementares ─────────────────── */}
        <section className="hf-section">
          <span className="hf-section-title">6. Dados Complementares</span>

          <div className="hf-field">
            <label className="hf-label">Possui documentos históricos?</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#ccc', fontSize: '1.07rem' }}>
              <input type="checkbox" checked={formData.possui_documentos === 'Sim'}
                onChange={e => set('possui_documentos', e.target.checked ? 'Sim' : null)}
                style={{ width: 16, height: 16, accentColor: G }} />
              Sim
            </label>
          </div>

          {formData.possui_documentos === 'Sim' && (
            <div style={{ marginBottom: 16 }}>
              <FileUploadSection label="Carregue aqui os documentos históricos que possui"
                category="documentos_historicos" files={filesFor('documentos_historicos')} onAdd={addFile}
                onRemove={idx => removeFile('documentos_historicos', idx)}
                onUpdateNota={(idx, nota) => updateFileNota('documentos_historicos', idx, nota)}
                uploading={uploading} setUploading={setUploading} />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="hf-label" style={{ marginBottom: 0 }}>Pessoas de referência</label>
              <button type="button" onClick={() => set('referencias', [...formData.referencias, emptyReferencia()])}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: '6px', background: '#1a1a2e', border: `1px solid ${G}55`, color: G, cursor: 'pointer', fontSize: '1.12rem' }}>
                <Plus size={13} /> Adicionar
              </button>
            </div>
            {formData.referencias.map((r) => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                <div>
                  <label className="hf-label-sm">Nome</label>
                  <input className="hf-input hf-input-sm" value={r.nome}
                    onChange={e => set('referencias', formData.referencias.map(x => x.id === r.id ? { ...x, nome: e.target.value } : x))}
                    placeholder="Nome da pessoa" />
                </div>
                <div>
                  <label className="hf-label-sm">Contacto</label>
                  <input className="hf-input hf-input-sm" type="tel" value={r.contacto}
                    onChange={e => set('referencias', formData.referencias.map(x => x.id === r.id ? { ...x, contacto: e.target.value } : x))}
                    placeholder="Telefone" />
                </div>
                <button type="button" onClick={() => set('referencias', formData.referencias.filter(x => x.id !== r.id))}
                  disabled={formData.referencias.length === 1}
                  style={{ background: 'none', border: 'none', cursor: formData.referencias.length === 1 ? 'not-allowed' : 'pointer', color: formData.referencias.length === 1 ? '#2a2a2a' : '#555', alignSelf: 'center', padding: 6 }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="hf-field">
            <label className="hf-label">Observações finais</label>
            <p style={{ fontSize: '0.97rem', color: '#666', margin: '0 0 8px' }}>
              Pode incluir aqui informações sobre outras províncias ou qualquer outro dado relevante.
            </p>
            <textarea className="hf-textarea" style={{ minHeight: 120 }} value={formData.observacoes_finais} onChange={e => set('observacoes_finais', e.target.value)} placeholder="Ex: Quando visitei a Igreja de Lichinga, soube que foi inaugurada em 2001... O pastor da nossa missão viajou para a província de Manica em 2005..." />
          </div>
        </section>

        <SupportBanner />

        {/* ── 7. Declaração ──────────────────────────── */}
        <section className="hf-section">
          <span className="hf-section-title">7. Declaração</span>
          <p style={{ color: '#ccc', fontSize: '1.07rem', marginBottom: 20, lineHeight: 1.6 }}>
            "Declaro que as informações prestadas são verdadeiras conforme o meu conhecimento."
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="declaracao" checked={formData.declaracao_verdadeira === true}
                onChange={() => set('declaracao_verdadeira', true)} style={{ accentColor: G }} />
              <span style={{ color: formData.declaracao_verdadeira === true ? '#4ade80' : '#ccc', fontWeight: 600, fontSize: '1.07rem' }}>
                Sim, declaro
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="declaracao" checked={formData.declaracao_verdadeira === false}
                onChange={() => set('declaracao_verdadeira', false)} style={{ accentColor: G }} />
              <span style={{ color: '#ccc', fontSize: '1.07rem' }}>Não confirmo</span>
            </label>
          </div>
          {formData.declaracao_verdadeira === false && (
            <p style={{ color: '#f87171', fontSize: '1.02rem', marginTop: 10 }}>
              Tem de aceitar a declaração para poder submeter o formulário.
            </p>
          )}
        </section>

        {error && (
          <div style={{ background: '#1a0a0a', border: '1px solid #4a1a1a', borderRadius: '8px', padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: '1.07rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingBottom: 40 }}>
          <button type="submit" className="btn-primary btn-grow" disabled={loading || uploading}>
            {loading ? 'A guardar...' : 'Guardar e Submeter'}
          </button>
        </div>
      </form>

      <footer className="page-footer">
        &copy; 2026 Visão Cristã · Levantamento Histórico
        <button className="admin-link" onClick={() => { window.location.href = '/admin'; }}>·</button>
      </footer>
    </div>
  );
}
