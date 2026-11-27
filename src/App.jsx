import { useEffect, useMemo, useState } from 'react';
import Auth from './Auth.jsx';
import { supabase } from './lib/supabase.js';
import {
  Activity, Bell, BookOpen, CalendarDays, Check, ChevronRight, Droplets,
  Fish, HeartPulse, Home, Menu, MessageCircle, Plus, Search, Settings,
  Sparkles, Thermometer, Waves, X
} from 'lucide-react';

const initialTanks = [];
const initialFish = [];
const initialTasks = [];
const initialPosts = [];

function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function Dashboard({ user, onSignOut }) {
  const [section, setSection] = useState('Início');
  const [tanks, setTanks] = useState(initialTanks);
  const [fishList, setFishList] = useState(initialFish);
  const [tasks, setTasks] = useState(initialTasks);
  const [posts, setPosts] = useState(initialPosts);
  const [dataLoading, setDataLoading] = useState(true);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadWorkspace() {
      setDataLoading(true);
      const [tankResult, fishResult, taskResult, postResult, profileResult] = await Promise.all([
        supabase.from('aquariums').select('*').order('created_at', { ascending: false }),
        supabase.from('fish').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id,display_name')
      ]);
      const failure = tankResult.error || fishResult.error || taskResult.error || postResult.error || profileResult.error;
      if (failure) {
        console.error('Erro ao carregar dados do AquaProFish:', failure);
        if (active) setSaveError('Não foi possível carregar todos os dados. Verifique sua conexão e tente atualizar.');
      } else if (active) {
        const dbTanks = tankResult.data || [];
        const dbFish = fishResult.data || [];
        setTanks(dbTanks.map(t => ({
          id: t.id, name: t.name,
          volume: t.volume_label || (t.volume_liters ? `${t.volume_liters} L` : 'Não informado'),
          temperature: t.temperature || '—', ph: t.ph || '—',
          fish: dbFish.filter(f => f.aquarium_id === t.id).reduce((n, f) => n + Number(f.quantity || 0), 0),
          status: t.status || 'Novo'
        })));
        setFishList(dbFish.map(f => ({
          id: f.id, name: f.name, species: f.species || 'Espécie não informada',
          tank: dbTanks.find(t => t.id === f.aquarium_id)?.name || 'Sem aquário',
          count: f.quantity || 1
        })));
        setTasks((taskResult.data || []).map(t => ({ id: t.id, title: t.title, detail: t.detail || '', done: t.completed })));
        const profiles = profileResult.data || [];
        setPosts((postResult.data || []).map(p => ({
          id: p.id, author: profiles.find(profile => profile.id === p.user_id)?.display_name || 'Aquarista',
          time: new Date(p.created_at).toLocaleString('pt-BR'), text: p.content, likes: p.likes || 0,
          tag: 'Comunidade'
        })));
        setSaveError('');
      }
      if (active) setDataLoading(false);
    }
    loadWorkspace();
    return () => { active = false; };
  }, [user?.id]);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState('');
  const [form, setForm] = useState({});
  const [mobileMenu, setMobileMenu] = useState(false);

  const save = (value, setter) => setter(value);

  const totalFish = useMemo(() => fishList.reduce((sum, item) => sum + Number(item.count || 0), 0), [fishList]);
  const navItems = [
    { label: 'Início', icon: Home },
    { label: 'Aquários', icon: Waves },
    { label: 'Meus peixes', icon: Fish },
    { label: 'Rotina', icon: CalendarDays },
    { label: 'Comunidade', icon: MessageCircle },
    { label: 'Guia de espécies', icon: BookOpen }
  ];

  const openModal = (type) => { setForm({}); setModal(type); };
  const filteredFish = fishList.filter(f => (f.name + ' ' + f.species + ' ' + f.tank).toLowerCase().includes(query.toLowerCase()));

  async function submitTank(e) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    setSaveError('');
    const volumeNumber = Number(String(form.volume || '').replace(',', '.').match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || 0);
    const { data, error } = await supabase.from('aquariums').insert({
      user_id: user.id, name: form.name.trim(), volume_liters: volumeNumber || null,
      volume_label: form.volume || null, temperature: form.temperature || null, ph: form.ph || null, status: 'Novo'
    }).select().single();
    if (error) { setSaveError('Não foi possível salvar o aquário: ' + error.message); return; }
    setTanks([...tanks, { id: data.id, name: data.name, volume: data.volume_label || (data.volume_liters ? `${data.volume_liters} L` : 'Não informado'), temperature: data.temperature || '—', ph: data.ph || '—', fish: 0, status: data.status }]);
    setModal('');
  }

  async function submitFish(e) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    setSaveError('');
    const selectedTank = tanks.find(t => t.name.toLowerCase() === String(form.tank || '').trim().toLowerCase());
    const quantity = Math.max(1, Number(form.count || 1));
    const { data, error } = await supabase.from('fish').insert({
      user_id: user.id, aquarium_id: selectedTank?.id || null, name: form.name.trim(),
      species: form.species || null, quantity
    }).select().single();
    if (error) { setSaveError('Não foi possível salvar o peixe: ' + error.message); return; }
    setFishList([{ id: data.id, name: data.name, species: data.species || 'Espécie não informada', tank: selectedTank?.name || 'Sem aquário', count: data.quantity }, ...fishList]);
    if (selectedTank) setTanks(tanks.map(t => t.id === selectedTank.id ? { ...t, fish: t.fish + quantity } : t));
    setModal('');
  }

  async function submitPost(e) {
    e.preventDefault();
    if (!form.text?.trim()) return;
    setSaveError('');
    const { data, error } = await supabase.from('posts').insert({
      user_id: user.id, content: form.text.trim()
    }).select().single();
    if (error) { setSaveError('Não foi possível publicar: ' + error.message); return; }
    setPosts([{ id: data.id, author: user.user_metadata?.display_name || user.email || 'Você', time: 'Agora', text: data.content, likes: 0, tag: 'Comunidade' }, ...posts]);
    setModal('');
  }

  async function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const completed = !task.done;
    const { error } = await supabase.from('tasks').update({ completed }).eq('id', id);
    if (error) { setSaveError('Não foi possível atualizar a tarefa: ' + error.message); return; }
    save(tasks.map(t => t.id === id ? { ...t, done: completed } : t), setTasks);
  }

  const title = section === 'Início' ? 'Seu mundo aquático em um só lugar' : section;
  const subtitle = section === 'Início' ? 'Acompanhe seus aquários, peixes e cuidados diários.' : 'Organize e acompanhe seu aquarismo.';

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <img className="brand-logo" src="/AquaProFish/aquaprofish-logo.svg" alt="AquaProFish — Gestão, Criação e Comunidade" />
          <button className="mobile-close" onClick={() => setMobileMenu(false)} aria-label="Fechar menu"><X size={20}/></button>
        </div>
        <div className="nav-caption">MENU PRINCIPAL</div>
        <nav>
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={section === label ? 'nav-item active' : 'nav-item'} onClick={() => { setSection(label); setMobileMenu(false); }}>
              <Icon size={19} /><span>{label}</span>{label === 'Comunidade' && <span className="soon-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><Sparkles size={18}/><strong>Um aquário saudável começa com bons cuidados.</strong><span>Registre, acompanhe e evolua.</span></div>
          <button className="nav-item"><Settings size={19}/><span>Configurações</span></button>
          <div className="profile"><div className="avatar">A</div><div><strong>Aquarista</strong><small>Minha conta</small></div></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setMobileMenu(true)} aria-label="Abrir menu"><Menu/></button>
          <div className="breadcrumb">AquaProFish <ChevronRight size={14}/> <strong>{section}</strong></div>
          <div className="top-actions"><span className="user-email">{user?.email}</span><button className="auth-logout" onClick={onSignOut}>Sair</button><span className="status-pill"><i/> Conta conectada</span><button className="icon-button" aria-label="Notificações"><Bell size={19}/></button><div className="avatar small">A</div></div>
        </header>

        <div className="content">
          {saveError && <div className="note" role="alert">{saveError}</div>}
          {dataLoading && <p className="note">Carregando seus dados salvos...</p>}
          <div className="page-heading"><div><div className="eyebrow">AQUAPROFISH</div><h1>{title}</h1><p>{subtitle}</p></div>
            {section === 'Aquários' && <button className="primary-button" onClick={() => openModal('tank')}><Plus size={18}/> Novo aquário</button>}
            {section === 'Meus peixes' && <button className="primary-button" onClick={() => openModal('fish')}><Plus size={18}/> Cadastrar peixe</button>}
            {section === 'Comunidade' && <button className="primary-button" onClick={() => openModal('post')}><Plus size={18}/> Publicar</button>}
          </div>

          {section === 'Início' && <>
            <section className="welcome-banner"><div className="banner-copy"><span className="banner-kicker">BEM-VINDO AO AQUAPROFISH</span><h2>Mais cuidado para seus peixes.<br/><em>Mais vida para seu aquário.</em></h2><p>Tenha o controle da sua criação e acompanhe cada evolução.</p><button onClick={() => setSection('Aquários')} className="banner-button">Explorar meus aquários <ChevronRight size={17}/></button></div><div className="banner-art"><div className="bubble b1"/><div className="bubble b2"/><div className="bubble b3"/><Fish className="hero-fish f1"/><Fish className="hero-fish f2"/><Fish className="hero-fish f3"/><Waves className="hero-waves"/></div></section>
            <div className="section-title"><div><h2>Visão geral</h2><p>Resumo do seu ambiente aquático</p></div><span className="date-label"><CalendarDays size={15}/> Hoje</span></div>
            <div className="stats-grid">
              <Stat icon={Waves} label="Meus aquários" value={tanks.length} note="Ambientes cadastrados" tone="blue"/>
              <Stat icon={Fish} label="Total de peixes" value={totalFish} note="Peixes registrados" tone="cyan"/>
              <Stat icon={Activity} label="Tarefas pendentes" value={tasks.filter(t => !t.done).length} note="Cuidados para hoje" tone="purple"/>
              <Stat icon={HeartPulse} label="Saúde dos aquários" value={tanks.filter(t => t.status === 'Estável').length + '/' + tanks.length} note="Marcados como estáveis" tone="green"/>
            </div>
            <div className="dashboard-grid">
              <section className="panel"><div className="panel-heading"><div><h3>Meus aquários</h3><p>Resumo dos seus ambientes</p></div><button className="text-button" onClick={() => setSection('Aquários')}>Ver todos <ChevronRight size={15}/></button></div>
                <div className="tank-list">{tanks.slice(0,3).map(t => <div className="tank-row" key={t.id}><div className="tank-icon"><Waves size={21}/></div><div className="tank-info"><strong>{t.name}</strong><small>{t.volume} • {t.fish} peixes</small></div><span className={t.status === 'Atenção' ? 'tag warning' : 'tag success'}>{t.status}</span></div>)}</div>
              </section>
              <section className="panel"><div className="panel-heading"><div><h3>Cuidados de hoje</h3><p>Não deixe a rotina passar</p></div><button className="text-button" onClick={() => setSection('Rotina')}>Ver rotina <ChevronRight size={15}/></button></div>
                <div className="task-list">{tasks.slice(0,3).map(t => <label className={`task-row ${t.done ? 'task-done' : ''}`} key={t.id}><input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)}/><span className="custom-check"><Check size={13}/></span><span className="task-copy"><strong>{t.title}</strong><small>{t.detail}</small></span></label>)}</div>
              </section>
            </div>
          </>}

          {section === 'Aquários' && <section className="panel page-panel"><div className="panel-heading"><div><h3>Ambientes cadastrados</h3><p>Seus aquários e parâmetros atuais</p></div><span className="count-label">{tanks.length} cadastrados</span></div>{tanks.length ? <div className="tank-cards">{tanks.map(t => <article className="tank-card" key={t.id}><div className="tank-card-top"><div className="tank-icon large"><Waves size={24}/></div><span className={t.status === 'Atenção' ? 'tag warning' : 'tag success'}>{t.status}</span></div><h3>{t.name}</h3><div className="tank-volume">{t.volume}</div><div className="parameter-grid"><div><Thermometer size={16}/><span>Temperatura</span><strong>{t.temperature}</strong></div><div><Activity size={16}/><span>pH</span><strong>{t.ph}</strong></div><div><Fish size={16}/><span>Peixes</span><strong>{t.fish}</strong></div></div></article>)}</div> : <Empty title="Nenhum aquário cadastrado" text="Adicione seu primeiro aquário para começar."/>}</section>}

          {section === 'Meus peixes' && <section className="panel page-panel"><div className="panel-heading"><div><h3>Cadastro de peixes</h3><p>Pesquise e acompanhe seus animais</p></div><div className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar peixe..."/></div></div><div className="fish-table"><div className="table-head"><span>PEIXE / VARIEDADE</span><span>ESPÉCIE</span><span>AQUÁRIO</span><span>QUANTIDADE</span></div>{filteredFish.map(f => <div className="table-row" key={f.id}><div className="fish-name"><div className="fish-avatar"><Fish size={19}/></div><strong>{f.name}</strong></div><span>{f.species}</span><span>{f.tank}</span><strong>{f.count}</strong></div>)}{!filteredFish.length && <Empty title="Nenhum peixe encontrado" text="Tente outro termo de busca ou cadastre um peixe."/>}</div></section>}

          {section === 'Rotina' && <section className="panel page-panel"><div className="panel-heading"><div><h3>Rotina de cuidados</h3><p>Marque as atividades conforme forem concluídas</p></div><span className="count-label">{tasks.filter(t=>t.done).length} de {tasks.length} concluídas</span></div><div className="progress-track"><div style={{width: (tasks.length ? tasks.filter(t=>t.done).length/tasks.length*100 : 0) + '%'}}/></div><div className="routine-list">{tasks.map(t => <label className={`task-row routine-task ${t.done ? 'task-done' : ''}`} key={t.id}><input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)}/><span className="custom-check"><Check size={13}/></span><span className="task-copy"><strong>{t.title}</strong><small>{t.detail}</small></span><span className={t.done ? 'tag success' : 'tag warning'}>{t.done ? 'Concluída' : 'Pendente'}</span></label>)}</div><p className="note">Nesta primeira versão, as tarefas são salvas neste dispositivo. Lembretes automáticos serão adicionados na próxima etapa.</p></section>}

          {section === 'Comunidade' && <section className="community-layout"><div className="community-intro"><div className="community-icon"><MessageCircle size={25}/></div><div><h2>Uma comunidade que compartilha conhecimento.</h2><p>Em breve: fotos dos aquários, publicações, comentários e conversas entre aquaristas.</p></div></div><div className="feed">{posts.map(post => <article className="panel post-card" key={post.id}><div className="post-author"><div className="avatar">{post.author === 'Você' ? 'V' : 'A'}</div><div><strong>{post.author}</strong><small>{post.time} • {post.tag}</small></div></div><p>{post.text}</p><div className="post-actions"><span><HeartPulse size={16}/> {post.likes} curtidas</span><span><MessageCircle size={16}/> Comentários em breve</span></div></article>)}</div><p className="note">As publicações são salvas na sua conta. Fotos e comentários serão adicionados na próxima etapa.</p></section>}

          {section === 'Guia de espécies' && <section className="panel page-panel"><div className="panel-heading"><div><h3>Conheça as espécies</h3><p>Uma base inicial para organizar seu conhecimento</p></div><span className="tag info">Em expansão</span></div><div className="species-grid">{[['Guppy','Poecilia reticulata','Peixe vivíparo, ativo e muito apreciado pela variedade de cores.'],['Betta','Betta splendens','Peixe de personalidade marcante. Machos geralmente devem ser mantidos separados.'],['Platy','Xiphophorus maculatus','Vivíparo resistente e sociável, com muitas variedades.'],['Espada','Xiphophorus hellerii','Vivíparo conhecido pela extensão da nadadeira caudal dos machos.'],['Molinésia','Poecilia sphenops','Peixe vivíparo que aprecia água estável e alimentação variada.']].map(([name,latin,desc])=><article className="species-card" key={name}><div className="species-illustration"><Fish size={32}/></div><div><h3>{name}</h3><i>{latin}</i><p>{desc}</p></div></article>)}</div></section>}
        </div>
        <footer className="footer"><span className="footer-brand">AquaProFish · Gestão • Criação • Comunidade</span><span className="footer-developer">Desenvolvedor: <strong>Andrino Morales Botelho</strong></span><span>© 2026 AquaProFish. Todos os direitos reservados.</span></footer>
      </main>

      {mobileMenu && <button className="mobile-scrim" onClick={() => setMobileMenu(false)} aria-label="Fechar menu"/>}

      {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(''); }}><form className="modal" onSubmit={modal === 'tank' ? submitTank : modal === 'fish' ? submitFish : submitPost}><div className="modal-heading"><div><span className="eyebrow">AQUAPROFISH</span><h2>{modal === 'tank' ? 'Adicionar aquário' : modal === 'fish' ? 'Cadastrar peixe' : 'Nova publicação'}</h2></div><button type="button" className="icon-button" onClick={() => setModal('')}><X size={19}/></button></div>
        {modal === 'tank' && <><Field label="Nome do aquário *" value={form.name || ''} onChange={v=>setForm({...form,name:v})} placeholder="Ex.: Aquário da sala"/><div className="form-two"><Field label="Volume" value={form.volume || ''} onChange={v=>setForm({...form,volume:v})} placeholder="Ex.: 100 L"/><Field label="Temperatura" value={form.temperature || ''} onChange={v=>setForm({...form,temperature:v})} placeholder="Ex.: 26 °C"/></div><Field label="pH atual" value={form.ph || ''} onChange={v=>setForm({...form,ph:v})} placeholder="Ex.: 7,0"/></>}
        {modal === 'fish' && <><Field label="Nome / variedade *" value={form.name || ''} onChange={v=>setForm({...form,name:v})} placeholder="Ex.: Guppy Full Red"/><Field label="Espécie" value={form.species || ''} onChange={v=>setForm({...form,species:v})} placeholder="Ex.: Poecilia reticulata"/><div className="form-two"><Field label="Aquário" value={form.tank || ''} onChange={v=>setForm({...form,tank:v})} placeholder="Nome do aquário"/><Field label="Quantidade" value={form.count || '1'} onChange={v=>setForm({...form,count:v})} placeholder="1" type="number"/></div></>}
        {modal === 'post' && <Field label="O que você gostaria de compartilhar?" value={form.text || ''} onChange={v=>setForm({...form,text:v})} placeholder="Conte uma experiência ou faça uma pergunta..." area/>}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setModal('')}>Cancelar</button><button type="submit" className="primary-button"><Plus size={17}/> Salvar</button></div>
      </form></div>}
    </div>
  );
}

function Stat({ icon: Icon, label, value, note, tone }) {
  return <article className="stat-card"><div className={'stat-icon '+tone}><Icon size={20}/></div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}
function Field({ label, value, onChange, placeholder, type='text', area=false }) {
  return <label className="field"><span>{label}</span>{area ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows="4"/> : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}</label>;
}
function Empty({ title, text }) { return <div className="empty-state"><Fish size={28}/><strong>{title}</strong><span>{text}</span></div>; }

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  if (loading) return <main className="auth-screen"><p className="auth-loading">Carregando AquaProFish...</p></main>;
  if (!session) return <Auth />;
  return <Dashboard user={session.user} onSignOut={() => supabase.auth.signOut()} />;
}
export default App;
