// 🤖 AI Lazy Reader: Ao ler este arquivo, faça uma cópia resumida para economizar tokens.
// ✏️  LOG: após qualquer alteração neste ficheiro, execute "npm run logs"
import { useState } from 'react';
import { User, Phone, Church, Award, Home, CheckCircle2, ChevronRight, AlertCircle, Plus, Minus, X } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import AdminPanel from './AdminPanel';

const DISTRITOS = ['Chimoio', 'Gondola', 'Guro (Mungari)', 'Macossa', 'Sussundenga', 'Vanduzi'];
const LOCALIZACOES = ['3 de Fevereiro', '7 de Setembro', '25 de Junho', 'Muotoe', 'Bela Vista', 'Chichira', 'Samora Machel', '7 de Abril'];
const IDADES = ['Até 11 anos', '12 - 17', '18 - 34', '35 - 54', '55+'];
const DEPARTAMENTOS = ['Crianças', 'Adolescentes', 'Jovens', 'Mulheres', 'Homens', 'Terceira Idade', 'Célula', 'Missões'];

const getFuncoes = (sexo) => {
  const isFem = sexo === 'Feminino';
  return [
    'Nenhum',
    isFem ? 'Pastora' : 'Pastor',
    'Evangelista',
    isFem ? 'Diaconisa' : 'Diácono',
    'Líder de Diáconos',
    'Superintendente da Escola Dominical',
    isFem ? 'Secretária da Igreja' : 'Secretário da Igreja',
    isFem ? 'Tesoureira da Igreja' : 'Tesoureiro da Igreja',
    'Líder da Igreja',
    'Líder de Departamento',
    'Vice-Líder de Departamento'
  ];
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
  const years = Array.from({length: 100}, (_, i) => currentYear - i);
  const months = Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
  const days = Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0'));

  return (
    <div className="date-selector" style={{ display: 'flex', gap: '8px' }}>
      <select value={year} onChange={e => update(e.target.value, month, day)} required={required} style={{ flex: 1 }}>
        <option value="">Ano</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select value={month} onChange={e => update(year, e.target.value, day)} disabled={!year} style={{ flex: 1 }}>
        <option value="">Mês (Opc)</option>
        {months.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={day} onChange={e => update(year, month, e.target.value)} disabled={!month} style={{ flex: 1 }}>
        <option value="">Dia (Opc)</option>
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
};

function App() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminView, setAdminView] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState({ show: false, existingId: null });

  if (adminView) return <AdminPanel onBack={() => setAdminView(false)} />;

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nomeNormalizado = formData.nome.trim().replace(/\s+/g, ' ');

    if (!duplicateModal.existingId && !duplicateModal.show) {
      setLoading(true);
      setError(null);
      const { data } = await supabase
        .from('inscricoes_30_anos')
        .select('id, nome')
        .ilike('nome', nomeNormalizado);
      setLoading(false);

      if (data && data.length > 0) {
        setDuplicateModal({ show: true, existingId: data[0].id });
        return;
      }
    }

    await saveRegistration(duplicateModal.existingId);
  };

  const saveRegistration = async (idToUpdate) => {
    setLoading(true);
    setError(null);

    const contacto = formData.telephones.filter(t => t.trim()).join(', ') || null;

    if (formData.funcoes.length === 0) {
      setError('Selecione pelo menos uma função na Igreja.');
      setLoading(false);
      return;
    }

    if (formData.funcoes.includes('Líder de Departamento') && formData.liderDeptos.length === 0) {
      setError('Por favor, selecione pelo menos um departamento onde é Líder.');
      setLoading(false);
      return;
    }

    if (formData.funcoes.includes('Vice-Líder de Departamento') && formData.viceLiderDeptos.length === 0) {
      setError('Por favor, selecione pelo menos um departamento onde é Vice-Líder.');
      setLoading(false);
      return;
    }

    const allFuncoes = [
      ...formData.funcoes.filter(f => f !== 'Líder de Departamento' && f !== 'Vice-Líder de Departamento'),
      ...formData.liderDeptos.map(d => `Líder de ${d}`),
      ...formData.viceLiderDeptos.map(d => `Vice-Líder de ${d}`)
    ].filter(Boolean);
    const funcao = allFuncoes.join(', ');

    const nomeNormalizado = formData.nome.trim().replace(/\s+/g, ' ');

    const payload = {
      nome: nomeNormalizado,
      sexo: formData.sexo,
      contacto,
      whatsapp: formData.whatsapp || null,
      distrito: formData.distrito,
      localizacao: formData.localizacao,
      idade: formData.idade,
      departamento: formData.departamento || null,
      batizado_agua: formData.batizadoAgua,
      data_batizado_agua: formData.batizadoAgua && formData.dataBatizadoAgua ? formData.dataBatizadoAgua : null,
      batizado_espirito: formData.batizadoEspirito,
      data_batizado_espirito: formData.batizadoEspirito && formData.dataBatizadoEspirito ? formData.dataBatizadoEspirito : null,
      funcao,
      hospedagem: formData.hospedagem,
      contribuicao: formData.contribuicao,
      valor_contribuicao: formData.contribuicao === 'Sim' ? (formData.valorContribuicao || null) : null,
    };

    let sbError;
    if (idToUpdate) {
      const { error } = await supabase.from('inscricoes_30_anos').update(payload).eq('id', idToUpdate);
      sbError = error;
    } else {
      const { error } = await supabase.from('inscricoes_30_anos').insert([payload]);
      sbError = error;
    }

    setLoading(false);

    if (sbError) {
      setError('Erro ao realizar inscrição. Verifique a ligação e tente novamente.');
      return;
    }

    setDuplicateModal({ show: false, existingId: null });
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateExisting = () => {
    saveRegistration(duplicateModal.existingId);
  };
  const handleDifferentPerson = () => {
    saveRegistration(null);
  };
  const handleCancel = () => {
    setDuplicateModal({ show: false, existingId: null });
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
        <p className="header-eyebrow">Celebração 30 Anos</p>
        <h1 className="header-title">Visão Cristã</h1>
        <p className="header-sub">Formulário de Inscrição Oficial</p>
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
                Telefone <span className="label-optional">(opcional)</span>
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
              <label>WhatsApp <span className="label-optional">(opcional)</span></label>
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
              <label>Departamento <span className="label-optional">(opcional)</span></label>
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
                  <label>Data do Baptismo nas Águas <span className="label-optional">(opcional)</span></label>
                  <DateSelector name="dataBatizadoAgua" value={formData.dataBatizadoAgua} onChange={handleChange} required={false} />
                </div>
              )}
              <label className="check-label">
                <input type="checkbox" name="batizadoEspirito" checked={formData.batizadoEspirito} onChange={handleChange} />
                <span>Batizado no Espírito Santo</span>
              </label>
              {formData.batizadoEspirito && (
                <div className="baptism-date">
                  <label>Data do Baptismo no Espírito Santo <span className="label-optional">(opcional)</span></label>
                  <DateSelector name="dataBatizadoEspirito" value={formData.dataBatizadoEspirito} onChange={handleChange} required={false} />
                </div>
              )}
            </div>
            <div className="field">
              <label>Função na Igreja <span className="label-optional">(selecione uma ou mais)</span></label>
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
                            
                            if (checked && f === 'Nenhum') {
                              nextFuncoes = ['Nenhum'];
                            } else if (checked && f !== 'Nenhum') {
                              nextFuncoes = nextFuncoes.filter(x => x !== 'Nenhum');
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
                <label>Valor da contribuição <span className="label-optional">(opcional)</span></label>
                <input
                  name="valorContribuicao"
                  value={formData.valorContribuicao}
                  onChange={handleChange}
                  placeholder="Ex: 500 MZN"
                />
              </div>
            )}
          </section>

          {error && (
            <div className="error-msg">
              <AlertCircle size={18} />
              <span>{error}</span>
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
              Já existe uma inscrição com o nome <strong>{formData.nome}</strong>. O que deseja fazer?
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
        <button className="admin-link" onClick={() => setAdminView(true)}>·</button>
      </footer>
    </div>
  );
}

export default App;
