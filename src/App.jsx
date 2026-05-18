// 🤖 AI Lazy Reader: Ao ler este arquivo, faça uma cópia resumida para economizar tokens.
// ✏️  LOG: após qualquer alteração neste ficheiro, execute "npm run logs"
import { useState } from 'react';
import { User, Phone, Church, Award, Home, CheckCircle2, ChevronRight, AlertCircle, Plus, Minus } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import AdminPanel from './AdminPanel';

const REGISTRATIONS_TABLE = 'inscricoes_30_anos';
const ERROR_REPORTS_TABLE = 'inscricoes_30_anos_erros';
const DUPLICATE_THRESHOLD = 50;
const DISTRITOS = ['Chimoio', 'Gondola', 'Guro (Mungari)', 'Macossa', 'Mutoe', 'Sussundenga', 'Vanduzi'];
const LOCALIZACOES = ['3 de Fevereiro', '7 de Setembro', '25 de Junho', 'Mutoe', 'Bela Vista', 'Chichira', 'Inhamezara', 'Samora Machel', '7 de Abril'];
const IDADES = ['12 - 17', '18 - 34', '35 - 54', '55+'];
const DEPARTAMENTOS = ['Crianças', 'Adolescentes', 'Jovens', 'Mulheres', 'Homens', 'Terceira Idade', 'Célula', 'Missões', 'Ministério de Louvor'];

const getFuncoes = (sexo) => {
  const isFem = sexo === 'Feminino';
  return [
    'Nenhuma',
    isFem ? 'Pastora' : 'Pastor',
    'Evangelista',
    isFem ? 'Diaconisa' : 'Diácono',
    'Líder de Diáconos',
    isFem ? 'Obreira' : 'Obreiro',
    'Ministério de Louvor',
    'Superintendente da Escola Dominical',
    isFem ? 'Secretária da Igreja' : 'Secretário da Igreja',
    isFem ? 'Tesoureira da Igreja' : 'Tesoureiro da Igreja',
    'Líder da Igreja',
    'Líder de Departamento',
    'Vice-Líder de Departamento'
  ];
};

const browserLogBuffer = [];
if (typeof window !== 'undefined' && !window.__inscricaoLogCaptureReady) {
  window.__inscricaoLogCaptureReady = true;
  const pushLog = (level, args) => {
    browserLogBuffer.push({
      level,
      at: new Date().toISOString(),
      message: args.map(item => {
        if (item instanceof Error) return item.stack || item.message;
        if (typeof item === 'string') return item;
        try { return JSON.stringify(item); } catch { return String(item); }
      }).join(' '),
    });
    if (browserLogBuffer.length > 40) browserLogBuffer.shift();
  };

  ['error', 'warn', 'log'].forEach(level => {
    const original = console[level];
    console[level] = (...args) => {
      pushLog(level, args);
      original.apply(console, args);
    };
  });

  window.addEventListener('error', event => pushLog('window.error', [event.message, event.filename, event.lineno]));
  window.addEventListener('unhandledrejection', event => pushLog('promise.rejection', [event.reason]));
}

const getRegistrationErrorMessage = (error) => {
  const message = error?.message || '';

  if (message.includes('Could not find the table')) {
    return 'A tabela de inscrições não foi encontrada no Supabase. Confirme se o setup.sql atualizado foi executado.';
  }

  if (message.includes('Could not find') && message.includes('column')) {
    return 'A tabela de inscrições está desatualizada no Supabase. Execute o setup.sql atualizado.';
  }

  if (error?.code === '42501' || message.toLowerCase().includes('row-level security')) {
    return 'Sem permissão para gravar no Supabase. Verifique as políticas RLS da tabela de inscrições.';
  }

  return 'Erro ao realizar inscrição. Verifique a ligação e tente novamente.';
};

const isMissingSchemaError = (error) => {
  const message = error?.message || '';
  return message.includes('Could not find') && (message.includes('column') || message.includes('table'));
};

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = Array(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev.splice(0, prev.length, ...curr);
  }

  return prev[b.length];
};

const textSimilarity = (a, b) => {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left && !right) return null;
  if (!left || !right) return 0;
  const distance = levenshtein(left, right);
  return Math.max(0, 1 - distance / Math.max(left.length, right.length));
};

const exactSimilarity = (a, b) => {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left && !right) return null;
  if (!left || !right) return 0;
  return left === right ? 1 : 0;
};

const phoneSimilarity = (a, b) => {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  if (!left && !right) return null;
  if (!left || !right) return 0;
  return left.includes(right) || right.includes(left) ? 1 : textSimilarity(left, right);
};

const calculateDuplicateMatch = (candidate, existing) => {
  const checks = [
    { label: 'Nome', weight: 45, score: textSimilarity(candidate.nome, existing.nome) },
    { label: 'Telefone', weight: 30, score: phoneSimilarity(candidate.contacto, existing.contacto) },
    { label: 'WhatsApp', weight: 20, score: phoneSimilarity(candidate.whatsapp, existing.whatsapp) },
    { label: 'Função', weight: 10, score: textSimilarity(candidate.funcao, existing.funcao) },
    { label: 'Sexo', weight: 3, score: exactSimilarity(candidate.sexo, existing.sexo) },
    { label: 'Faixa etária', weight: 3, score: exactSimilarity(candidate.idade, existing.idade) },
    { label: 'Distrito', weight: 3, score: exactSimilarity(candidate.distrito, existing.distrito) },
    { label: 'Localização', weight: 5, score: exactSimilarity(candidate.localizacao, existing.localizacao) },
  ].filter(item => item.score !== null);

  const totalWeight = checks.reduce((sum, item) => sum + item.weight, 0) || 1;
  const weightedScore = checks.reduce((sum, item) => sum + (item.score * item.weight), 0);
  const score = Math.round((weightedScore / totalWeight) * 100);
  const matchedFields = checks
    .filter(item => item.score >= 0.75)
    .map(item => `${item.label} (${Math.round(item.score * 100)}%)`);

  return { score, matchedFields };
};

const DateSelector = ({ value, onChange, name, required }) => {
  const parts = (value || '').split('-');
  const year = parts[0] || '';
  const month = parts[1] || '';
  const day = parts[2] || '';

  const update = (y, m, d) => {
    if (!y) return onChange({ target: { name, value: '' } });
    if (!m) return onChange({ target: { name, value: y } });
    if (!d) return onChange({ target: { name, value: `${y}-${m}` } });
    return onChange({ target: { name, value: `${y}-${m}-${d}` } });
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

const INITIAL_FORM = {
  nome: '',
  sexo: '',
  telephones: [''],
  whatsapp: '',
  distrito: '',
  localizacao: '',
  idade: '',
  departamento: '',
  batizadoAgua: false,
  dataBatizadoAgua: '',
  batizadoEspirito: false,
  dataBatizadoEspirito: '',
  funcoes: [],
  liderDeptos: [],
  viceLiderDeptos: [],
  hospedagem: '',
  contribuicao: '',
  valorContribuicao: '',
  participaCelebracao: '',
  inscritoPor: '',
};

function App() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastErrorReport, setLastErrorReport] = useState(null);
  const [reportingError, setReportingError] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState({ show: false, existingId: null, match: null });

  if (window.location.pathname === '/admin') {
    return <AdminPanel onBack={() => { window.location.href = '/'; }} />;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'batizadoAgua' && !checked) next.dataBatizadoAgua = '';
      if (name === 'batizadoEspirito' && !checked) next.dataBatizadoEspirito = '';
      return next;
    });
  };

  const updatePhone = (index, value) => {
    setFormData(prev => {
      const telephones = [...prev.telephones];
      telephones[index] = value;
      return { ...prev, telephones };
    });
  };

  const addPhone = () => {
    setFormData(prev => ({ ...prev, telephones: [...prev.telephones, ''] }));
  };

  const removePhone = (index) => {
    setFormData(prev => ({
      ...prev,
      telephones: prev.telephones.filter((_, i) => i !== index),
    }));
  };

  const buildPayload = () => {
    const contacto = formData.telephones
      .map(t => t.trim())
      .filter(Boolean)
      .join(', ');
    const whatsapp = formData.whatsapp.trim();

    if (formData.funcoes.length === 0) {
      return { error: 'Selecione pelo menos uma função na Igreja.' };
    }

    if (formData.funcoes.includes('Líder de Departamento') && formData.liderDeptos.length === 0) {
      return { error: 'Por favor, selecione pelo menos um departamento onde é Líder.' };
    }

    if (formData.funcoes.includes('Vice-Líder de Departamento') && formData.viceLiderDeptos.length === 0) {
      return { error: 'Por favor, selecione pelo menos um departamento onde é Vice-Líder.' };
    }

    const allFuncoes = [
      ...formData.funcoes.filter(f => f !== 'Líder de Departamento' && f !== 'Vice-Líder de Departamento'),
      ...formData.liderDeptos.map(d => `Líder de ${d}`),
      ...formData.viceLiderDeptos.map(d => `Vice-Líder de ${d}`)
    ].filter(Boolean);

    return {
      payload: {
        nome: formData.nome.trim().replace(/\s+/g, ' '),
        sexo: formData.sexo,
        contacto,
        whatsapp,
        distrito: formData.distrito,
        localizacao: formData.localizacao,
        idade: formData.idade,
        departamento: formData.departamento || '',
        batizado_agua: formData.batizadoAgua,
        data_batizado_agua: formData.batizadoAgua && formData.dataBatizadoAgua ? formData.dataBatizadoAgua : null,
        batizado_espirito: formData.batizadoEspirito,
        data_batizado_espirito: formData.batizadoEspirito && formData.dataBatizadoEspirito ? formData.dataBatizadoEspirito : null,
        funcao: allFuncoes.join(', '),
        hospedagem: formData.hospedagem,
        participa_celebracao: formData.participaCelebracao,
        contribuicao: formData.contribuicao,
        valor_contribuicao: formData.contribuicao === 'Sim' ? (formData.valorContribuicao || '') : '',
        inscrito_por: formData.inscritoPor,
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { payload, error: validationError } = buildPayload();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!duplicateModal.existingId && !duplicateModal.show) {
      setLoading(true);
      setError(null);
      const { data, error: duplicateError } = await supabase
        .from(REGISTRATIONS_TABLE)
        .select('id, nome, contacto, whatsapp, sexo, idade, distrito, localizacao, departamento, funcao, hospedagem, participa_celebracao')
        .limit(500);
      setLoading(false);

      if (duplicateError) {
        if (isMissingSchemaError(duplicateError)) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from(REGISTRATIONS_TABLE)
            .select('id, nome, contacto, whatsapp, sexo, idade, distrito, localizacao, departamento, funcao, hospedagem')
            .limit(500);

          if (!fallbackError) {
            const bestMatch = (fallbackData || [])
              .map(row => ({ ...calculateDuplicateMatch(payload, row), row }))
              .sort((a, b) => b.score - a.score)[0];

            if (bestMatch && bestMatch.score >= DUPLICATE_THRESHOLD) {
              setDuplicateModal({ show: true, existingId: bestMatch.row.id, match: bestMatch });
              return;
            }

            await saveRegistration(null, payload);
            return;
          }
        }
        console.error('Erro Supabase ao verificar duplicados:', duplicateError);
        setError(getRegistrationErrorMessage(duplicateError));
        return;
      }

      const bestMatch = (data || [])
        .map(row => ({ ...calculateDuplicateMatch(payload, row), row }))
        .sort((a, b) => b.score - a.score)[0];

      if (bestMatch && bestMatch.score >= DUPLICATE_THRESHOLD) {
        setDuplicateModal({ show: true, existingId: bestMatch.row.id, match: bestMatch });
        return;
      }
    }

    await saveRegistration(duplicateModal.existingId, payload);
  };

  const saveRegistration = async (idToUpdate, readyPayload) => {
    setLoading(true);
    setError(null);

    const payload = readyPayload || buildPayload().payload;

    let sbError;
    if (idToUpdate) {
      const { error } = await supabase.from(REGISTRATIONS_TABLE).update(payload).eq('id', idToUpdate);
      sbError = error;
    } else {
      const { error } = await supabase.from(REGISTRATIONS_TABLE).insert([payload]);
      sbError = error;
    }

    if (sbError && isMissingSchemaError(sbError) && 'participa_celebracao' in payload) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.participa_celebracao;
      if (idToUpdate) {
        const { error } = await supabase.from(REGISTRATIONS_TABLE).update(fallbackPayload).eq('id', idToUpdate);
        sbError = error;
      } else {
        const { error } = await supabase.from(REGISTRATIONS_TABLE).insert([fallbackPayload]);
        sbError = error;
      }
    }

    setLoading(false);

    if (sbError) {
      console.error('Erro Supabase:', sbError);
      setError(getRegistrationErrorMessage(sbError));
      return;
    }

    setDuplicateModal({ show: false, existingId: null, match: null });
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateExisting = () => {
    const { payload, error: validationError } = buildPayload();
    if (validationError) {
      setError(validationError);
      return;
    }
    saveRegistration(duplicateModal.existingId, payload);
  };
  const handleDifferentPerson = () => {
    const { payload, error: validationError } = buildPayload();
    if (validationError) {
      setError(validationError);
      return;
    }
    saveRegistration(null, payload);
  };
  const handleCancel = () => {
    setDuplicateModal({ show: false, existingId: null, match: null });
  };

  const handleReportError = async () => {
    if (!error) return;
    setReportingError(true);
    setLastErrorReport(null);

    const report = {
      mensagem: error,
      formulario: {
        nome: formData.nome,
        sexo: formData.sexo,
        contacto: formData.telephones.map(t => t.trim()).filter(Boolean).join(', '),
        whatsapp: formData.whatsapp.trim(),
        distrito: formData.distrito,
        localizacao: formData.localizacao,
        idade: formData.idade,
        funcao: formData.funcoes.join(', '),
      },
      browser_logs: browserLogBuffer,
      user_agent: navigator.userAgent,
      url: window.location.href,
    };

    const { error: reportError } = await supabase
      .from(ERROR_REPORTS_TABLE)
      .insert([report]);

    setReportingError(false);
    if (reportError) {
      console.error('Erro ao enviar report:', reportError);
      setLastErrorReport('Não foi possível enviar o report agora.');
      return;
    }

    setLastErrorReport('Erro enviado para análise do administrador.');
  };

  if (submitted) {
    return (
      <div className="container">
        <div className="card success-card">
          <div className="success-icon">
            <CheckCircle2 size={64} color="#c5a059" />
          </div>
          <h1 className="success-title">Inscrição Confirmada!</h1>
          <p className="success-msg">
            Obrigado por se inscrever para a celebração de 30 anos da Visão Cristã.
            Estamos ansiosos para celebrar com você!
          </p>
          <button
            className="btn-primary"
            onClick={() => { setSubmitted(false); setFormData(INITIAL_FORM); }}
          >
            Nova Inscrição
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <p className="header-eyebrow" style={{ fontSize: '1.2rem', color: '#c5a059', fontWeight: 'bold' }}>Celebração de 30 Anos</p>
        <h1 className="header-title" style={{ fontSize: '2.5rem' }}>Visão Cristã - Manica</h1>
        <p className="header-sub">Formulário de Inscrição Local - 01</p>
      </header>

      <div className="card">
        <form onSubmit={handleSubmit}>

          {/* Dados Pessoais */}
          <section className="form-section">
            <h3 className="section-title"><User size={18} /> Dados Pessoais</h3>
            <div className="field">
              <label>Nome Completo</label>
              <input required name="nome" value={formData.nome} onChange={handleChange} placeholder="Seu nome completo" />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Sexo</label>
                <select required name="sexo" value={formData.sexo} onChange={handleChange}>
                  <option value="">Selecione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>
              <div className="field">
                <label>Faixa Etária</label>
                <select required name="idade" value={formData.idade} onChange={handleChange}>
                  <option value="">Selecione</option>
                  {IDADES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Contactos */}
          <section className="form-section">
            <h3 className="section-title"><Phone size={18} /> Contactos</h3>
            <div className="field">
              <label>
                Telefone
              </label>
              {formData.telephones.map((tel, i) => (
                <div key={i} className="phone-row">
                  <input
                    value={tel}
                    onChange={e => updatePhone(i, e.target.value)}
                    placeholder="+258 8X XXX XXXX"
                  />
                  {formData.telephones.length > 1 && (
                    <button type="button" className="btn-icon btn-icon-remove" onClick={() => removePhone(i)} title="Remover">
                      <Minus size={15} />
                    </button>
                  )}
                  {i === formData.telephones.length - 1 && (
                    <button type="button" className="btn-icon btn-icon-add" onClick={addPhone} title="Adicionar número">
                      <Plus size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="field">
              <label>WhatsApp</label>
              <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="+258 8X XXX XXXX" />
            </div>
          </section>

          {/* Origem e Igreja */}
          <section className="form-section">
            <h3 className="section-title"><Church size={18} /> Origem e Igreja</h3>
            <div className="grid-2">
              <div className="field">
                <label>Distrito</label>
                <select required name="distrito" value={formData.distrito} onChange={handleChange}>
                  <option value="">Selecione</option>
                  {DISTRITOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Localização da Igreja</label>
                <select required name="localizacao" value={formData.localizacao} onChange={handleChange}>
                  <option value="">Selecione</option>
                  {LOCALIZACOES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Departamento</label>
              <input name="departamento" value={formData.departamento} onChange={handleChange} placeholder="Ex: Louvor, Crianças, Jovens..." />
            </div>
          </section>

          {/* Vida Cristã */}
          <section className="form-section">
            <h3 className="section-title"><Award size={18} /> Vida Cristã</h3>
            <div className="baptism-group">
              <label className="check-label">
                <input type="checkbox" name="batizadoAgua" checked={formData.batizadoAgua} onChange={handleChange} />
                <span>Batizado nas Águas</span>
              </label>
              {formData.batizadoAgua && (
                <div className="baptism-date">
                  <label>Data do Baptismo nas Águas</label>
                  <DateSelector name="dataBatizadoAgua" value={formData.dataBatizadoAgua} onChange={handleChange} required={false} />
                </div>
              )}
              <label className="check-label">
                <input type="checkbox" name="batizadoEspirito" checked={formData.batizadoEspirito} onChange={handleChange} />
                <span>Batizado no Espírito Santo</span>
              </label>
              {formData.batizadoEspirito && (
                <div className="baptism-date">
                  <label>Data do Baptismo no Espírito Santo</label>
                  <DateSelector name="dataBatizadoEspirito" value={formData.dataBatizadoEspirito} onChange={handleChange} required={false} />
                </div>
              )}
            </div>
            <div className="field">
              <label>Função na Igreja</label>
              <div className="funcao-group">
                {getFuncoes(formData.sexo).map(f => (
                  <div key={f} className="funcao-item-container">
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={formData.funcoes.includes(f)}
                        onChange={e => {
                          const checked = e.target.checked;
                          setFormData(prev => {
                            let nextFuncoes = checked ? [...prev.funcoes, f] : prev.funcoes.filter(x => x !== f);

                            if (checked && f === 'Nenhuma') {
                              nextFuncoes = ['Nenhuma'];
                            } else if (checked && f !== 'Nenhuma') {
                              nextFuncoes = nextFuncoes.filter(x => x !== 'Nenhuma');
                            }

                            let nextLider = prev.liderDeptos;
                            let nextVice = prev.viceLiderDeptos;
                            if (!nextFuncoes.includes('Líder de Departamento')) nextLider = [];
                            if (!nextFuncoes.includes('Vice-Líder de Departamento')) nextVice = [];

                            return {
                              ...prev,
                              funcoes: nextFuncoes,
                              liderDeptos: nextLider,
                              viceLiderDeptos: nextVice
                            };
                          });
                        }}
                      />
                      <span>{f}</span>
                    </label>

                    {f === 'Líder de Departamento' && formData.funcoes.includes(f) && (
                      <div className="sub-funcao-group">
                        {DEPARTAMENTOS.map(d => (
                          <label key={d} className="check-label sub-label">
                            <input
                              type="checkbox"
                              checked={formData.liderDeptos.includes(d)}
                              onChange={e => {
                                const checked = e.target.checked;
                                setFormData(prev => ({
                                  ...prev,
                                  liderDeptos: checked ? [...prev.liderDeptos, d] : prev.liderDeptos.filter(x => x !== d)
                                }));
                              }}
                            />
                            <span>Líder de {d}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {f === 'Vice-Líder de Departamento' && formData.funcoes.includes(f) && (
                      <div className="sub-funcao-group">
                        {DEPARTAMENTOS.map(d => (
                          <label key={d} className="check-label sub-label">
                            <input
                              type="checkbox"
                              checked={formData.viceLiderDeptos.includes(d)}
                              onChange={e => {
                                const checked = e.target.checked;
                                setFormData(prev => ({
                                  ...prev,
                                  viceLiderDeptos: checked ? [...prev.viceLiderDeptos, d] : prev.viceLiderDeptos.filter(x => x !== d)
                                }));
                              }}
                            />
                            <span>Vice-Líder de {d}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>



          </section>

          {/* Logística */}
          <section className="form-section">
            <h3 className="section-title"><Home size={18} /> Logística</h3>
            <div className="field">
              <label>Vai participar na Celebração?</label>
              <div className="radio-group">
                <label className="check-label">
                  <input type="radio" name="participaCelebracao" value="Sim" checked={formData.participaCelebracao === 'Sim'} onChange={handleChange} required />
                  <span>Sim</span>
                </label>
                <label className="check-label">
                  <input type="radio" name="participaCelebracao" value="Não" checked={formData.participaCelebracao === 'Não'} onChange={handleChange} />
                  <span>Não</span>
                </label>
              </div>
            </div>
            <div className="field">
              <label>Tem lugar de hospedagem durante a celebração?</label>
              <div className="radio-group">
                <label className="check-label">
                  <input type="radio" name="hospedagem" value="Sim" checked={formData.hospedagem === 'Sim'} onChange={handleChange} required />
                  <span>Sim</span>
                </label>
                <label className="check-label">
                  <input type="radio" name="hospedagem" value="Não" checked={formData.hospedagem === 'Não'} onChange={handleChange} />
                  <span>Não</span>
                </label>
              </div>
            </div>
            <div className="field">
              <label>Já fez a Contribuição para o Evento?</label>
              <div className="radio-group">
                <label className="check-label">
                  <input type="radio" name="contribuicao" value="Sim" checked={formData.contribuicao === 'Sim'} onChange={handleChange} required />
                  <span>Sim</span>
                </label>
                <label className="check-label">
                  <input type="radio" name="contribuicao" value="Não" checked={formData.contribuicao === 'Não'} onChange={handleChange} />
                  <span>Não</span>
                </label>
              </div>
            </div>
            {formData.contribuicao === 'Sim' && (
              <div className="field">
                <label>Valor da contribuição</label>
                <input
                  name="valorContribuicao"
                  value={formData.valorContribuicao}
                  onChange={handleChange}
                  placeholder="Ex: 500 MZN"
                />
              </div>
            )}
          </section>

          {/* Responsável pelo Registo */}
          <section className="form-section">
            <h3 className="section-title"><User size={18} /> Responsável pelo Registo</h3>
            <div className="field">
              <label>Quem está a preencher este formulário?</label>
              <input required name="inscritoPor" value={formData.inscritoPor} onChange={handleChange} placeholder="Nome do responsável pelo registo" />
            </div>
          </section>

          {error && (
            <div className="error-msg error-msg-stack">
              <div className="error-msg-line">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
              <div className="error-actions">
                <button type="button" className="btn-secondary btn-small" onClick={handleReportError} disabled={reportingError}>
                  {reportingError ? 'A enviar...' : 'Reportar erro'}
                </button>
                {lastErrorReport && <span className="report-status">{lastErrorReport}</span>}
              </div>
            </div>
          )}

          <div className="btn-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setFormData(INITIAL_FORM); setError(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              Limpar Formulário
            </button>
            <button type="submit" className="btn-primary btn-grow" disabled={loading}>
              {loading ? 'A processar...' : <><span>Guardar Inscrição</span><ChevronRight size={20} /></>}
            </button>
          </div>

        </form>
      </div>

      {duplicateModal.show && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px'
        }}>
          <div className="modal-content" style={{
            backgroundColor: '#1a1a24', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid #333', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ marginBottom: 16, color: '#c5a059', fontSize: '1.2rem' }}>Inscrição Encontrada</h3>
            <p style={{ marginBottom: 24, fontSize: '0.95rem', color: '#ccc', lineHeight: '1.5' }}>
              Encontramos uma inscrição parecida com <strong>{formData.nome}</strong>.
            </p>
            {duplicateModal.match && (
              <div className="duplicate-score-box">
                <div className="duplicate-score">{duplicateModal.match.score}% de semelhança</div>
                <div className="duplicate-name">{duplicateModal.match.row.nome}</div>
                {duplicateModal.match.matchedFields.length > 0 && (
                  <div className="duplicate-fields">
                    {duplicateModal.match.matchedFields.map(field => <span key={field}>{field}</span>)}
                  </div>
                )}
              </div>
            )}
            <p style={{ marginBottom: 24, fontSize: '0.95rem', color: '#ccc', lineHeight: '1.5' }}>
              O limite de alerta é {DUPLICATE_THRESHOLD}%. Confirme se deseja atualizar a inscrição existente ou continuar como pessoa diferente.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button type="button" className="btn-primary" onClick={handleUpdateExisting}>
                Sim, sou eu. Atualizar meus dados
              </button>
              <button type="button" className="btn-secondary" onClick={handleDifferentPerson}>
                Não, somos pessoas diferentes
              </button>
              <button type="button" className="btn-secondary" style={{ background: 'transparent', border: '1px solid #444', color: '#999' }} onClick={handleCancel}>
                Cancelar (Já estou inscrito)
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="page-footer">
        &copy; 2026 Visão Cristã · Celebração de 30 Anos de Impacto
        <button className="admin-link" onClick={() => { window.location.href = '/admin'; }}>·</button>
      </footer>
    </div>
  );
}

export default App;
