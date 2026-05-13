// ✏️  LOG: após qualquer alteração neste ficheiro, execute "npm run logs"
import { useState } from 'react';
import { User, Phone, Church, Award, Home, CheckCircle2, ChevronRight, AlertCircle, Plus, Minus } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import AdminPanel from './AdminPanel';

const DISTRITOS = ['Chimoio', 'Gondola', 'Guro (Mungari)', 'Macossa', 'Sussundenga', 'Vanduzi'];
const LOCALIZACOES = ['3 de Fevereiro', '7 de Setembro', '25 de Junho', 'Muotoe', 'Bela Vista', 'Chichira', 'Samora Machel', '7 de Abril'];
const IDADES = ['Até 11 anos', '12 - 17', '18 - 34', '35 - 54', '55+'];
const FUNCOES = [
  'Pastor', 'Evangelista', 'Diácono', 'Secretário da igreja', 'Tesoureiro da igreja',
  'Líder de Crianças', 'Líder de Adolescentes', 'Líder de Jovens', 'Líder de Mulheres',
  'Líder de Homens', 'Líder de Terceira idade',
  'Líder de Célula', 'Líder de Missões', 'Líder de Igreja', 'Outro (indicar)',
];

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
  outraFuncao: '',
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
    setLoading(true);
    setError(null);

    const contacto = formData.telephones.filter(t => t.trim()).join(', ') || null;

    if (formData.funcoes.length === 0) {
      setError('Selecione pelo menos uma função na Igreja.');
      setLoading(false);
      return;
    }

    const funcao = formData.funcoes
      .map(f => f === 'Outro (indicar)' ? formData.outraFuncao : f)
      .filter(Boolean)
      .join(', ');

    const { error: sbError } = await supabase.from('inscricoes_30_anos').insert([{
      nome: formData.nome,
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
    }]);

    setLoading(false);

    if (sbError) {
      setError('Erro ao realizar inscrição. Verifique a ligação e tente novamente.');
      return;
    }

    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                  <input type="date" name="dataBatizadoAgua" value={formData.dataBatizadoAgua} onChange={handleChange} />
                </div>
              )}
              <label className="check-label">
                <input type="checkbox" name="batizadoEspirito" checked={formData.batizadoEspirito} onChange={handleChange} />
                <span>Batizado no Espírito Santo</span>
              </label>
              {formData.batizadoEspirito && (
                <div className="baptism-date">
                  <label>Data do Baptismo no Espírito Santo <span className="label-optional">(opcional)</span></label>
                  <input type="date" name="dataBatizadoEspirito" value={formData.dataBatizadoEspirito} onChange={handleChange} />
                </div>
              )}
            </div>
            <div className="field">
              <label>Função na Igreja <span className="label-optional">(selecione uma ou mais)</span></label>
              <div className="funcao-group">
                {FUNCOES.map(f => (
                  <label key={f} className="check-label">
                    <input
                      type="checkbox"
                      checked={formData.funcoes.includes(f)}
                      onChange={e => {
                        const checked = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          funcoes: checked ? [...prev.funcoes, f] : prev.funcoes.filter(x => x !== f),
                          outraFuncao: !checked && f === 'Outro (indicar)' ? '' : prev.outraFuncao,
                        }));
                      }}
                    />
                    <span>{f}</span>
                  </label>
                ))}
              </div>
            </div>
            {formData.funcoes.includes('Outro (indicar)') && (
              <div className="field">
                <input required name="outraFuncao" value={formData.outraFuncao} onChange={handleChange} placeholder="Especifique sua função" />
              </div>
            )}
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
              <label>Já fez a Contribuição para o Evento ou para a Celebração?</label>
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

      <footer className="page-footer">
        &copy; 2026 Visão Cristã · Celebração de 30 Anos de Impacto
        <button className="admin-link" onClick={() => setAdminView(true)}>·</button>
      </footer>
    </div>
  );
}

export default App;
