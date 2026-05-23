import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Trash2, Upload, X } from 'lucide-react';

const HISTORICO_PASSWORD = import.meta.env.VITE_HISTORICO_PASSWORD || 'ievc2010';
const HISTORICO_TABLE = 'ievc_historico';
const LS_FORM = 'ievc_form_v1';
const LS_SUB = 'ievc_sub_v1';
const G = '#c5a059';

const PD = {
  'Cabo Delgado': ['Pemba','Chiúre','Ibo','Macomia','Mocímboa da Praia','Montepuez','Mueda','Muidumbe','Namuno','Nangade','Palma','Quissanga'],
  'Gaza': ['Xai-Xai','Bilene','Chibuto','Chigubo','Chicualacuala','Chokwè','Guijá','Limpopo','Mabalane','Mandlakaze','Massingir','Massangena'],
  'Inhambane': ['Inhambane','Govuro','Homoíne','Inharrime','Inhassoro','Jangamo','Mabote','Massinga','Maxixe','Morrumbene','Panda','Vilankulo','Zavala'],
  'Manica': ['Chimoio','Báruè','Gondola','Guro','Macossa','Mossurize','Sussundenga','Tambara','Vanduzi'],
  'Maputo Cidade': ['KaMpfumo','KaMaxakeni','KaMavota','KaMubukwana','KaNyaka','KaTembe'],
  'Maputo Província': ['Matola','Boane','Magude','Manhiça','Marracuene','Matutuíne','Moamba','Namaacha'],
  'Nampula': ['Nampula','Angoche','Ilha de Moçambique','Malema','Meconta','Mecubúri','Memba','Mogovolas','Moma','Monapo','Mossuril','Muecate','Murrupula','Nacala','Nacarôa','Ribaué'],
  'Niassa': ['Lichinga','Cuamba','Lago','Majune','Mandimba','Marrupa','Maúa','Mavago','Mecanhelas','Mecula','Metarica','Muembe','Sanga'],
  'Sofala': ['Beira','Buzi','Chemba','Cheringoma','Chibabava','Dondo','Gorongosa','Machanga','Maringué','Marromeu','Muanza','Nhamatanda'],
  'Tete': ['Tete','Angónia','Cahora Bassa','Changara','Chifunde','Chiuta','Dôa','Macanga','Marávia','Moatize','Mutarara','Tsangano','Zumbo'],
  'Zambézia': ['Quelimane','Alto Molócuè','Chinde','Gilé','Guruè','Ile','Inhassunge','Luabo','Lugela','Maganja da Costa','Milange','Mocuba','Mopeia','Morrumbala','Namacurra','Namarrói','Nicoadala','Pebane'],
};

const PROVINCIAS = Object.keys(PD);
const uid = () => Math.random().toString(36).slice(2, 9);

const emptyPeriodo = () => ({ id: uid(), periodo: '', funcao: '', proveniencia: '', saidaPara: '' });
const emptyPessoa = () => ({ id: uid(), nome: '', distritoCidade: '', periodos: [emptyPeriodo()], destaques: '', numObreiros: '', acrescimo: '' });
const emptyCongregacao = () => ({ id: uid(), distrito: '', localidade: '', data: { mode: 'unknown' } });
const emptyReferencia = () => ({ id: uid(), nome: '', contacto: '' });

const EMPTY_FORM = {
  nome: '', sexo: '', provincia: '', distrito: '', igreja: '', localidade: '',
  funcao: '', quando_ingressou: '', whatsapp: '', telefone: '', email: '',
  missionarios: [], obreiros_nacionais: [],
  onde_comecou: '', onde_comecou_outro: '',
  igrejas_distrito: '', templos_concluidos_distrito: '', templos_construcao_distrito: '', templos_material_distrito: '',
  primeira_congregacao: '', congregacoes: [], data_inauguracao: { mode: 'unknown' },
  desafios: [], desafios_outros: '', momentos_marcantes: '',
  experiencia_marcante: '', impacto_comunidade: '',
  possui_documentos: null, referencias: [emptyReferencia()], observacoes_finais: '',
  declaracao_verdadeira: null,
  anexos: [],
};

// ── DateFlex ───────────────────────────────────────────────────────────────────
function DateFlex({ value = { mode: 'unknown' }, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const setFrom = (patch) => onChange({ ...value, from: { ...(value.from || {}), ...patch } });
  const setTo   = (patch) => onChange({ ...value, to:   { ...(value.to   || {}), ...patch } });

  const yearOpts = Array.from({ length: 80 }, (_, i) => 2026 - i);
  const months = [
    ['01','Janeiro'],['02','Fevereiro'],['03','Março'],['04','Abril'],
    ['05','Maio'],['06','Junho'],['07','Julho'],['08','Agosto'],
    ['09','Setembro'],['10','Outubro'],['11','Novembro'],['12','Dezembro'],
  ];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  const sSel = { padding: '6px 10px', borderRadius: '6px', background: '#1a1a24', border: '1px solid #333', color: '#fff', fontSize: '0.85rem', flex: 1 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[['exact','Data exacta'],['approximate','Data aproximada'],['unknown','Desconhecida']].map(([val, label]) => (
          <button key={val} type="button" onClick={() => set({ mode: val })} style={{
            padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer',
            background: value.mode === val ? G : '#1a1a24',
            color: value.mode === val ? '#000' : '#aaa',
            border: `1px solid ${value.mode === val ? G : '#333'}`,
          }}>{label}</button>
        ))}
      </div>

      {value.mode === 'exact' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select style={sSel} value={value.day || ''} onChange={e => set({ day: e.target.value || null })}>
            <option value="">Dia</option>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select style={{ ...sSel, flex: 2 }} value={value.month || ''} onChange={e => set({ month: e.target.value || null })}>
            <option value="">Mês</option>
            {months.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select style={{ ...sSel, flex: 2 }} value={value.year || ''} onChange={e => set({ year: e.target.value || null })}>
            <option value="">Ano</option>
            {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {value.mode === 'approximate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.8rem', color: '#aaa' }}>De:</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <select style={sSel} value={value.from?.month || ''} onChange={e => setFrom({ month: e.target.value || null })}>
              <option value="">Mês</option>
              {months.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select style={sSel} value={value.from?.year || ''} onChange={e => setFrom({ year: e.target.value || null })}>
              <option value="">Ano</option>
              {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Até:</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <select style={sSel} value={value.to?.month || ''} onChange={e => setTo({ month: e.target.value || null })}>
              <option value="">Mês</option>
              {months.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select style={sSel} value={value.to?.year || ''} onChange={e => setTo({ year: e.target.value || null })}>
              <option value="">Ano</option>
              {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
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

  const inp = (extra = {}) => ({
    width: '100%', padding: '7px 10px', borderRadius: '6px',
    background: '#1a1a24', border: '1px solid #333', color: '#fff', fontSize: '0.85rem', ...extra,
  });

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: G, fontWeight: 600, fontSize: '0.95rem' }}>{title}</span>
        <button type="button" onClick={() => onChange([...items, emptyPessoa()])} style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px',
          borderRadius: '6px', background: G, color: '#000', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
        }}>
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {items.length === 0 && <p style={{ color: '#555', fontSize: '0.85rem', fontStyle: 'italic' }}>Nenhum registo adicionado.</p>}

      {items.map((p, idx) => (
        <div key={p.id} style={{ background: '#0d0d1a', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '16px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: '#666', fontSize: '0.78rem' }}>#{idx + 1}</span>
            <button type="button" onClick={() => onChange(items.filter(x => x.id !== p.id))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
              <Trash2 size={15} />
            </button>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: 4 }}>Nome *</label>
            <input style={inp()} value={p.nome} onChange={e => upd(p.id, { nome: e.target.value })} placeholder="Nome completo" />
          </div>

          {p.nome && <>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: 4 }}>
                Distrito/Cidade{provinciaAtual ? ` (${provinciaAtual})` : ''}
              </label>
              <input style={inp()} value={p.distritoCidade} onChange={e => upd(p.id, { distritoCidade: e.target.value })} placeholder="Distrito ou cidade" />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.78rem', color: '#aaa' }}>Períodos</label>
                <button type="button" onClick={() => onChange(items.map(x => x.id === p.id ? { ...x, periodos: [...x.periodos, emptyPeriodo()] } : x))}
                  style={{ background: '#1a1a2e', border: `1px solid ${G}55`, color: G, padding: '3px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem' }}>
                  + Período
                </button>
              </div>
              {p.periodos.map((per, pIdx) => (
                <div key={per.id} style={{ background: '#0a0a14', border: '1px solid #1e1e2e', borderRadius: '6px', padding: '10px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#555', fontSize: '0.72rem' }}>Período {pIdx + 1}</span>
                    {p.periodos.length > 1 && (
                      <button type="button" onClick={() => onChange(items.map(x => x.id === p.id ? { ...x, periodos: x.periodos.filter(per2 => per2.id !== per.id) } : x))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <input style={inp()} value={per.periodo}     onChange={e => updPer(p.id, per.id, { periodo:     e.target.value })} placeholder="Período (ex: 2003–2010)" />
                    <input style={inp()} value={per.funcao}      onChange={e => updPer(p.id, per.id, { funcao:      e.target.value })} placeholder="Função" />
                    <input style={inp()} value={per.proveniencia} onChange={e => updPer(p.id, per.id, { proveniencia: e.target.value })} placeholder="Proveniência" />
                    <input style={inp()} value={per.saidaPara}   onChange={e => updPer(p.id, per.id, { saidaPara:   e.target.value })} placeholder="Saída para?" />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: 4 }}>Nº de Obreiros</label>
                <input style={inp()} type="number" min="0" value={p.numObreiros} onChange={e => upd(p.id, { numObreiros: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: 4 }}>Acréscimo</label>
                <input style={inp()} value={p.acrescimo} onChange={e => upd(p.id, { acrescimo: e.target.value })} placeholder="Campo aberto" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: 4 }}>Destaques</label>
              <textarea style={{ ...inp(), minHeight: 60, resize: 'vertical' }} value={p.destaques} onChange={e => upd(p.id, { destaques: e.target.value })} placeholder="Destaques relevantes..." />
            </div>
          </>}
        </div>
      ))}
    </div>
  );
}

// ── FileUploadSection ──────────────────────────────────────────────────────────
function FileUploadSection({ label, category, files, onAdd, onRemove, uploading, setUploading }) {
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `ievc/${category}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { error } = await supabase.storage.from('ievc-uploads').upload(path, file, { upsert: false });
    setUploading(false);
    if (error) { alert('Erro ao carregar ficheiro: ' + error.message); e.target.value = ''; return; }
    const { data: { publicUrl } } = supabase.storage.from('ievc-uploads').getPublicUrl(path);
    onAdd({ url: publicUrl, categoria: category, nome_original: file.name, mime_type: file.type });
    e.target.value = '';
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontSize: '0.82rem', color: '#888', margin: '0 0 8px' }}>{label}</p>
      {files.map((f, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <a href={f.url} target="_blank" rel="noopener noreferrer"
            style={{ color: G, fontSize: '0.8rem', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.nome_original}
          </a>
          <button type="button" onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
            <X size={13} />
          </button>
        </div>
      ))}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: uploading ? 'not-allowed' : 'pointer', padding: '6px 12px', borderRadius: '6px', border: `1px dashed ${G}55`, color: G, fontSize: '0.8rem' }}>
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
      <p style={{ margin: '0 0 6px', color: '#7cba7c', fontWeight: 600, fontSize: '0.9rem' }}>
        Precisa de ajuda? Estamos aqui para ajudar!
      </p>
      <p style={{ margin: '0 0 8px', color: '#aaa', fontSize: '0.82rem' }}>
        Tem dificuldade em preencher alguma parte? Fale connosco pelo WhatsApp ou por chamada:
      </p>
      <div style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: '1.9' }}>
        <div>📱 850 153 315 — WhatsApp e Chamadas</div>
        <div>📱 825 361 510 — WhatsApp</div>
        <div>📞 877 753 315 — Chamadas</div>
        <div>📱 855 643 212 — WhatsApp</div>
      </div>
    </div>
  );
}

function ProvinceBanner() {
  return (
    <div style={{ background: '#1a160a', border: '1px solid #3a2e0a', borderRadius: '8px', padding: '10px 16px', marginBottom: 16, fontSize: '0.8rem', color: '#c5a05999' }}>
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
    missionarios:       f.missionarios.map(cleanPessoa),
    obreiros_nacionais: f.obreiros_nacionais.map(cleanPessoa),
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

  const [noteModal, setNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [clearStep, setClearStep] = useState(0);
  const [clearInput, setClearInput] = useState('');

  useEffect(() => {
    if (!submissionId) localStorage.setItem(LS_FORM, JSON.stringify(formData));
  }, [formData, submissionId]);

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
    const { data: cur } = await supabase.from(HISTORICO_TABLE).select('notas_adicionais').eq('id', submissionId).single();
    const notes = [...(cur?.notas_adicionais || []), { nota: noteText.trim(), created_at: new Date().toISOString(), anexos: [] }];
    const { error: err } = await supabase.from(HISTORICO_TABLE).update({ notas_adicionais: notes }).eq('id', submissionId);
    setLoading(false);
    if (err) { alert('Erro: ' + err.message); return; }
    setSubmissionData(prev => ({ ...prev, notas_adicionais: notes }));
    setNoteText(''); setNoteModal(false);
  };

  const doClear = () => {
    localStorage.removeItem(LS_FORM); localStorage.removeItem(LS_SUB);
    setFormData(EMPTY_FORM); setSubmissionId(null); setSubmissionData(null);
    setClearStep(0); setClearInput('');
  };

  // ── Shared styles ────────────────────────────────────────
  const sIn  = { width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#1a1a24', border: '1px solid #333', color: '#fff', fontSize: '0.9rem' };
  const sTa  = { ...sIn, minHeight: 100, resize: 'vertical' };
  const sLbl = { display: 'block', marginBottom: 6, fontSize: '0.85rem', color: '#ccc' };
  const sFld = { marginBottom: 18 };
  const sSec = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '28px', marginBottom: 20 };
  const sSecTitle = { color: G, fontSize: '1.05rem', fontWeight: 700, marginBottom: 20, display: 'block' };

  // ── Password Gate ────────────────────────────────────────
  if (!authed) return (
    <div className="container">
      <div style={{ textAlign: 'center', paddingTop: 40, marginBottom: 32 }}>
        <p style={{ color: G, textTransform: 'uppercase', letterSpacing: '3px', fontSize: '0.78rem', margin: '0 0 12px' }}>IEVC</p>
        <h1 style={{ fontSize: '1.8rem', background: `linear-gradient(to bottom, #fff, ${G})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }}>
          Levantamento Histórico
        </h1>
      </div>
      <div className="card" style={{ maxWidth: 360, margin: '0 auto' }}>
        <h2 style={{ color: G, marginBottom: 24, fontSize: '1.1rem' }}>Acesso ao Formulário</h2>
        <form onSubmit={handleLogin}>
          <div style={sFld}>
            <label style={sLbl}>Senha de acesso</label>
            <input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setLoginError(''); }}
              placeholder="••••••••" autoFocus style={sIn} />
          </div>
          {loginError && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: '0 0 12px' }}>{loginError}</p>}
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
  if (submissionId && submissionData) return (
    <div className="container">
      <SupportBanner />
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ color: '#4ade80', fontSize: '2.5rem', marginBottom: 12 }}>✓</div>
        <h2 style={{ color: G, margin: 0 }}>Formulário submetido com sucesso!</h2>
        <p style={{ color: '#aaa', marginTop: 8 }}>Obrigado pela sua contribuição.</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: G, marginBottom: 16, fontSize: '1rem' }}>Resumo da submissão</h3>
        <div style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: 1.9 }}>
          {submissionData.nome      && <div><strong>Nome:</strong> {submissionData.nome}</div>}
          {submissionData.telefone  && <div><strong>Telefone:</strong> {submissionData.telefone}</div>}
          {submissionData.provincia && <div><strong>Província:</strong> {submissionData.provincia}</div>}
          {submissionData.igreja    && <div><strong>Igreja:</strong> {submissionData.igreja}</div>}
          {submissionData.funcao    && <div><strong>Função:</strong> {submissionData.funcao}</div>}
        </div>
        {(submissionData.notas_adicionais || []).length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid #222', paddingTop: 16 }}>
            <h4 style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: 8 }}>Informações adicionadas:</h4>
            {(submissionData.notas_adicionais || []).map((n, i) => (
              <div key={i} style={{ background: '#1a1a24', borderRadius: '6px', padding: '10px', marginBottom: 6, fontSize: '0.8rem', color: '#ccc' }}>
                <div style={{ color: '#555', marginBottom: 4 }}>{new Date(n.created_at).toLocaleDateString('pt-MZ')}</div>
                {n.nota}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
        <button type="button" className="btn-primary" onClick={() => setNoteModal(true)} style={{ flex: 1 }}>
          Adicionar informação
        </button>
        <button type="button" className="btn-secondary" onClick={() => setClearStep(1)} style={{ flex: 1 }}>
          Nova submissão
        </button>
      </div>

      {noteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#1a1a24', borderRadius: '12px', padding: '28px', maxWidth: 480, width: '100%', border: '1px solid #333' }}>
            <h3 style={{ color: G, marginBottom: 16 }}>Adicionar informação</h3>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="Escreva aqui as informações adicionais..."
              style={{ ...sTa, width: '100%', marginBottom: 16 }} autoFocus />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-primary" onClick={handleAddNote} disabled={loading || !noteText.trim()}>
                {loading ? 'A guardar...' : 'Guardar'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setNoteModal(false); setNoteText(''); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {clearStep > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#1a1a24', borderRadius: '12px', padding: '28px', maxWidth: 420, width: '100%', border: '1px solid #444', textAlign: 'center' }}>
            {clearStep === 1 && <>
              <h3 style={{ color: '#f87171', marginBottom: 12 }}>Tem a certeza?</h3>
              <p style={{ color: '#ccc', marginBottom: 20 }}>Todos os dados serão apagados.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-primary" type="button" onClick={() => setClearStep(0)}>Cancelar</button>
                <button className="btn-secondary" type="button" onClick={() => setClearStep(2)}>Continuar</button>
              </div>
            </>}
            {clearStep === 2 && <>
              <h3 style={{ color: '#f87171', marginBottom: 12 }}>Atenção</h3>
              <p style={{ color: '#ccc', marginBottom: 20 }}>Isto inclui todas as tabelas, uploads e respostas.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-secondary" type="button" onClick={() => setClearStep(1)}>Voltar</button>
                <button className="btn-secondary" type="button" onClick={() => setClearStep(3)}>Percebo, continuar</button>
              </div>
            </>}
            {clearStep === 3 && <>
              <h3 style={{ color: '#f87171', marginBottom: 12 }}>Último aviso</h3>
              <p style={{ color: '#ccc', marginBottom: 20 }}>Depois de limpar, esta sessão não pode ser recuperada.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-primary" type="button" onClick={() => setClearStep(2)}>Não, voltar</button>
                <button className="btn-secondary" type="button" onClick={() => setClearStep(4)}>Sim, tenho a certeza</button>
              </div>
            </>}
            {clearStep === 4 && <>
              <h3 style={{ color: '#f87171', marginBottom: 12 }}>Confirmação final</h3>
              <p style={{ color: '#ccc', marginBottom: 12 }}>Escreva <strong style={{ color: '#f87171' }}>LIMPAR</strong> para confirmar.</p>
              <input value={clearInput} onChange={e => setClearInput(e.target.value)}
                style={{ ...sIn, textAlign: 'center', marginBottom: 16 }} placeholder="LIMPAR" autoFocus />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn-secondary" type="button" onClick={() => { setClearStep(0); setClearInput(''); }}>Cancelar</button>
                <button type="button" onClick={doClear} disabled={clearInput !== 'LIMPAR'}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: clearInput === 'LIMPAR' ? '#ef4444' : '#333', color: '#fff', border: 'none', cursor: clearInput === 'LIMPAR' ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
                  Confirmar e limpar
                </button>
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  );

  // ── Form ─────────────────────────────────────────────────
  return (
    <div className="container">
      <SupportBanner />

      <div className="page-header">
        <p className="header-eyebrow">IEVC · Levantamento Histórico</p>
        <h1 className="header-title">Inquérito Histórico</h1>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
          Recolha de informações sobre a história da IEVC na sua região.
        </p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── 1. Identificação ───────────────────────── */}
        <section style={sSec}>
          <span style={sSecTitle}>1. Identificação do Inquirido</span>

          <div style={sFld}>
            <label style={sLbl}>Nome completo *</label>
            <input required style={sIn} value={formData.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome e apelido" />
          </div>

          <div style={{ ...sFld, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={sLbl}>Sexo *</label>
              <select required style={sIn} value={formData.sexo} onChange={e => { set('sexo', e.target.value); set('funcao', ''); }}>
                <option value="">— Seleccione —</option>
                <option>Masculino</option>
                <option>Feminino</option>
              </select>
            </div>
            <div>
              <label style={sLbl}>Função</label>
              <select style={sIn} value={formData.funcao} onChange={e => set('funcao', e.target.value)}>
                <option value="">— Seleccione —</option>
                {funcoes.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div style={{ ...sFld, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={sLbl}>Província</label>
              <select style={sIn} value={formData.provincia} onChange={e => { set('provincia', e.target.value); set('distrito', ''); }}>
                <option value="">— Seleccione —</option>
                {PROVINCIAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={sLbl}>Distrito</label>
              <select style={sIn} value={formData.distrito} onChange={e => set('distrito', e.target.value)} disabled={!formData.provincia}>
                <option value="">— Seleccione —</option>
                {distritos.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div style={{ ...sFld, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={sLbl}>Igreja</label>
              <input style={sIn} value={formData.igreja} onChange={e => set('igreja', e.target.value)} placeholder="Nome da igreja" />
            </div>
            <div>
              <label style={sLbl}>Localidade/Bairro</label>
              <input style={sIn} value={formData.localidade} onChange={e => set('localidade', e.target.value)} placeholder="Localidade ou bairro" />
            </div>
          </div>

          <div style={sFld}>
            <label style={sLbl}>Quando ingressou na IEVC</label>
            <select style={sIn} value={formData.quando_ingressou} onChange={e => set('quando_ingressou', e.target.value)}>
              <option value="">— Seleccione —</option>
              <option>No início (1996)</option>
              <option>1997–2010</option>
              <option>2011–2026</option>
            </select>
          </div>

          <div style={{ ...sFld, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={sLbl}>WhatsApp</label>
              <input style={sIn} type="tel" value={formData.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="84 / 85 / 86 ..." />
            </div>
            <div>
              <label style={sLbl}>Telefone *</label>
              <input required style={sIn} type="tel" value={formData.telefone} onChange={e => set('telefone', e.target.value)} placeholder="Número de telefone" />
            </div>
          </div>

          <div style={sFld}>
            <label style={sLbl}>E-mail</label>
            <input style={sIn} type="email" value={formData.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
          </div>
        </section>

        {/* ── 2. Igreja Local ────────────────────────── */}
        <section style={sSec}>
          <span style={sSecTitle}>2. Informações sobre a Igreja Local</span>
          <ProvinceBanner />

          <PersonTable title="Missionários" items={formData.missionarios}
            onChange={v => set('missionarios', v)} provinciaAtual={formData.provincia} />

          <PersonTable title="Obreiros Nacionais" items={formData.obreiros_nacionais}
            onChange={v => set('obreiros_nacionais', v)} provinciaAtual={formData.provincia} />

          <div style={sFld}>
            <label style={sLbl}>Onde começou a igreja?</label>
            <select style={sIn} value={formData.onde_comecou} onChange={e => set('onde_comecou', e.target.value)}>
              <option value="">— Seleccione —</option>
              <option>Templo</option>
              <option>Casa</option>
              <option>Escola</option>
              <option>Ao ar livre</option>
              <option>Outro</option>
            </select>
          </div>
          {formData.onde_comecou === 'Outro' && (
            <div style={sFld}>
              <label style={sLbl}>Especifique onde começou</label>
              <input style={sIn} value={formData.onde_comecou_outro} onChange={e => set('onde_comecou_outro', e.target.value)} placeholder="Descreva o local" />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={sLbl}>Tem imagens ou vídeos sobre o início da igreja?</label>
            <FileUploadSection label="Partilhe imagens, vídeos ou documentos sobre o início da igreja"
              category="inicio_igreja" files={filesFor('inicio_igreja')} onAdd={addFile}
              onRemove={idx => removeFile('inicio_igreja', idx)} uploading={uploading} setUploading={setUploading} />
          </div>

          <div style={{ background: '#1a1a0a', border: '1px solid #2a2a0a', borderRadius: '8px', padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', color: '#888' }}>
            Entende-se por igreja um grupo de pessoas e não edifícios.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              ['igrejas_distrito',            'Igrejas no distrito'],
              ['templos_concluidos_distrito',  'Templos alvenaria concluídos'],
              ['templos_construcao_distrito',  'Templos alvenaria em construção'],
              ['templos_material_distrito',    'Templos de material local'],
            ].map(([key, label]) => (
              <div key={key} style={sFld}>
                <label style={sLbl}>{label}</label>
                <input style={sIn} type="number" min="0" value={formData[key]} onChange={e => set(key, e.target.value)} placeholder="0" />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={sLbl}>Imagens ou documentos sobre a estrutura</label>
            <FileUploadSection label="Partilhe fotos dos templos ou documentos sobre a estrutura"
              category="estrutura_templos" files={filesFor('estrutura_templos')} onAdd={addFile}
              onRemove={idx => removeFile('estrutura_templos', idx)} uploading={uploading} setUploading={setUploading} />
          </div>
        </section>

        {/* ── 3. Cronologia ──────────────────────────── */}
        <section style={sSec}>
          <span style={sSecTitle}>3. Cronologia</span>
          <ProvinceBanner />

          <div style={sFld}>
            <label style={sLbl}>Primeira congregação inaugurada na sua província</label>
            <input style={sIn} value={formData.primeira_congregacao} onChange={e => set('primeira_congregacao', e.target.value)} placeholder="Nome da primeira congregação" />
          </div>

          <div style={{ ...sFld, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...sLbl, marginBottom: 0 }}>Congregações na província</label>
              <button type="button" onClick={() => set('congregacoes', [...formData.congregacoes, emptyCongregacao()])}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: '6px', background: G, color: '#000', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                <Plus size={14} /> Adicionar
              </button>
            </div>
            {formData.congregacoes.length === 0 && <p style={{ color: '#555', fontSize: '0.85rem', fontStyle: 'italic' }}>Nenhuma congregação adicionada.</p>}
            {formData.congregacoes.map((c, i) => (
              <div key={c.id} style={{ background: '#0d0d1a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: '#666', fontSize: '0.78rem' }}>Congregação #{i + 1}</span>
                  <button type="button" onClick={() => set('congregacoes', formData.congregacoes.filter(x => x.id !== c.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ ...sLbl, fontSize: '0.78rem' }}>Distrito</label>
                    <input style={{ ...sIn, fontSize: '0.85rem', padding: '7px 10px' }} value={c.distrito}
                      onChange={e => set('congregacoes', formData.congregacoes.map(x => x.id === c.id ? { ...x, distrito: e.target.value } : x))}
                      placeholder="Distrito" />
                  </div>
                  <div>
                    <label style={{ ...sLbl, fontSize: '0.78rem' }}>Localidade/Congregação</label>
                    <input style={{ ...sIn, fontSize: '0.85rem', padding: '7px 10px' }} value={c.localidade}
                      onChange={e => set('congregacoes', formData.congregacoes.map(x => x.id === c.id ? { ...x, localidade: e.target.value } : x))}
                      placeholder="Nome da localidade" />
                  </div>
                </div>
                <div>
                  <label style={{ ...sLbl, fontSize: '0.78rem' }}>Data de inauguração</label>
                  <DateFlex value={c.data}
                    onChange={d => set('congregacoes', formData.congregacoes.map(x => x.id === c.id ? { ...x, data: d } : x))} />
                </div>
              </div>
            ))}
          </div>

          <div style={sFld}>
            <label style={sLbl}>Quando foi inaugurada a sua congregação?</label>
            <DateFlex value={formData.data_inauguracao} onChange={v => set('data_inauguracao', v)} />
          </div>
        </section>

        {/* ── 4. Desafios ────────────────────────────── */}
        <section style={sSec}>
          <span style={sSecTitle}>4. Desafios</span>
          <ProvinceBanner />

          <div style={sFld}>
            <label style={sLbl}>Quais foram os principais desafios enfrentados?</label>
            {['Financeiros', 'Falta de liderança', 'Resistência da comunidade', 'Outros'].map(d => (
              <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer', color: '#ccc', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={formData.desafios.includes(d)}
                  onChange={e => set('desafios', e.target.checked ? [...formData.desafios, d] : formData.desafios.filter(x => x !== d))}
                  style={{ width: 16, height: 16, accentColor: G }} />
                {d}
              </label>
            ))}
          </div>

          {formData.desafios.includes('Outros') && (
            <div style={sFld}>
              <label style={sLbl}>Outros desafios — descreva</label>
              <textarea style={sTa} value={formData.desafios_outros} onChange={e => set('desafios_outros', e.target.value)} placeholder="Descreva outros desafios..." />
            </div>
          )}

          <div style={sFld}>
            <label style={sLbl}>Momentos marcantes</label>
            <textarea style={sTa} value={formData.momentos_marcantes} onChange={e => set('momentos_marcantes', e.target.value)} placeholder="Partilhe os momentos mais marcantes..." />
          </div>
        </section>

        {/* ── 5. Testemunhos ─────────────────────────── */}
        <section style={sSec}>
          <span style={sSecTitle}>5. Testemunhos e Impacto</span>
          <ProvinceBanner />

          <div style={sFld}>
            <label style={sLbl}>Experiência marcante</label>
            <textarea style={{ ...sTa, minHeight: 120 }} value={formData.experiencia_marcante} onChange={e => set('experiencia_marcante', e.target.value)} placeholder="Partilhe uma experiência que marcou o seu percurso..." />
          </div>

          <div style={sFld}>
            <label style={sLbl}>Impacto na comunidade</label>
            <textarea style={{ ...sTa, minHeight: 120 }} value={formData.impacto_comunidade} onChange={e => set('impacto_comunidade', e.target.value)} placeholder="Como a IEVC impactou a comunidade local?" />
          </div>
        </section>

        {/* ── 6. Dados Complementares ─────────────────── */}
        <section style={sSec}>
          <span style={sSecTitle}>6. Dados Complementares</span>

          <div style={sFld}>
            <label style={sLbl}>Possui documentos históricos?</label>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Sim', 'Não'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#ccc', fontSize: '0.9rem' }}>
                  <input type="radio" name="possui_docs" value={v} checked={formData.possui_documentos === v}
                    onChange={() => set('possui_documentos', v)} style={{ accentColor: G }} />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {formData.possui_documentos === 'Sim' && (
            <div style={{ marginBottom: 16 }}>
              <FileUploadSection label="Carregue aqui os documentos históricos que possui"
                category="documentos_historicos" files={filesFor('documentos_historicos')} onAdd={addFile}
                onRemove={idx => removeFile('documentos_historicos', idx)} uploading={uploading} setUploading={setUploading} />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...sLbl, marginBottom: 0 }}>Pessoas de referência</label>
              <button type="button" onClick={() => set('referencias', [...formData.referencias, emptyReferencia()])}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: '6px', background: '#1a1a2e', border: `1px solid ${G}55`, color: G, cursor: 'pointer', fontSize: '0.78rem' }}>
                <Plus size={13} /> Adicionar
              </button>
            </div>
            {formData.referencias.map((r) => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                <div>
                  <label style={{ ...sLbl, fontSize: '0.78rem' }}>Nome</label>
                  <input style={{ ...sIn, fontSize: '0.85rem', padding: '7px 10px' }} value={r.nome}
                    onChange={e => set('referencias', formData.referencias.map(x => x.id === r.id ? { ...x, nome: e.target.value } : x))}
                    placeholder="Nome da pessoa" />
                </div>
                <div>
                  <label style={{ ...sLbl, fontSize: '0.78rem' }}>Contacto</label>
                  <input style={{ ...sIn, fontSize: '0.85rem', padding: '7px 10px' }} type="tel" value={r.contacto}
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

          <div style={sFld}>
            <label style={sLbl}>Observações finais</label>
            <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 8px' }}>
              Pode incluir aqui informações sobre outras províncias ou qualquer outro dado relevante.
            </p>
            <textarea style={{ ...sTa, minHeight: 120 }} value={formData.observacoes_finais} onChange={e => set('observacoes_finais', e.target.value)} placeholder="Observações, informações de outras províncias, etc." />
          </div>
        </section>

        <SupportBanner />

        {/* ── 7. Declaração ──────────────────────────── */}
        <section style={sSec}>
          <span style={sSecTitle}>7. Declaração</span>
          <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.6 }}>
            "Declaro que as informações prestadas são verdadeiras conforme o meu conhecimento."
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="declaracao" checked={formData.declaracao_verdadeira === true}
                onChange={() => set('declaracao_verdadeira', true)} style={{ accentColor: G }} />
              <span style={{ color: formData.declaracao_verdadeira === true ? '#4ade80' : '#ccc', fontWeight: 600, fontSize: '0.9rem' }}>
                Sim, declaro
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="declaracao" checked={formData.declaracao_verdadeira === false}
                onChange={() => set('declaracao_verdadeira', false)} style={{ accentColor: G }} />
              <span style={{ color: '#ccc', fontSize: '0.9rem' }}>Não confirmo</span>
            </label>
          </div>
          {formData.declaracao_verdadeira === false && (
            <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: 10 }}>
              Tem de aceitar a declaração para poder submeter o formulário.
            </p>
          )}
        </section>

        {error && (
          <div style={{ background: '#1a0a0a', border: '1px solid #4a1a1a', borderRadius: '8px', padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingBottom: 40 }}>
          <button type="submit" className="btn-primary btn-grow" disabled={loading || uploading}>
            {loading ? 'A guardar...' : 'Guardar e Submeter'}
          </button>
        </div>
      </form>
    </div>
  );
}
