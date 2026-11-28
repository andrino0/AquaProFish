import { useEffect, useMemo, useRef, useState } from 'react';
import Auth from './Auth.jsx';
import { Capacitor } from '@capacitor/core';
import { supabase } from './lib/supabase.js';
import {
  Activity, Bell, BookOpen, CalendarDays, Check, ChevronRight, Download, Droplets, Egg,
  Fish, Heart, HeartPulse, Home, Menu, MessageCircle, Pencil, Plus, Search, Settings, Trash2,
  Sparkles, Thermometer, Waves, X, Copy
} from 'lucide-react';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.145';
const APK_DOWNLOAD_URL = 'https://github.com/andrino0/AquaProFish/releases/download/apk-latest/AquaProFish.apk';
function isVersionNewer(latest, installed) {
  const a = String(latest).split('.').map(Number);
  const b = String(installed).split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
}

const initialTanks = [];
const initialFish = [];
const initialTasks = [];
const initialPosts = [];
const taskCategories = [
  { value: 'tpa', label: 'TPA / troca parcial', icon: '💧' },
  { value: 'feeding', label: 'Alimentação', icon: '🍽️' },
  { value: 'filter_cleaning', label: 'Limpeza do filtro', icon: '🧽' },
  { value: 'media_replacement', label: 'Troca de mídias', icon: '🔄' },
  { value: 'water_test', label: 'Teste da água', icon: '🧪' },
  { value: 'health', label: 'Saúde dos peixes', icon: '🐟' },
  { value: 'other', label: 'Outros cuidados', icon: '📌' }
];

const speciesGuide = [
  {
    name: 'Guppy', latin: 'Poecilia reticulata',
    image: 'https://raw.githubusercontent.com/andrino0/AquaProFish/main/public/guppy-g2-ai-small.webp', photoCredit: 'Imagem ilustrativa criada para o AquaProFish',
    summary: 'Pequeno vivíparo, ativo e famoso pela variedade de cores e caudas.',
    origin: 'América do Sul e Caribe; ocorre naturalmente em diferentes ambientes de água doce.',
    size: 'Machos geralmente 2–3 cm; fêmeas podem chegar a cerca de 5–6 cm.',
    temperature: '22–28 °C', ph: '6,8–7,8', hardness: 'Moderadamente dura a dura',
    aquarium: 'A partir de 40 L para um pequeno grupo, com filtragem e manutenção estáveis.',
    food: 'Onívoro: ração de boa qualidade, complementada com alimento congelado ou vivo apropriado e vegetais.',
    behavior: 'Pacífico e bastante ativo. Manter mais fêmeas que machos ajuda a reduzir o assédio constante às fêmeas.',
    compatibility: 'Convive com espécies pequenas e pacíficas de parâmetros semelhantes. Evite peixes grandes ou que mordam nadadeiras.',
    reproduction: 'É vivíparo: a fêmea libera filhotes já formados. Reproduz-se com facilidade e pode superpovoar o aquário.',
    facts: 'As cores e formatos das caudas foram selecionados por criadores ao longo de muitas gerações. Populações selvagens costumam ter aparência mais discreta.',
    care: 'Evite superlotação e mudanças bruscas de água. Quarentene novos peixes e mantenha a proporção entre machos e fêmeas.'
  },
  {
    name: 'Betta', latin: 'Betta splendens',
    image: 'https://raw.githubusercontent.com/andrino0/AquaProFish/main/public/betta-b3-ai-small.webp', photoCredit: 'Imagem ilustrativa criada para o AquaProFish',
    summary: 'Peixe labirintídeo conhecido pelas cores, nadadeiras e comportamento territorial.',
    origin: 'Sudeste Asiático, especialmente Tailândia e regiões próximas; habita águas rasas e lentas.',
    size: 'Em geral 5–7 cm, sem contar variações de nadadeiras.',
    temperature: '25–28 °C', ph: '6,5–7,5', hardness: 'Baixa a moderada',
    aquarium: 'Prefira aquário de pelo menos 20 L para um exemplar, aquecido, filtrado suavemente e com acesso fácil à superfície.',
    food: 'Predominantemente carnívoro: ração específica de qualidade e pequenas porções de alimentos apropriados ricos em proteína.',
    behavior: 'Machos são territoriais e não devem ser mantidos juntos. Fêmeas também podem apresentar agressividade; convivência exige experiência e espaço.',
    compatibility: 'A opção mais segura é mantê-lo sozinho. Companheiros só devem ser considerados em aquário adequado, com espécies tranquilas e monitoramento.',
    reproduction: 'O macho constrói ninho de bolhas; a reprodução exige preparação, aquário próprio e manejo dos filhotes.',
    facts: 'Possui órgão labirinto, que permite respirar ar atmosférico na superfície. Isso não substitui água limpa e aquário bem cuidado.',
    care: 'Não use potes minúsculos. Evite correnteza forte, temperaturas baixas e decoração pontiaguda que possa rasgar as nadadeiras.'
  },
  {
    name: 'Platy', latin: 'Xiphophorus maculatus',
    image: 'https://raw.githubusercontent.com/andrino0/AquaProFish/main/public/plati-p1-wagtail.jpg', photoCredit: 'Fred quatro14 brazil · domínio público · Wikimedia Commons',
    summary: 'Vivíparo sociável, resistente e disponível em muitas cores.',
    origin: 'América Central, em águas doces e ambientes de correnteza fraca.',
    size: 'Cerca de 4–6 cm.',
    temperature: '22–26 °C', ph: '7,0–8,2', hardness: 'Moderada a dura',
    aquarium: 'A partir de 60 L para um grupo pequeno, com plantas e espaço para natação.',
    food: 'Onívoro: ração variada, alimentos vegetais e pequenas porções de alimentos congelados apropriados.',
    behavior: 'Geralmente pacífico e ativo. Prefira grupos com mais fêmeas que machos para reduzir perseguições.',
    compatibility: 'Pode conviver com outros peixes pacíficos que apreciem água semelhante. Evite predadores e espécies agressivas.',
    reproduction: 'Vivíparo e prolífico. Filhotes podem aparecer regularmente quando há machos e fêmeas no mesmo aquário.',
    facts: 'Há muitas linhagens ornamentais, com padrões e cores bastante diferentes da forma selvagem.',
    care: 'Acompanhe a dureza da água, evite superlotação e planeje o destino dos filhotes para não sobrecarregar o aquário.'
  },
  {
    name: 'Espada', latin: 'Xiphophorus hellerii',
    image: 'https://raw.githubusercontent.com/andrino0/AquaProFish/main/public/espada-e1-vermelho.jpg', photoCredit: 'Wojciech J. Płuciennik · CC BY-SA 4.0 · Wikimedia Commons',
    summary: 'Vivíparo ativo; o macho costuma apresentar uma extensão em forma de espada na cauda.',
    origin: 'México e América Central, em rios e águas doces variadas.',
    size: 'Geralmente 8–12 cm; machos podem parecer maiores por causa da extensão caudal.',
    temperature: '22–28 °C', ph: '7,0–8,0', hardness: 'Moderada a dura',
    aquarium: 'A partir de 80 L para um grupo, pois são nadadores ativos e precisam de comprimento para nadar.',
    food: 'Onívoro: ração de qualidade, vegetais e complementos congelados ou vivos apropriados.',
    behavior: 'Ativo; machos podem disputar território e perseguir fêmeas. Mantenha mais fêmeas que machos.',
    compatibility: 'Prefira peixes pacíficos de porte e parâmetros compatíveis. Evite espécies muito pequenas ou lentas se houver perseguição.',
    reproduction: 'Vivíparo; fêmeas podem armazenar esperma e produzir várias ninhadas após uma única fecundação.',
    facts: 'A famosa “espada” é uma extensão dos raios inferiores da nadadeira caudal dos machos.',
    care: 'Ofereça espaço para natação, tampa segura e água estável. Considere o tamanho adulto antes de escolher o aquário.'
  },
  {
    name: 'Molinésia', latin: 'Poecilia sphenops',
    image: 'https://raw.githubusercontent.com/andrino0/AquaProFish/main/public/molin%C3%A9sia-m3-gold-dust.jpg', photoCredit: 'Marrabbio · CC BY-SA 3.0 · Wikimedia Commons',
    summary: 'Vivíparo robusto, com grande variedade de formas e cores.',
    origin: 'México e América Central; algumas populações vivem em águas com diferentes níveis de salinidade.',
    size: 'Em geral 6–10 cm, dependendo da variedade e da linhagem.',
    temperature: '24–28 °C', ph: '7,0–8,2', hardness: 'Moderada a dura',
    aquarium: 'A partir de 80 L para um grupo pequeno; variedades maiores podem precisar de mais espaço.',
    food: 'Onívora com forte componente vegetal: ração variada, spirulina e vegetais apropriados.',
    behavior: 'Geralmente pacífica e ativa. Mais fêmeas que machos ajuda a diminuir o estresse por perseguição.',
    compatibility: 'Escolha companheiros pacíficos que aceitem água mais mineralizada e alcalina. Não misture espécies incompatíveis só por aparência.',
    reproduction: 'Vivípara e pode reproduzir-se com frequência em aquários comunitários.',
    facts: 'Nem toda molinésia tem as mesmas exigências: variedades como a molinésia-sailfin podem crescer mais e demandar aquários maiores.',
    care: 'É especialmente importante manter água limpa, estável e com mineralização adequada. Não adicione sal automaticamente: avalie as necessidades dos habitantes.'
  }
];

function nextRecurringDate(value, recurrence) {
  const now = new Date();
  const scheduled = value ? new Date(value) : now;
  const date = scheduled > now ? scheduled : now;
  if (recurrence === 'daily') date.setDate(date.getDate() + 1);
  else if (recurrence === 'weekly') date.setDate(date.getDate() + 7);
  else if (recurrence === 'monthly') {
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, lastDay));
  }
  return date.toISOString();
}

function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function Dashboard({ user, onSignOut }) {
  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Aquarista';
  const avatarInitial = String(displayName).trim().charAt(0).toUpperCase() || 'A';
  const [section, setSection] = useState('Início');
  const [tanks, setTanks] = useState(initialTanks);
  const [fishList, setFishList] = useState(initialFish);
  const [tasks, setTasks] = useState(initialTasks);
  const [waterTests, setWaterTests] = useState([]);
  const [breedingBatches, setBreedingBatches] = useState([]);
  const [fryObservations, setFryObservations] = useState([]);
  const [waterForm, setWaterForm] = useState({ aquariumId: '', testedAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16), temperature: '', ph: '', ammonia: '', nitrite: '', nitrate: '', notes: '' });
  const [posts, setPosts] = useState(initialPosts);
  const [dataLoading, setDataLoading] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [likeBusy, setLikeBusy] = useState({});
  const [pixCopied, setPixCopied] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [availableVersion, setAvailableVersion] = useState('');
  const [updateCheckMessage, setUpdateCheckMessage] = useState('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const confirmResolver = useRef(null);

  function confirmAction(message) {
    return new Promise(resolve => {
      confirmResolver.current = resolve;
      setConfirmDialog(message);
    });
  }

  function finishConfirmation(confirmed) {
    const resolve = confirmResolver.current;
    confirmResolver.current = null;
    setConfirmDialog(null);
    if (resolve) resolve(confirmed);
  }

  useEffect(() => {
    let active = true;
    async function checkForUpdates() {
      setCheckingUpdate(true);
      setUpdateCheckMessage('');
      try {
        const response = await fetch('https://api.github.com/repos/andrino0/AquaProFish/releases/tags/apk-latest', {
          headers: { Accept: 'application/vnd.github+json' },
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('Não foi possível consultar a versão mais recente.');
        const release = await response.json();
        const versionText = String(release.body || '').match(/Versão: ([0-9.]+)/i);
        const latest = versionText?.[1] || '';
        const newer = latest && isVersionNewer(latest, APP_VERSION);
        if (active) {
          setAvailableVersion(newer ? latest : '');
          setUpdateCheckMessage(newer ? '' : 'Você já está usando a versão mais recente.');
        }
      } catch (error) {
        if (active) setUpdateCheckMessage('Não foi possível verificar agora. Tente novamente mais tarde.');
      } finally {
        if (active) setCheckingUpdate(false);
      }
    }
    checkForUpdates();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('aquaprofish:community:online', {
      config: { private: true }
    });
    channel.on('presence', { event: 'sync' }, () => {
      const current = Object.values(channel.presenceState()).flat();
      const uniqueUsers = new Map();
      current.forEach(person => {
        if (person.user_id) uniqueUsers.set(person.user_id, person);
      });
      setOnlineUsers(Array.from(uniqueUsers.values()).sort((a, b) =>
        String(a.display_name || '').localeCompare(String(b.display_name || ''), 'pt-BR')
      ));
    });
    channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        const displayName = user.user_metadata?.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Aquarista';
        const { error } = await channel.track({
          user_id: user.id,
          display_name: String(displayName).slice(0, 80),
          online_at: new Date().toISOString()
        });
        if (error) console.error('Não foi possível atualizar presença:', error);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('Erro na presença online do AquaProFish:', status);
      }
    });
    return () => {
      setOnlineUsers([]);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    async function loadWorkspace() {
      setDataLoading(true);
      const [tankResult, fishResult, taskResult, postResult, profileResult, likeResult, commentResult, waterResult, breedingResult, fryResult] = await Promise.all([
        supabase.from('aquariums').select('*').order('created_at', { ascending: false }),
        supabase.from('fish').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id,display_name'),
        supabase.from('post_likes').select('post_id,user_id'),
        supabase.from('post_comments').select('*').order('created_at', { ascending: true }),
        supabase.from('water_tests').select('*').order('tested_at', { ascending: false }),
        supabase.from('breeding_batches').select('*').order('birth_date', { ascending: false }),
        supabase.from('fry_observations').select('*').order('observed_at', { ascending: false })
      ]);
      const failure = tankResult.error || fishResult.error || taskResult.error || postResult.error || profileResult.error || likeResult.error || commentResult.error || waterResult.error || breedingResult.error || fryResult.error;
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
          id: f.id, aquariumId: f.aquarium_id || '', name: f.name, species: f.species || 'Espécie não informada',
          tank: dbTanks.find(t => t.id === f.aquarium_id)?.name || 'Sem aquário',
          count: f.quantity || 1
        })));
        setTasks((taskResult.data || []).map(t => ({ id: t.id, title: t.title, detail: t.detail || '', dueDate: t.due_date || '', recurrence: t.recurrence || 'none', generatedFrom: t.generated_from || null, category: t.category || 'other', aquariumId: t.aquarium_id || '', done: t.completed })));
        const profiles = profileResult.data || [];
        const likes = likeResult.data || [];
        const comments = commentResult.data || [];
        setPosts((postResult.data || []).map(p => ({
          id: p.id, userId: p.user_id, author: profiles.find(profile => profile.id === p.user_id)?.display_name || 'Aquarista',
          time: new Date(p.created_at).toLocaleString('pt-BR'), text: p.content,
          likes: likes.filter(like => like.post_id === p.id).length,
          likedByMe: likes.some(like => like.post_id === p.id && like.user_id === user.id),
          comments: comments.filter(comment => comment.post_id === p.id).map(comment => ({
            id: comment.id, userId: comment.user_id,
            author: profiles.find(profile => profile.id === comment.user_id)?.display_name || (comment.user_id === user.id ? (user.user_metadata?.display_name || 'Você') : 'Aquarista'),
            text: comment.content, time: new Date(comment.created_at).toLocaleString('pt-BR')
          })),
          tag: 'Comunidade'
        })));
        setWaterTests((waterResult.data || []).map(test => ({ ...test })));
        setBreedingBatches((breedingResult.data || []).map(batch => ({ ...batch })));
        setFryObservations((fryResult.data || []).map(observation => ({ ...observation })));
        setSaveError('');
      }
      if (active) setDataLoading(false);
    }
    loadWorkspace();
    return () => { active = false; };
  }, [user?.id]);
  const [query, setQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
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
    { label: 'Qualidade da água', icon: Droplets },
    { label: 'Reprodução e alevinos', icon: Egg },
    { label: 'Comunidade', icon: MessageCircle },
    { label: 'Guia de espécies', icon: BookOpen },
    { label: 'Apoie o AquaProFish', icon: Heart },
    { label: 'Configurações', icon: Settings }
  ];

  const openModal = (type) => { setForm({}); setModal(type); };
  const filteredFish = fishList.filter(f => (f.name + ' ' + f.species + ' ' + f.tank).toLowerCase().includes(query.toLowerCase()));

  function editTank(tank) {
    setForm({ id: tank.id, name: tank.name, volume: tank.volume === 'Não informado' ? '' : tank.volume, temperature: tank.temperature === '—' ? '' : tank.temperature, ph: tank.ph === '—' ? '' : tank.ph, status: tank.status || 'Novo' });
    setModal('editTank');
  }

  async function submitTank(e) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    setSaveError('');
    const volumeNumber = Number(String(form.volume || '').replace(',', '.').match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || 0);
    const values = { name: form.name.trim(), volume_liters: volumeNumber || null, volume_label: form.volume || null, temperature: form.temperature || null, ph: form.ph || null, status: form.status || 'Novo' };
    if (modal === 'editTank') {
      const { data, error } = await supabase.from('aquariums').update(values).eq('id', form.id).eq('user_id', user.id).select().single();
      if (error) { setSaveError('Não foi possível atualizar o aquário: ' + error.message); return; }
      setTanks(tanks.map(t => t.id === data.id ? { ...t, name: data.name, volume: data.volume_label || (data.volume_liters ? `${data.volume_liters} L` : 'Não informado'), temperature: data.temperature || '—', ph: data.ph || '—', status: data.status || 'Novo' } : t));
    } else {
      const { data, error } = await supabase.from('aquariums').insert({ user_id: user.id, ...values, status: 'Novo' }).select().single();
      if (error) { setSaveError('Não foi possível salvar o aquário: ' + error.message); return; }
      setTanks([...tanks, { id: data.id, name: data.name, volume: data.volume_label || (data.volume_liters ? `${data.volume_liters} L` : 'Não informado'), temperature: data.temperature || '—', ph: data.ph || '—', fish: 0, status: data.status }]);
    }
    setModal('');
  }

  function editFish(fish) {
    setForm({ id: fish.id, aquariumId: fish.aquariumId || '', name: fish.name, species: fish.species === 'Espécie não informada' ? '' : fish.species, tank: fish.tank === 'Sem aquário' ? '' : fish.tank, count: String(fish.count ?? 0) });
    setModal('editFish');
  }

  async function submitFish(e) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    setSaveError('');
    const selectedTank = tanks.find(t => t.id === (form.aquariumId || form.tank));
    const quantity = Math.max(0, Math.floor(Number(form.count ?? 0)));
    if (!Number.isFinite(quantity) || quantity < 1) { setSaveError('Informe a quantidade de peixes (mínimo 1).'); return; }
    const values = { aquarium_id: selectedTank?.id || null, name: form.name.trim(), species: form.species || null, quantity };
    if (modal === 'editFish') {
      const previousFish = fishList.find(f => f.id === form.id);
      const { data, error } = await supabase.from('fish').update(values).eq('id', form.id).eq('user_id', user.id).select().single();
      if (error) { setSaveError('Não foi possível atualizar o peixe: ' + error.message); return; }
      const updatedFish = { id: data.id, aquariumId: data.aquarium_id || '', name: data.name, species: data.species || 'Espécie não informada', tank: selectedTank?.name || 'Sem aquário', count: data.quantity };
      setFishList(fishList.map(f => f.id === data.id ? updatedFish : f));
      setTanks(tanks.map(t => {
        const before = previousFish?.aquariumId === t.id ? Number(previousFish.count || 0) : 0;
        const after = selectedTank?.id === t.id ? quantity : 0;
        return before || after ? { ...t, fish: Math.max(0, t.fish - before + after) } : t;
      }));
    } else {
      const { data, error } = await supabase.from('fish').insert({ user_id: user.id, ...values }).select().single();
      if (error) { setSaveError('Não foi possível salvar o peixe: ' + error.message); return; }
      setFishList([{ id: data.id, aquariumId: data.aquarium_id || '', name: data.name, species: data.species || 'Espécie não informada', tank: selectedTank?.name || 'Sem aquário', count: data.quantity }, ...fishList]);
      if (selectedTank) setTanks(tanks.map(t => t.id === selectedTank.id ? { ...t, fish: t.fish + quantity } : t));
    }
    setModal('');
  }

  function editTask(task) {
    const date = task.dueDate ? new Date(task.dueDate) : null;
    const localDate = date && !Number.isNaN(date.getTime()) ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
    setForm({ id: task.id, title: task.title, detail: task.detail || '', dueDate: localDate, recurrence: task.recurrence || 'none', category: task.category || 'other', aquariumId: task.aquariumId || '' });
    setModal('editTask');
  }

  async function submitTask(e) {
    e.preventDefault();
    if (!form.title?.trim()) return;
    setSaveError('');
    const values = { title: form.title.trim(), detail: form.detail || null, due_date: form.dueDate ? new Date(form.dueDate).toISOString() : null, recurrence: form.recurrence || 'none', category: form.category || 'other', aquarium_id: form.aquariumId || null };
    if (modal === 'editTask') {
      const { data, error } = await supabase.from('tasks').update(values).eq('id', form.id).eq('user_id', user.id).select().single();
      if (error) { setSaveError('Não foi possível atualizar a tarefa: ' + error.message); return; }
      setTasks(current => current.map(t => t.id === data.id ? { ...t, title: data.title, detail: data.detail || '', dueDate: data.due_date || '', recurrence: data.recurrence || 'none', category: data.category || 'other', aquariumId: data.aquarium_id || '' } : t));
    } else {
      const { data, error } = await supabase.from('tasks').insert({ user_id: user.id, ...values }).select().single();
      if (error) { setSaveError('Não foi possível salvar a tarefa: ' + error.message); return; }
      setTasks(current => [{ id: data.id, title: data.title, detail: data.detail || '', dueDate: data.due_date || '', recurrence: data.recurrence || 'none', category: data.category || 'other', aquariumId: data.aquarium_id || '', done: false }, ...current]);
    }
    setModal('');
  }

  async function submitWaterTest(e) {
    e.preventDefault();
    const numericFields = ['temperature', 'ph', 'ammonia', 'nitrite', 'nitrate'];
    const values = {};
    numericFields.forEach(field => {
      const raw = String(waterForm[field] ?? '').trim().replace(',', '.');
      values[field] = raw === '' ? null : Number(raw);
    });
    if (numericFields.every(field => values[field] === null)) {
      setSaveError('Informe pelo menos um parâmetro da água.');
      return;
    }
    if (numericFields.some(field => values[field] !== null && !Number.isFinite(values[field]))) {
      setSaveError('Confira os valores informados nos parâmetros.');
      return;
    }
    setSaveError('');
    const testedAt = waterForm.testedAt ? new Date(waterForm.testedAt).toISOString() : new Date().toISOString();
    const payload = {
      user_id: user.id,
      aquarium_id: waterForm.aquariumId || null,
      tested_at: testedAt,
      ...values,
      notes: waterForm.notes.trim() || null
    };
    const { data, error } = await supabase.from('water_tests').insert(payload).select().single();
    if (error) {
      setSaveError('Não foi possível salvar a medição: ' + error.message);
      return;
    }
    setWaterTests(current => [data, ...current]);
    setWaterForm({
      aquariumId: '',
      testedAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      temperature: '', ph: '', ammonia: '', nitrite: '', nitrate: '', notes: ''
    });
  }

  async function deleteWaterTest(test) {
    if (!(await confirmAction('Excluir esta medição da qualidade da água?'))) return;
    const { error } = await supabase.from('water_tests').delete().eq('id', test.id).eq('user_id', user.id);
    if (error) {
      setSaveError('Não foi possível excluir a medição: ' + error.message);
      return;
    }
    setWaterTests(current => current.filter(item => item.id !== test.id));
  }

  async function submitBrood(e) {
    e.preventDefault();
    if (!form.species?.trim() || !form.birthDate || !Number.isInteger(Number(form.fryCount)) || Number(form.fryCount) < 0) {
      setSaveError('Informe a espécie, a data do nascimento e uma quantidade válida de alevinos.');
      return;
    }
    setSaveError('');
    const { data, error } = await supabase.from('breeding_batches').insert({
      user_id: user.id, aquarium_id: form.aquariumId || null,
      species: form.species.trim(), variety: form.variety?.trim() || null,
      birth_date: form.birthDate, fry_count: Number(form.fryCount),
      female_parent: form.femaleParent?.trim() || null,
      male_parent: form.maleParent?.trim() || null,
      notes: form.notes?.trim() || null
    }).select().single();
    if (error) { setSaveError('Não foi possível salvar a cria: ' + error.message); return; }
    setBreedingBatches(current => [data, ...current]);
    setModal('');
  }

  async function submitFryObservation(e) {
    e.preventDefault();
    const quantity = Number(form.quantity);
    const sizeRaw = String(form.averageSizeMm ?? '').trim().replace(',', '.');
    const size = sizeRaw === '' ? null : Number(sizeRaw);
    if (!form.batchId || !form.observedAt || !Number.isInteger(quantity) || quantity < 0 || (size !== null && (!Number.isFinite(size) || size < 0))) {
      setSaveError('Confira a data, a quantidade e o tamanho médio informado.');
      return;
    }
    setSaveError('');
    const { data, error } = await supabase.from('fry_observations').insert({
      user_id: user.id, batch_id: form.batchId, observed_at: form.observedAt,
      quantity, average_size_mm: size, food: form.food?.trim() || null,
      notes: form.notes?.trim() || null
    }).select().single();
    if (error) { setSaveError('Não foi possível salvar o acompanhamento: ' + error.message); return; }
    setFryObservations(current => [data, ...current]);
    setModal('');
  }

  async function deleteBreedingBatch(batch) {
    if (!(await confirmAction('Excluir este registro de cria e todo o histórico de crescimento dos alevinos?'))) return;
    const { error } = await supabase.from('breeding_batches').delete().eq('id', batch.id).eq('user_id', user.id);
    if (error) { setSaveError('Não foi possível excluir o registro: ' + error.message); return; }
    setBreedingBatches(current => current.filter(item => item.id !== batch.id));
    setFryObservations(current => current.filter(item => item.batch_id !== batch.id));
  }

  async function deleteFryObservation(observation) {
    if (!(await confirmAction('Excluir este registro de crescimento?'))) return;
    const { error } = await supabase.from('fry_observations').delete().eq('id', observation.id).eq('user_id', user.id);
    if (error) { setSaveError('Não foi possível excluir o acompanhamento: ' + error.message); return; }
    setFryObservations(current => current.filter(item => item.id !== observation.id));
  }

  async function submitPost(e) {
    e.preventDefault();
    if (!form.text?.trim()) return;
    setSaveError('');
    const { data, error } = await supabase.from('posts').insert({
      user_id: user.id, content: form.text.trim()
    }).select().single();
    if (error) { setSaveError('Não foi possível publicar: ' + error.message); return; }
    setPosts([{ id: data.id, userId: user.id, author: user.user_metadata?.display_name || user.user_metadata?.name || 'Você', time: 'Agora', text: data.content, likes: 0, likedByMe: false, comments: [], tag: 'Comunidade' }, ...posts]);
    setModal('');
  }

  async function toggleLike(postId) {
    if (likeBusy[postId]) return;
    const post = posts.find(item => item.id === postId);
    if (!post) return;
    setLikeBusy(current => ({ ...current, [postId]: true }));
    setSaveError('');
    const request = post.likedByMe
      ? supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id)
      : supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    const { error } = await request;
    if (error) {
      setSaveError('Não foi possível registrar sua curtida: ' + error.message);
    } else {
      setPosts(current => current.map(item => item.id === postId ? {
        ...item, likedByMe: !item.likedByMe, likes: Math.max(0, item.likes + (item.likedByMe ? -1 : 1))
      } : item));
    }
    setLikeBusy(current => ({ ...current, [postId]: false }));
  }

  async function submitComment(postId) {
    const content = String(commentDrafts[postId] || '').trim();
    if (!content) return;
    setSaveError('');
    const { data, error } = await supabase.from('post_comments').insert({
      post_id: postId, user_id: user.id, content
    }).select().single();
    if (error) {
      setSaveError('Não foi possível publicar o comentário: ' + error.message);
      return;
    }
    const author = user.user_metadata?.display_name || user.user_metadata?.name || 'Você';
    setPosts(current => current.map(item => item.id === postId ? {
      ...item, comments: [...(item.comments || []), {
        id: data.id, userId: user.id, author, text: data.content,
        time: new Date(data.created_at).toLocaleString('pt-BR')
      }]
    } : item));
    setCommentDrafts(current => ({ ...current, [postId]: '' }));
    setExpandedComments(current => ({ ...current, [postId]: true }));
  }

  async function copyPixKey() {
    const key = '+5553991086944';
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(key);
        copied = true;
      }
    } catch { copied = false; }
    if (!copied) {
      try {
        const area = document.createElement('textarea');
        area.value = key;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.focus();
        area.select();
        area.setSelectionRange(0, area.value.length);
        copied = document.execCommand('copy');
        area.remove();
      } catch { copied = false; }
    }
    setPixCopied(copied);
    if (!copied) window.prompt('Copie a chave Pix abaixo:', key);
  }

  async function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const completed = !task.done;
    const { error } = await supabase.from('tasks').update({ completed }).eq('id', id).eq('user_id', user.id);
    if (error) { setSaveError('Não foi possível atualizar a tarefa: ' + error.message); return; }
    save(tasks.map(t => t.id === id ? { ...t, done: completed } : t), setTasks);
    if (completed && task.recurrence && task.recurrence !== 'none') {
      const nextDue = nextRecurringDate(task.dueDate, task.recurrence);
      const { data: nextTask, error: nextError } = await supabase.from('tasks').insert({
        user_id: user.id, title: task.title, detail: task.detail || null,
        due_date: nextDue, completed: false, recurrence: task.recurrence, generated_from: task.id, category: task.category || 'other', aquarium_id: task.aquariumId || null
      }).select().maybeSingle();
      if (nextError && nextError.code !== '23505') {
        setSaveError('A tarefa foi concluída, mas não foi possível criar a próxima repetição: ' + nextError.message);
      } else if (nextTask) {
        setTasks(current => [{ id: nextTask.id, title: nextTask.title, detail: nextTask.detail || '', dueDate: nextTask.due_date || '', recurrence: nextTask.recurrence || 'none', generatedFrom: nextTask.generated_from, category: nextTask.category || 'other', aquariumId: nextTask.aquarium_id || '', done: false }, ...current]);
      }
    }
  }
  async function deleteFish(fish) {
    if (!(await confirmAction('Excluir o peixe "' + fish.name + '"? Esta ação não pode ser desfeita.'))) return;
    setSaveError('');
    const { error } = await supabase.from('fish').delete().eq('id', fish.id).eq('user_id', user.id);
    if (error) { setSaveError('Não foi possível excluir o peixe: ' + error.message); return; }
    setFishList(current => current.filter(item => item.id !== fish.id));
    if (fish.aquariumId) setTanks(current => current.map(t => t.id === fish.aquariumId ? { ...t, fish: Math.max(0, t.fish - Number(fish.count || 0)) } : t));
  }

  async function deleteTank(tank) {
    const fishCount = fishList.filter(f => f.aquariumId === tank.id).length;
    const warning = fishCount ? ' O banco também excluirá os ' + fishCount + ' cadastro(s) de peixe vinculados a este aquário.' : '';
    if (!(await confirmAction('Excluir o aquário "' + tank.name + '"?' + warning + ' Esta ação não pode ser desfeita.'))) return;
    setSaveError('');
    const { error } = await supabase.from('aquariums').delete().eq('id', tank.id).eq('user_id', user.id);
    if (error) { setSaveError('Não foi possível excluir o aquário: ' + error.message); return; }
    setTanks(current => current.filter(item => item.id !== tank.id));
    setFishList(current => current.filter(item => item.aquariumId !== tank.id));
  }

  async function deleteTask(task) {
    if (!(await confirmAction('Excluir a tarefa "' + task.title + '"?'))) return;
    setSaveError('');
    const { error } = await supabase.from('tasks').delete().eq('id', task.id).eq('user_id', user.id);
    if (error) { setSaveError('Não foi possível excluir a tarefa: ' + error.message); return; }
    setTasks(current => current.filter(item => item.id !== task.id));
  }

  async function deletePost(post) {
    if (!(await confirmAction('Excluir esta publicação? As curtidas e os comentários vinculados também serão removidos.'))) return;
    setSaveError('');
    const { error } = await supabase.from('posts').delete().eq('id', post.id).eq('user_id', user.id);
    if (error) { setSaveError('Não foi possível excluir a publicação: ' + error.message); return; }
    setPosts(current => current.filter(item => item.id !== post.id));
  }

  async function deleteComment(postId, comment) {
    if (!(await confirmAction('Excluir seu comentário?'))) return;
    setSaveError('');
    const { error } = await supabase.from('post_comments').delete().eq('id', comment.id).eq('user_id', user.id);
    if (error) { setSaveError('Não foi possível excluir o comentário: ' + error.message); return; }
    setPosts(current => current.map(item => item.id === postId ? { ...item, comments: item.comments.filter(c => c.id !== comment.id) } : item));
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function exportBackup() {
    setBackupBusy(true);
    setSettingsMessage('');
    try {
      const [aquariums, fish, taskRows, postRows, likes, comments, waterTestRows, breedingRows, fryRows] = await Promise.all([
        supabase.from('aquariums').select('*').eq('user_id', user.id),
        supabase.from('fish').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('posts').select('*').eq('user_id', user.id),
        supabase.from('post_likes').select('*').eq('user_id', user.id),
        supabase.from('post_comments').select('*').eq('user_id', user.id),
        supabase.from('water_tests').select('*').eq('user_id', user.id),
        supabase.from('breeding_batches').select('*').eq('user_id', user.id),
        supabase.from('fry_observations').select('*').eq('user_id', user.id)
      ]);
      const failed = [aquariums, fish, taskRows, postRows, likes, comments, waterTestRows, breedingRows, fryRows].find(result => result.error);
      if (failed) throw failed.error;
      const backup = {
        app: 'AquaProFish',
        version: 1,
        exported_at: new Date().toISOString(),
        user_id: user.id,
        account: { email: user.email || '', display_name: displayName },
        data: {
          aquariums: aquariums.data || [],
          fish: fish.data || [],
          tasks: taskRows.data || [],
          posts: postRows.data || [],
          post_likes: likes.data || [],
          post_comments: comments.data || [],
          water_tests: waterTestRows.data || [],
          breeding_batches: breedingRows.data || [],
          fry_observations: fryRows.data || []
        }
      };
      const date = new Date().toISOString().slice(0, 10);
      downloadFile(JSON.stringify(backup, null, 2), 'aquaprofish-backup-' + date + '.json', 'application/json;charset=utf-8');
      setSettingsMessage('Backup criado. Guarde o arquivo em um local seguro.');
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      setSettingsMessage('Não foi possível criar o backup. Verifique a conexão e tente novamente.');
    } finally {
      setBackupBusy(false);
    }
  }

  async function exportCsv() {
    setBackupBusy(true);
    setSettingsMessage('');
    try {
      const [aquariums, fish, taskRows, postRows, waterTestRows, breedingRows, fryRows] = await Promise.all([
        supabase.from('aquariums').select('*').eq('user_id', user.id),
        supabase.from('fish').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('posts').select('*').eq('user_id', user.id),
        supabase.from('water_tests').select('*').eq('user_id', user.id),
        supabase.from('breeding_batches').select('*').eq('user_id', user.id),
        supabase.from('fry_observations').select('*').eq('user_id', user.id)
      ]);
      const failed = [aquariums, fish, taskRows, postRows, waterTestRows, breedingRows, fryRows].find(result => result.error);
      if (failed) throw failed.error;
      const tanksById = new Map((aquariums.data || []).map(tank => [tank.id, tank]));
      const rows = [
        ['Tipo', 'Nome', 'Detalhes', 'Aquário', 'Quantidade', 'Status', 'Prazo', 'Categoria e repetição'], 
        ...(aquariums.data || []).map(t => ['Aquário', t.name, [t.volume_label || t.volume_liters || '', t.temperature || '', t.ph || ''].filter(Boolean).join(' | '), '', '', t.status || '']),
        ...(fish.data || []).map(f => ['Peixe', f.name, f.species || '', tanksById.get(f.aquarium_id)?.name || 'Sem aquário', f.quantity ?? '', '']),
        ...(taskRows.data || []).map(t => ['Tarefa', t.title, t.detail || '', tanksById.get(t.aquarium_id)?.name || '', '', t.completed ? 'Concluída' : 'Pendente', t.due_date ? new Date(t.due_date).toLocaleString('pt-BR') : '', (taskCategories.find(c => c.value === t.category)?.label || 'Outros cuidados') + ' | ' + ({daily:'Diária',weekly:'Semanal',monthly:'Mensal'}[t.recurrence] || 'Não se repete')]),
        ...(postRows.data || []).map(p => ['Publicação', '', p.content || '', '', '', '']),
        ...(waterTestRows.data || []).map(t => ['Qualidade da água', t.aquarium_id ? (tanksById.get(t.aquarium_id)?.name || '') : 'Sem aquário', ['Temperatura: ' + (t.temperature ?? ''), 'pH: ' + (t.ph ?? ''), 'Amônia: ' + (t.ammonia ?? ''), 'Nitrito: ' + (t.nitrite ?? ''), 'Nitrato: ' + (t.nitrate ?? ''), t.notes || ''].filter(Boolean).join(' | '), '', '', '', t.tested_at ? new Date(t.tested_at).toLocaleString('pt-BR') : '']),
        ...(breedingRows.data || []).map(b => ['Cria / nascimento', b.species + (b.variety ? ' — ' + b.variety : ''), [b.female_parent ? 'Mãe: ' + b.female_parent : '', b.male_parent ? 'Pai: ' + b.male_parent : '', b.notes || ''].filter(Boolean).join(' | '), b.aquarium_id ? (tanksById.get(b.aquarium_id)?.name || '') : 'Sem aquário', b.fry_count, '', b.birth_date || '']),
        ...(fryRows.data || []).map(o => ['Crescimento de alevinos', breedingRows.data?.find(b => b.id === o.batch_id)?.species || '', [o.average_size_mm !== null ? 'Tamanho médio: ' + o.average_size_mm + ' mm' : '', o.food || '', o.notes || ''].filter(Boolean).join(' | '), '', o.quantity, '', o.observed_at || ''])
      ];
      const csv = '\uFEFF' + rows.map(row => row.map(value => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(';')).join('\r\n');
      const date = new Date().toISOString().slice(0, 10);
      downloadFile(csv, 'aquaprofish-dados-' + date + '.csv', 'text/csv;charset=utf-8');
      setSettingsMessage('Planilha CSV criada com aquários, peixes, tarefas, publicações, medições da água, crias e crescimento dos alevinos.');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      setSettingsMessage('Não foi possível criar a planilha. Verifique a conexão e tente novamente.');
    } finally {
      setBackupBusy(false);
    }
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!(await confirmAction('Importar este backup? Os registros serão adicionados à sua conta. Os dados atuais não serão apagados e registros com o mesmo identificador serão mantidos.'))) return;
    setBackupBusy(true);
    setSettingsMessage('');
    try {
      const backup = JSON.parse(await file.text());
      if (backup?.app !== 'AquaProFish' || backup?.version !== 1 || backup?.user_id !== user.id || !backup?.data) {
        throw new Error('Este arquivo não é um backup válido desta conta AquaProFish.');
      }
      const data = backup.data;
      const pickRows = (rows, fields) => (Array.isArray(rows) ? rows : []).filter(row => row && typeof row === 'object').map(row => {
        const clean = {};
        fields.forEach(field => { if (row[field] !== undefined) clean[field] = row[field]; });
        clean.user_id = user.id;
        return clean;
      });
      const aquariums = pickRows(data.aquariums, ['id','name','volume_liters','description','created_at','volume_label','temperature','ph','status']);
      const fish = pickRows(data.fish, ['id','aquarium_id','name','species','quantity','notes','created_at']);
      const taskRows = pickRows(data.tasks, ['id','title','due_date','completed','created_at','detail','recurrence','generated_from','category','aquarium_id']);
      const waterRows = pickRows(data.water_tests, ['id','aquarium_id','tested_at','temperature','ph','ammonia','nitrite','nitrate','notes','created_at']);
      const breedingRows = pickRows(data.breeding_batches, ['id','aquarium_id','species','variety','birth_date','fry_count','female_parent','male_parent','notes','created_at']);
      const fryRows = pickRows(data.fry_observations, ['id','batch_id','observed_at','quantity','average_size_mm','food','notes','created_at']);
      const postRows = pickRows(data.posts, ['id','content','image_url','created_at','likes']);
      const validIds = rows => rows.filter(row => row.id && row.id !== 'undefined');
      const restore = async (table, rows, conflict = 'id') => {
        if (!rows.length) return;
        const { error } = await supabase.from(table).upsert(rows, { onConflict: conflict, ignoreDuplicates: true });
        if (error) throw error;
      };
      await restore('aquariums', validIds(aquariums));
      await restore('fish', validIds(fish));
      await restore('water_tests', validIds(waterRows));
      await restore('breeding_batches', validIds(breedingRows));
      await restore('fry_observations', validIds(fryRows));
      await restore('tasks', validIds(taskRows));
      await restore('posts', validIds(postRows));
      const postIds = [...new Set([
        ...postRows.map(row => row.id),
        ...(Array.isArray(data.post_likes) ? data.post_likes.map(row => row?.post_id) : []),
        ...(Array.isArray(data.post_comments) ? data.post_comments.map(row => row?.post_id) : [])
      ].filter(Boolean))];
      let availablePostIds = new Set(postRows.map(row => row.id).filter(Boolean));
      if (postIds.length) {
        const { data: existingPosts, error } = await supabase.from('posts').select('id').in('id', postIds);
        if (error) throw error;
        (existingPosts || []).forEach(post => availablePostIds.add(post.id));
      }
      const likes = (Array.isArray(data.post_likes) ? data.post_likes : []).filter(row => row?.post_id && availablePostIds.has(row.post_id)).map(row => ({ post_id: row.post_id, user_id: user.id, ...(row.created_at ? { created_at: row.created_at } : {}) }));
      const comments = pickRows(data.post_comments, ['id','post_id','content','created_at']).filter(row => row.id && availablePostIds.has(row.post_id));
      await restore('post_likes', likes, 'post_id,user_id');
      await restore('post_comments', comments);
      setSettingsMessage('Backup importado. Os novos registros foram adicionados; atualizando seus dados...');
      window.setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      setSettingsMessage(error.message?.includes('backup válido') ? error.message : 'Não foi possível concluir a restauração. Confira se o arquivo pertence a esta conta e tente novamente.');
    } finally {
      setBackupBusy(false);
    }
  }

  const title = section === 'Início' ? 'Seu mundo aquático em um só lugar' : section;
  const subtitle = section === 'Início' ? 'Acompanhe seus aquários, peixes e cuidados diários.' : 'Organize e acompanhe seu aquarismo.';

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}aquaprofish-logo-original.png`} alt="Logomarca oficial AquaProFish" />
          <div className="brand-copy"><strong>AquaPro<span>Fish</span></strong><small>GESTÃO • CRIAÇÃO • COMUNIDADE</small></div>
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
          {!Capacitor.isNativePlatform() && <a className="app-download-nav" href="https://github.com/andrino0/AquaProFish/releases/download/apk-latest/AquaProFish.apk" aria-label="Baixe aqui o app AquaProFish">
            <Download size={18}/><span>Baixe aqui o app</span>
          </a>}
          <div className="profile"><div className="avatar">{avatarInitial}</div><div><strong>{displayName}</strong><small>Minha conta</small></div></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setMobileMenu(true)} aria-label="Abrir menu"><Menu/></button>
          <div className="breadcrumb">AquaProFish <ChevronRight size={14}/> <strong>{section}</strong></div>
          <div className="top-actions"><span className="user-email">{user?.email}</span><button className="auth-logout" onClick={onSignOut}>Sair</button><span className="status-pill"><i/> Conta conectada</span><button className="icon-button" aria-label="Notificações"><Bell size={19}/></button><div className="avatar small">{avatarInitial}</div></div>
        </header>

        <div className="content">
          {saveError && <div className="note" role="alert">{saveError}</div>}
          {dataLoading && <p className="note">Carregando seus dados salvos...</p>}
          <div className="page-heading"><div><div className="eyebrow">AQUAPROFISH</div><h1>{title}</h1><p>{subtitle}</p></div>
            {section === 'Aquários' && <button className="primary-button" onClick={() => openModal('tank')}><Plus size={18}/> Novo aquário</button>}
            {section === 'Meus peixes' && <button className="primary-button" onClick={() => openModal('fish')}><Plus size={18}/> Cadastrar peixe</button>}
            {section === 'Rotina' && <button className="primary-button" onClick={() => openModal('task')}><Plus size={18}/> Nova tarefa</button>}
            {section === 'Reprodução e alevinos' && <button className="primary-button" onClick={() => { setForm({ birthDate: new Date().toISOString().slice(0,10), fryCount: '0' }); setModal('brood'); }}><Plus size={18}/> Registrar cria</button>}
            {section === 'Comunidade' && <button className="primary-button" onClick={() => openModal('post')}><Plus size={18}/> Publicar</button>}
          </div>

          {section === 'Início' && <>
            <section className="welcome-banner"><div className="banner-copy"><span className="banner-kicker">BEM-VINDO AO AQUAPROFISH</span><h2>Mais cuidado para seus peixes.<br/><em>Mais vida para seu aquário.</em></h2><p>Tenha o controle da sua criação e acompanhe cada evolução.</p><button onClick={() => setSection('Aquários')} className="banner-button">Explorar meus aquários <ChevronRight size={17}/></button></div><div className="banner-art"><div className="bubble b1"/><div className="bubble b2"/><div className="bubble b3"/><Fish className="hero-fish f1"/><Fish className="hero-fish f2"/><Fish className="hero-fish f3"/><Waves className="hero-waves"/></div></section>
            <div className="section-title"><div><h2>Visão geral</h2><p>Resumo do seu ambiente aquático</p></div><span className="date-label"><CalendarDays size={15}/> Hoje</span></div>
            <div className="stats-grid">
              <Stat icon={Waves} label="Meus aquários" value={tanks.length} note="Toque para gerenciar" tone="blue" onClick={() => setSection('Aquários')}/>
              <Stat icon={Fish} label="Total de peixes" value={totalFish} note="Toque para gerenciar" tone="cyan" onClick={() => setSection('Meus peixes')}/>
              <Stat icon={Activity} label="Tarefas pendentes" value={tasks.filter(t => !t.done).length} note="Toque para abrir a rotina" tone="purple" onClick={() => setSection('Rotina')}/>
              <Stat icon={HeartPulse} label="Saúde dos aquários" value={tanks.filter(t => t.status === 'Estável').length + '/' + tanks.length} note="Toque para ver aquários" tone="green" onClick={() => setSection('Aquários')}/>
            </div>
            <div className="dashboard-grid">
              <section className="panel"><div className="panel-heading"><div><h3>Meus aquários</h3><p>Resumo dos seus ambientes</p></div><button className="text-button" onClick={() => setSection('Aquários')}>Ver todos <ChevronRight size={15}/></button></div>
                <div className="tank-list">{tanks.slice(0,3).map(t => <div className="tank-row" key={t.id} role="button" tabIndex={0} onClick={() => editTank(t)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') editTank(t); }}><div className="tank-icon"><Waves size={21}/></div><div className="tank-info"><strong>{t.name}</strong><small>{t.volume} • {t.fish} peixes</small></div><span className={t.status === 'Atenção' ? 'tag warning' : 'tag success'}>{t.status}</span></div>)}</div>
              </section>
              <section className="panel"><div className="panel-heading"><div><h3>Cuidados de hoje</h3><p>Não deixe a rotina passar</p></div><button className="text-button" onClick={() => setSection('Rotina')}>Ver rotina <ChevronRight size={15}/></button></div>
                <div className="task-list">{tasks.slice(0,3).map(t => <label className={`task-row ${t.done ? 'task-done' : ''}`} key={t.id}><input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)}/><span className="custom-check"><Check size={13}/></span><span className="task-copy"><strong>{t.title}</strong><small>{t.detail}{t.dueDate ? " • " + new Date(t.dueDate).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : ""}{t.recurrence && t.recurrence !== 'none' ? " • " + ({daily:'Diária',weekly:'Semanal',monthly:'Mensal'}[t.recurrence]) : ''}</small></span></label>)}</div>
              </section>
            </div>
          </>}

          {section === 'Aquários' && <section className="panel page-panel"><div className="panel-heading"><div><h3>Ambientes cadastrados</h3><p>Seus aquários e parâmetros atuais</p></div><span className="count-label">{tanks.length} cadastrados</span></div>{tanks.length ? <div className="tank-cards">{tanks.map(t => <article className="tank-card" key={t.id}><div className="tank-card-top"><div className="tank-icon large"><Waves size={24}/></div><span className={t.status === 'Atenção' ? 'tag warning' : 'tag success'}>{t.status}</span></div><h3>{t.name}</h3><div className="tank-volume">{t.volume}</div><div className="parameter-grid"><div><Thermometer size={16}/><span>Temperatura</span><strong>{t.temperature}</strong></div><div><Activity size={16}/><span>pH</span><strong>{t.ph}</strong></div><div><Fish size={16}/><span>Peixes</span><strong>{t.fish}</strong></div></div><div className="tank-card-actions"><button type="button" className="text-button" onClick={() => editTank(t)}><Pencil size={15}/> Editar aquário</button><button type="button" className="danger-icon-button" onClick={() => deleteTank(t)} aria-label="Excluir aquário" title="Excluir aquário"><Trash2 size={15}/></button></div></article>)}</div> : <Empty title="Nenhum aquário cadastrado" text="Adicione seu primeiro aquário para começar."/>}</section>}

          {section === 'Meus peixes' && <section className="panel page-panel"><div className="panel-heading"><div><h3>Cadastro de peixes</h3><p>Pesquise e acompanhe seus animais</p></div><div className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar peixe..."/></div></div><div className="fish-table"><div className="table-head"><span>PEIXE / VARIEDADE</span><span>ESPÉCIE</span><span>AQUÁRIO</span><span>QUANTIDADE</span></div>{filteredFish.map(f => <div className="table-row" key={f.id}><div className="fish-name"><div className="fish-avatar"><Fish size={19}/></div><strong>{f.name}</strong></div><span>{f.species}</span><span>{f.tank}</span><div className="fish-count-actions"><strong>{f.count}</strong><button type="button" className="text-button" onClick={() => editFish(f)}><Pencil size={14}/> Editar</button><button type="button" className="danger-icon-button" onClick={() => deleteFish(f)} aria-label="Excluir peixe" title="Excluir peixe"><Trash2 size={14}/></button></div></div>)}{!filteredFish.length && <Empty title="Nenhum peixe encontrado" text="Tente outro termo de busca ou cadastre um peixe."/>}</div></section>}

          {section === 'Rotina' && <section className="routine-dashboard">
            <div className="routine-summary-grid">
              <article className="panel routine-summary-card"><span>📅</span><div><small>Tarefas cadastradas</small><strong>{tasks.length}</strong></div></article>
              <article className="panel routine-summary-card"><span>⏰</span><div><small>Em atraso</small><strong>{tasks.filter(t => !t.done && t.dueDate && new Date(t.dueDate) < new Date()).length}</strong></div></article>
              <article className="panel routine-summary-card"><span>✅</span><div><small>Concluídas</small><strong>{tasks.filter(t => t.done).length}</strong></div></article>
            </div>
            <section className="panel page-panel">
              <div className="panel-heading"><div><h3>Agenda de cuidados</h3><p>Organize os cuidados por tipo e acompanhe os prazos</p></div><span className="count-label">{tasks.filter(t=>t.done).length} de {tasks.length} concluídas</span></div>
              <div className="progress-track"><div style={{width: (tasks.length ? tasks.filter(t=>t.done).length/tasks.length*100 : 0) + '%'}}/></div>
              <div className="routine-filters">
                {[{value:'all',label:'Todas'}, {value:'pending',label:'Pendentes'}, {value:'overdue',label:'Em atraso'}, {value:'done',label:'Concluídas'}, ...taskCategories].map(item => <button type="button" key={item.value} className={taskFilter === item.value ? 'routine-filter active' : 'routine-filter'} onClick={() => setTaskFilter(item.value)}>{item.icon ? item.icon + ' ' : ''}{item.label}</button>)}
              </div>
              <div className="routine-list">{tasks
                .filter(t => taskFilter === 'all' || (taskFilter === 'pending' && !t.done) || (taskFilter === 'done' && t.done) || (taskFilter === 'overdue' && !t.done && t.dueDate && new Date(t.dueDate) < new Date()) || t.category === taskFilter)
                .slice().sort((a,b) => {
                  if (a.done !== b.done) return a.done ? 1 : -1;
                  if (!a.dueDate) return 1;
                  if (!b.dueDate) return -1;
                  return new Date(a.dueDate) - new Date(b.dueDate);
                }).map(t => {
                  const category = taskCategories.find(c => c.value === t.category) || taskCategories[taskCategories.length - 1];
                  const overdue = !t.done && t.dueDate && new Date(t.dueDate) < new Date();
                  const dueSoon = !t.done && t.dueDate && !overdue && new Date(t.dueDate).getTime() - Date.now() <= 24 * 60 * 60 * 1000;
                  const tankName = tanks.find(tank => tank.id === t.aquariumId)?.name;
                  return <div className="routine-task-wrap" key={t.id}>
                    <label className={`task-row routine-task ${t.done ? 'task-done' : ''}`}>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)}/>
                      <span className="custom-check"><Check size={13}/></span>
                      <span className="task-copy"><strong>{category.icon} {t.title}</strong><small>{category.label}{tankName ? ' • ' + tankName : ''}{t.detail ? ' • ' + t.detail : ''}{t.dueDate ? ' • Prazo: ' + new Date(t.dueDate).toLocaleString('pt-BR', {dateStyle:'short',timeStyle:'short'}) : ' • Sem prazo'}{t.recurrence && t.recurrence !== 'none' ? ' • Repetição: ' + ({daily:'diária',weekly:'semanal',monthly:'mensal'}[t.recurrence]) : ''}</small></span>
                      {overdue ? <span className="tag warning">Em atraso</span> : dueSoon ? <span className="tag warning">Próxima</span> : <span className={t.done ? 'tag success' : 'tag'}>{t.done ? 'Concluída' : 'Pendente'}</span>}
                      <button type="button" className="text-button task-edit-button" onClick={() => editTask(t)} aria-label="Editar tarefa" title="Editar tarefa"><Pencil size={14}/></button>
                    </label>
                    <button type="button" className="danger-icon-button" onClick={() => deleteTask(t)} aria-label="Excluir tarefa" title="Excluir tarefa"><Trash2 size={15}/></button>
                  </div>;
                })}
                {!tasks.some(t => taskFilter === 'all' || (taskFilter === 'pending' && !t.done) || (taskFilter === 'done' && t.done) || (taskFilter === 'overdue' && !t.done && t.dueDate && new Date(t.dueDate) < new Date()) || t.category === taskFilter) && <Empty title="Nenhuma tarefa nesta categoria" text="Cadastre um cuidado ou escolha outro filtro para visualizar sua agenda."/>}
              </div>
              <p className="note">Os avisos de atraso e de tarefas próximas aparecem dentro do aplicativo. As tarefas recorrentes continuam gerando o próximo prazo automaticamente.</p>
            </section>
          </section>}

          {section === 'Qualidade da água' && <section className="water-quality-layout">
            <form className="panel water-test-form" onSubmit={submitWaterTest}>
              <div className="panel-heading"><div><h3>Registrar medição</h3><p>Salve os resultados dos testes do seu aquário</p></div><Droplets size={21}/></div>
              <div className="water-test-fields">
                <label className="field"><span>Aquário</span><select value={waterForm.aquariumId} onChange={e => setWaterForm(current => ({ ...current, aquariumId: e.target.value }))}><option value="">Sem aquário definido</option>{tanks.map(tank => <option key={tank.id} value={tank.id}>{tank.name}</option>)}</select></label>
                <Field label="Data e hora" type="datetime-local" value={waterForm.testedAt} onChange={value => setWaterForm(current => ({ ...current, testedAt: value }))}/>
                <Field label="Temperatura (°C)" type="number" value={waterForm.temperature} onChange={value => setWaterForm(current => ({ ...current, temperature: value }))} placeholder="Ex.: 26"/>
                <Field label="pH" type="number" value={waterForm.ph} onChange={value => setWaterForm(current => ({ ...current, ph: value }))} placeholder="Ex.: 7,0"/>
                <Field label="Amônia (mg/L)" type="number" value={waterForm.ammonia} onChange={value => setWaterForm(current => ({ ...current, ammonia: value }))} placeholder="Ex.: 0"/>
                <Field label="Nitrito (mg/L)" type="number" value={waterForm.nitrite} onChange={value => setWaterForm(current => ({ ...current, nitrite: value }))} placeholder="Ex.: 0"/>
                <Field label="Nitrato (mg/L)" type="number" value={waterForm.nitrate} onChange={value => setWaterForm(current => ({ ...current, nitrate: value }))} placeholder="Ex.: 10"/>
              </div>
              <Field label="Observações" value={waterForm.notes} onChange={value => setWaterForm(current => ({ ...current, notes: value }))} placeholder="Ex.: teste feito antes da TPA"/>
              <div className="modal-actions"><button type="submit" className="primary-button"><Plus size={17}/> Salvar medição</button></div>
              <p className="note">Registre os valores dos testes para acompanhar a evolução da água ao longo do tempo. Os resultados não substituem a avaliação adequada do aquário.</p>
            </form>
            <section className="water-trends-grid">
              <WaterTrend tests={waterTests} field="ph" label="pH" unit=""/>
              <WaterTrend tests={waterTests} field="ammonia" label="Amônia" unit=" mg/L"/>
              <WaterTrend tests={waterTests} field="nitrite" label="Nitrito" unit=" mg/L"/>
              <WaterTrend tests={waterTests} field="nitrate" label="Nitrato" unit=" mg/L"/>
              <WaterTrend tests={waterTests} field="temperature" label="Temperatura" unit=" °C"/>
            </section>
            <section className="panel water-test-history">
              <div className="panel-heading"><div><h3>Histórico de medições</h3><p>{waterTests.length} {waterTests.length === 1 ? 'registro salvo' : 'registros salvos'}</p></div><Activity size={20}/></div>
              {waterTests.length ? waterTests.map(test => <article className="water-test-row" key={test.id}>
                <div className="water-test-main"><strong>{tanks.find(tank => tank.id === test.aquarium_id)?.name || 'Sem aquário definido'}</strong><small>{new Date(test.tested_at).toLocaleString('pt-BR')}</small>
                  <div className="water-test-values">{[['Temperatura',test.temperature,'°C'],['pH',test.ph,''],['Amônia',test.ammonia,' mg/L'],['Nitrito',test.nitrite,' mg/L'],['Nitrato',test.nitrate,' mg/L']].filter(([,value]) => value !== null && value !== undefined).map(([label,value,unit]) => <span key={label}><b>{label}:</b> {value}{unit}</span>)}</div>
                  {test.notes && <p>{test.notes}</p>}
                </div>
                <button type="button" className="danger-icon-button" onClick={() => deleteWaterTest(test)} aria-label="Excluir medição" title="Excluir medição"><Trash2 size={15}/></button>
              </article>) : <Empty title="Nenhuma medição registrada" text="Registre o primeiro teste para começar seu histórico da qualidade da água."/>}
            </section>
          </section>}

          {section === 'Reprodução e alevinos' && <section className="breeding-layout">
            <div className="breeding-overview">
              <article className="panel breeding-stat"><span>🐣</span><div><small>Registros de crias</small><strong>{breedingBatches.length}</strong></div></article>
              <article className="panel breeding-stat"><span>🐟</span><div><small>Total inicial de alevinos</small><strong>{breedingBatches.reduce((sum, batch) => sum + Number(batch.fry_count || 0), 0)}</strong></div></article>
              <article className="panel breeding-stat"><span>📈</span><div><small>Acompanhamentos</small><strong>{fryObservations.length}</strong></div></article>
            </div>
            <div className="section-title"><div><h2>Minhas crias</h2><p>Registre os nascimentos e acompanhe o desenvolvimento dos filhotes.</p></div></div>
            {breedingBatches.length ? <div className="breeding-list">{breedingBatches.map(batch => {
              const observations = fryObservations.filter(item => item.batch_id === batch.id).sort((a,b) => String(b.observed_at).localeCompare(String(a.observed_at)));
              const latest = observations[0];
              const currentQuantity = latest ? latest.quantity : batch.fry_count;
              return <article className="panel breeding-card" key={batch.id}>
                <div className="breeding-card-head"><div><span className="eyebrow">NASCIMENTO • {new Date(batch.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span><h3>{batch.species}{batch.variety ? ' — ' + batch.variety : ''}</h3><p>{tanks.find(tank => tank.id === batch.aquarium_id)?.name || 'Sem aquário definido'}</p></div><button type="button" className="danger-icon-button" onClick={() => deleteBreedingBatch(batch)} aria-label="Excluir registro de cria"><Trash2 size={15}/></button></div>
                <div className="breeding-counts"><div><small>Quantidade ao nascer</small><strong>{batch.fry_count}</strong></div><div><small>Quantidade atual</small><strong>{currentQuantity}</strong></div><div><small>Acompanhamentos</small><strong>{observations.length}</strong></div></div>
                {(batch.female_parent || batch.male_parent) && <p className="breeding-parents">{[batch.female_parent ? 'Mãe: ' + batch.female_parent : '', batch.male_parent ? 'Pai: ' + batch.male_parent : ''].filter(Boolean).join(' • ')}</p>}
                {batch.notes && <p className="breeding-notes">{batch.notes}</p>}
                <div className="breeding-history-heading"><strong>Desenvolvimento dos alevinos</strong><button type="button" className="text-button" onClick={() => { setForm({ batchId: batch.id, observedAt: new Date().toISOString().slice(0,10), quantity: String(currentQuantity), averageSizeMm: '', food: '', notes: '' }); setModal('fryObservation'); }}><Plus size={15}/> Registrar evolução</button></div>
                {observations.length ? <div className="fry-observation-list">{observations.map(item => <div className="fry-observation" key={item.id}><div><strong>{new Date(item.observed_at + 'T12:00:00').toLocaleDateString('pt-BR')}</strong><span>{item.quantity} alevinos{item.average_size_mm !== null ? ' • ' + item.average_size_mm + ' mm em média' : ''}</span>{item.food && <small>Alimentação: {item.food}</small>}{item.notes && <small>{item.notes}</small>}</div><button type="button" className="danger-icon-button" onClick={() => deleteFryObservation(item)} aria-label="Excluir acompanhamento"><Trash2 size={14}/></button></div>)}</div> : <p className="breeding-empty-history">Ainda não há registros de crescimento. Registre uma observação para acompanhar a evolução.</p>}
              </article>;
            })}</div> : <Empty title="Nenhuma cria registrada" text="Use “Registrar cria” para anotar um nascimento e começar o acompanhamento dos alevinos."/>}
            <p className="note">A quantidade atual é baseada no último acompanhamento registrado. Os registros ficam associados à sua conta e entram no backup.</p>
          </section>}

          {section === 'Comunidade' && <section className="community-layout"><div className="community-intro"><div className="community-icon"><MessageCircle size={25}/></div><div><h2>Uma comunidade que compartilha conhecimento.</h2><p>Compartilhe experiências e acompanhe os aquaristas que estão conectados agora.</p></div></div><div className="online-panel"><div className="online-heading"><div><strong>Aquaristas online agora</strong><small>Presença em tempo real na comunidade</small></div><span className="online-count">{onlineUsers.length}</span></div>{onlineUsers.length ? <div className="online-list">{onlineUsers.map(person => <div className="online-person" key={person.user_id}><span className="online-avatar">{String(person.display_name || 'A').trim().charAt(0).toUpperCase()}</span><strong>{person.display_name || 'Aquarista'}</strong><i title="Online agora"/></div>)}</div> : <p className="online-empty">Ainda não há outros aquaristas conectados. Quando alguém entrar, aparecerá aqui.</p>}</div><div className="feed">{posts.map(post => <article className="panel post-card" key={post.id}><div className="post-author"><div className="avatar">{post.author === 'Você' ? 'V' : 'A'}</div><div><strong>{post.author}</strong><small>{post.time} • {post.tag}</small></div></div>{post.userId === user.id && <button type="button" className="danger-icon-button post-delete-button" onClick={() => deletePost(post)} aria-label="Excluir publicação" title="Excluir publicação"><Trash2 size={15}/></button>}<p>{post.text}</p><div className="post-actions">
                  <button type="button" className={post.likedByMe ? 'post-action liked' : 'post-action'} onClick={() => toggleLike(post.id)} disabled={!!likeBusy[post.id]}>
                    <Heart size={17} fill={post.likedByMe ? 'currentColor' : 'none'}/> {post.likes} {post.likes === 1 ? 'curtida' : 'curtidas'}
                  </button>
                  <button type="button" className="post-action" onClick={() => setExpandedComments(current => ({ ...current, [post.id]: !current[post.id] }))}>
                    <MessageCircle size={17}/> {(post.comments || []).length} {(post.comments || []).length === 1 ? 'comentário' : 'comentários'}
                  </button>
                </div>
                {expandedComments[post.id] && <div className="post-comments">
                  {(post.comments || []).length ? <div className="comment-list">{post.comments.map(comment => <div className="comment-item" key={comment.id}>
                    <div className="comment-avatar">{String(comment.author || 'A').trim().charAt(0).toUpperCase()}</div>
                    <div className="comment-body"><strong>{comment.author}</strong><p>{comment.text}</p><small>{comment.time}</small></div>{comment.userId === user.id && <button type="button" className="danger-icon-button comment-delete-button" onClick={() => deleteComment(post.id, comment)} aria-label="Excluir comentário" title="Excluir comentário"><Trash2 size={13}/></button>}
                  </div>)}</div> : <p className="comments-empty">Seja o primeiro a comentar.</p>}
                  <form className="comment-form" onSubmit={event => { event.preventDefault(); submitComment(post.id); }}>
                    <input aria-label="Escreva um comentário" value={commentDrafts[post.id] || ''} onChange={event => setCommentDrafts(current => ({ ...current, [post.id]: event.target.value }))} placeholder="Escreva um comentário..." maxLength={2000}/>
                    <button type="submit" className="comment-send" disabled={!String(commentDrafts[post.id] || '').trim()}>Enviar</button>
                  </form>
                </div>}</article>)}</div><p className="note">As publicações, curtidas e comentários ficam salvos no banco de dados da comunidade.</p></section>}

          {section === 'Configurações' && <section className="settings-layout">
            <article className="panel settings-card">
              <div className="panel-heading"><div><h3>Minha conta</h3><p>Informações da sua conta conectada</p></div><span className="tag success">Conectada</span></div>
              <div className="settings-account"><div className="avatar">{avatarInitial}</div><div><strong>{displayName}</strong><span>{user?.email || 'E-mail não disponível'}</span><small>Conta criada em {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—'}</small></div></div>
              <p className="note">Seus registros ficam associados à sua conta e sincronizados com o AquaProFish.</p>
            </article>
            <article className="panel settings-card">
              <div className="panel-heading"><div><h3>Backup e exportação</h3><p>Tenha uma cópia dos seus registros guardada com você.</p></div><Download size={20}/></div>
              <div className="settings-actions">
                <button type="button" className="primary-button" onClick={exportBackup} disabled={backupBusy}><Download size={17}/>{backupBusy ? 'Aguarde...' : 'Exportar backup completo'}</button>
                <button type="button" className="secondary-button" onClick={exportCsv} disabled={backupBusy}><Download size={17}/> Exportar planilha CSV</button>
                <label className={`secondary-button settings-import ${backupBusy ? 'disabled' : ''}`}><input type="file" accept=".json,application/json" onChange={importBackup} disabled={backupBusy}/><Download size={17}/> Importar backup JSON</label>
              </div>
              <p className="note">O backup inclui aquários, peixes, tarefas, medições da água, publicações e suas interações. A restauração adiciona registros que faltam, sem apagar os dados atuais. O arquivo só pode ser restaurado na mesma conta.</p>
              {settingsMessage && <p className="settings-message" role="status">{settingsMessage}</p>}
            </article>
            <article className="panel settings-card">
              <div className="panel-heading"><div><h3>Sobre o AquaProFish</h3><p>Gestão • Criação • Comunidade</p></div><Heart size={20}/></div>
              <div className="settings-about"><span>Desenvolvedor</span><strong>Andrino Morales Botelho</strong><span>Versão instalada</span><strong>{APP_VERSION} • 2026</strong></div>{updateCheckMessage && <p className="settings-message" role="status">{updateCheckMessage}</p>}{availableVersion && <p className="settings-message" role="status">Nova versão {availableVersion} disponível! <a href={APK_DOWNLOAD_URL} target="_blank" rel="noreferrer">Baixar agora</a></p>}
              <button type="button" className="auth-logout settings-signout" onClick={onSignOut}>Sair da minha conta</button>
            </article>
          </section>}

          {section === 'Apoie o AquaProFish' && <section className="support-layout">
            <article className="support-card">
              <div className="support-heart"><Heart size={27} fill="currentColor"/></div>
              <span className="eyebrow">APOIO VOLUNTÁRIO</span>
              <h2>Ajude o AquaProFish a crescer!</h2>
              <p>O AquaProFish é gratuito. Se este aplicativo ajuda você a cuidar melhor dos seus peixes e aquários, poderá apoiar o projeto com uma contribuição voluntária de qualquer valor.</p>
              <div className="pix-key-panel">
                <span>CHAVE PIX — CELULAR</span>
                <strong>+55 53 99108-6944</strong>
              </div>
              <button type="button" className="pix-copy-button" onClick={copyPixKey}><Copy size={17}/>{pixCopied ? 'Chave Pix copiada!' : 'Copiar chave Pix'}</button>
              <p className="support-notice">A contribuição é totalmente opcional. Todas as funcionalidades permanecem gratuitas, independentemente de qualquer contribuição. Antes de confirmar, confira no aplicativo do seu banco o nome do destinatário.</p>
            </article>
            <p className="support-thanks">Obrigado por apoiar o desenvolvimento do AquaProFish! <Heart size={14} fill="currentColor"/></p>
          </section>}

          {section === 'Guia de espécies' && <section className="panel page-panel"><div className="panel-heading"><div><h3>Conheça as espécies</h3><p>Toque em um peixe para abrir sua ficha completa</p></div><span className="tag info">5 espécies</span></div><div className="species-grid">{speciesGuide.map(species => <button type="button" className="species-card species-card-button" key={species.name} onClick={() => setSelectedSpecies(species)}><img className="species-thumb" src={species.image} alt={species.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling.style.display = 'grid'; }}/><div className="species-illustration species-fallback"><Fish size={32}/></div><div className="species-card-copy"><h3>{species.name}</h3><i>{species.latin}</i><p>{species.summary}</p><span className="species-open">Ver ficha completa <ChevronRight size={14}/></span></div></button>)}</div></section>}
        </div>
        {!Capacitor.isNativePlatform() && <div className="footer-download-wrap"><a className="footer-download" href="https://github.com/andrino0/AquaProFish/releases/download/apk-latest/AquaProFish.apk"><Download size={16}/> Baixe aqui o app</a></div>}
        <footer className="footer"><span className="footer-brand">AquaProFish · Gestão • Criação • Comunidade</span><span className="footer-version">Versão do app: <strong>1.0.145</strong></span><span className="footer-developer">Desenvolvedor: <strong>Andrino Morales Botelho</strong></span><span>© 2026 AquaProFish. Todos os direitos reservados.</span></footer>
      </main>

      {mobileMenu && <button className="mobile-scrim" onClick={() => setMobileMenu(false)} aria-label="Fechar menu"/>}

      {selectedSpecies && <div className="species-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedSpecies(null); }}><section className="species-detail-modal" role="dialog" aria-modal="true" aria-labelledby="species-detail-title"><button type="button" className="species-detail-close" onClick={() => setSelectedSpecies(null)} aria-label="Fechar ficha"><X size={20}/></button><img className="species-detail-image" src={selectedSpecies.image} alt={selectedSpecies.name} onError={event => { event.currentTarget.style.display = 'none'; }}/><div className="species-detail-content"><span className="eyebrow">GUIA DE ESPÉCIES • AQUAPROFISH</span><h2 id="species-detail-title">{selectedSpecies.name}</h2><i className="species-detail-latin">{selectedSpecies.latin}</i><p className="species-detail-summary">{selectedSpecies.summary}</p><p className="species-photo-credit" style={{fontSize:12,opacity:0.72,marginTop:-8}}>Foto: {selectedSpecies.photoCredit}</p><div className="species-facts-grid"><div><small>Temperatura</small><strong>{selectedSpecies.temperature}</strong></div><div><small>pH</small><strong>{selectedSpecies.ph}</strong></div><div><small>Dureza</small><strong>{selectedSpecies.hardness}</strong></div><div><small>Tamanho adulto</small><strong>{selectedSpecies.size}</strong></div></div><div className="species-detail-sections">{[['Origem',selectedSpecies.origin],['Aquário recomendado',selectedSpecies.aquarium],['Alimentação',selectedSpecies.food],['Comportamento',selectedSpecies.behavior],['Compatibilidade',selectedSpecies.compatibility],['Reprodução',selectedSpecies.reproduction],['Você sabia?',selectedSpecies.facts],['Cuidados importantes',selectedSpecies.care]].map(([heading,body]) => <article key={heading}><h3>{heading}</h3><p>{body}</p></article>)}</div><p className="species-disclaimer">Parâmetros e tamanhos são referências gerais. A necessidade real varia conforme linhagem, origem, idade, população e qualidade da água. Priorize estabilidade e pesquise a variedade específica.</p><button type="button" className="primary-button species-back-button" onClick={() => setSelectedSpecies(null)}>Voltar ao guia</button></div></section></div>}

      {availableVersion && <div className="confirm-modal-backdrop update-modal-backdrop" role="presentation"><section className="confirm-modal update-modal" role="dialog" aria-modal="true" aria-labelledby="update-title"><div className="confirm-modal-heading"><h2 id="update-title">Temos uma atualização!</h2></div><p>Nova versão <strong>{availableVersion}</strong> disponível para o AquaProFish.</p><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setAvailableVersion('')}>Agora não</button><a className="primary-button update-download-button" href={APK_DOWNLOAD_URL} target="_blank" rel="noreferrer"><Download size={15}/> Atualizar agora</a></div></section></div>}
      {confirmDialog && <div className="confirm-modal-backdrop" role="presentation"><section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message"><div className="confirm-modal-heading"><h2 id="confirm-title">Confirmar ação</h2></div><p id="confirm-message">{confirmDialog}</p><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => finishConfirmation(false)}>Cancelar</button><button type="button" className="danger-confirm-button" onClick={() => finishConfirmation(true)}>Confirmar</button></div></section></div>}

      {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(''); }}><form className="modal" onSubmit={modal === 'tank' || modal === 'editTank' ? submitTank : modal === 'fish' || modal === 'editFish' ? submitFish : modal === 'task' || modal === 'editTask' ? submitTask : modal === 'brood' ? submitBrood : modal === 'fryObservation' ? submitFryObservation : submitPost}><div className="modal-heading"><div><span className="eyebrow">AQUAPROFISH</span><h2>{modal === 'tank' ? 'Adicionar aquário' : modal === 'editTank' ? 'Editar aquário' : modal === 'fish' ? 'Cadastrar peixe' : modal === 'editFish' ? 'Editar peixe' : modal === 'task' ? 'Nova tarefa' : modal === 'editTask' ? 'Editar tarefa' : modal === 'brood' ? 'Registrar cria' : modal === 'fryObservation' ? 'Acompanhar alevinos' : 'Nova publicação'}</h2></div><button type="button" className="icon-button" onClick={() => setModal('')}><X size={19}/></button></div>
        {(modal === 'tank' || modal === 'editTank') && <><Field label="Nome do aquário *" value={form.name || ''} onChange={v=>setForm({...form,name:v})} placeholder="Ex.: Aquário da sala"/><div className="form-two"><Field label="Volume" value={form.volume || ''} onChange={v=>setForm({...form,volume:v})} placeholder="Ex.: 100 L"/><Field label="Temperatura" value={form.temperature || ''} onChange={v=>setForm({...form,temperature:v})} placeholder="Ex.: 26 °C"/></div><Field label="pH atual" value={form.ph || ''} onChange={v=>setForm({...form,ph:v})} placeholder="Ex.: 7,0"/><label className="field"><span>Situação do aquário</span><select value={form.status || 'Novo'} onChange={e=>setForm({...form,status:e.target.value})}><option value="Novo">Ainda não avaliado</option><option value="Estável">Estável</option><option value="Atenção">Precisa de atenção</option></select></label></>}
        {(modal === 'fish' || modal === 'editFish') && <><Field label="Nome / variedade *" value={form.name || ''} onChange={v=>setForm({...form,name:v})} placeholder="Ex.: Guppy Full Red"/><Field label="Espécie" value={form.species || ''} onChange={v=>setForm({...form,species:v})} placeholder="Ex.: Poecilia reticulata"/><div className="form-two"><label className="field"><span>Aquário</span><select value={form.aquariumId || ''} onChange={e=>setForm({...form,aquariumId:e.target.value})}><option value="">Sem aquário definido</option>{tanks.map(t=><option key={t.id} value={t.id}>{t.name} ({t.volume})</option>)}</select></label><Field label="Quantidade" value={form.count ?? '0'} onChange={v=>setForm({...form,count:v})} placeholder="0" type="number"/></div></>}
        {(modal === 'task' || modal === 'editTask') && <><Field label="Nome da tarefa *" value={form.title || ''} onChange={v=>setForm({...form,title:v})} placeholder="Ex.: Alimentar os peixes"/><label className="field"><span>Tipo de cuidado</span><select value={form.category || 'other'} onChange={e=>setForm({...form,category:e.target.value})}>{taskCategories.map(category=><option key={category.value} value={category.value}>{category.icon} {category.label}</option>)}</select></label><label className="field"><span>Aquário relacionado</span><select value={form.aquariumId || ''} onChange={e=>setForm({...form,aquariumId:e.target.value})}><option value="">Todos / não definido</option>{tanks.map(tank=><option key={tank.id} value={tank.id}>{tank.name}</option>)}</select></label><Field label="Detalhes" value={form.detail || ''} onChange={v=>setForm({...form,detail:v})} placeholder="Ex.: Pela manhã, pequena quantidade"/><Field label="Data e hora do prazo (opcional)" value={form.dueDate || ''} onChange={v=>setForm({...form,dueDate:v})} type="datetime-local"/><label className="field"><span>Repetir tarefa</span><select value={form.recurrence || 'none'} onChange={e=>setForm({...form,recurrence:e.target.value})}><option value="none">Não se repete</option><option value="daily">Todos os dias</option><option value="weekly">Toda semana</option><option value="monthly">Todo mês</option></select></label><p className="field-hint">Ao concluir uma tarefa recorrente, a próxima será criada automaticamente. O aplicativo destaca tarefas atrasadas e as que vencem nas próximas 24 horas.</p></>}
        {modal === 'brood' && <>
          <Field label="Espécie *" value={form.species || ''} onChange={v=>setForm({...form,species:v})} placeholder="Ex.: Guppy, Plati, Molinésia..."/>
          <Field label="Variedade (opcional)" value={form.variety || ''} onChange={v=>setForm({...form,variety:v})} placeholder="Ex.: Full Red, Wagtail..."/>
          <label className="field"><span>Aquário</span><select value={form.aquariumId || ''} onChange={e=>setForm({...form,aquariumId:e.target.value})}><option value="">Sem aquário definido</option>{tanks.map(tank=><option key={tank.id} value={tank.id}>{tank.name}</option>)}</select></label>
          <div className="form-two"><Field label="Data do nascimento *" type="date" value={form.birthDate || new Date().toISOString().slice(0,10)} onChange={v=>setForm({...form,birthDate:v})}/><Field label="Quantidade de alevinos *" type="number" value={form.fryCount ?? '0'} onChange={v=>setForm({...form,fryCount:v})} placeholder="Ex.: 15"/></div>
          <div className="form-two"><Field label="Mãe / fêmea (opcional)" value={form.femaleParent || ''} onChange={v=>setForm({...form,femaleParent:v})} placeholder="Identificação da fêmea"/><Field label="Pai / macho (opcional)" value={form.maleParent || ''} onChange={v=>setForm({...form,maleParent:v})} placeholder="Identificação do macho"/></div>
          <Field label="Observações" value={form.notes || ''} onChange={v=>setForm({...form,notes:v})} placeholder="Ex.: primeira cria, cor dos pais..." area/>
        </>}
        {modal === 'fryObservation' && <>
          <label className="field"><span>Registro de cria</span><select value={form.batchId || ''} onChange={e=>setForm({...form,batchId:e.target.value})}>{breedingBatches.map(batch=><option key={batch.id} value={batch.id}>{batch.species}{batch.variety ? ' — ' + batch.variety : ''} • {new Date(batch.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}</option>)}</select></label>
          <div className="form-two"><Field label="Data do acompanhamento *" type="date" value={form.observedAt || new Date().toISOString().slice(0,10)} onChange={v=>setForm({...form,observedAt:v})}/><Field label="Quantidade viva *" type="number" value={form.quantity ?? ''} onChange={v=>setForm({...form,quantity:v})} placeholder="Ex.: 14"/></div>
          <Field label="Tamanho médio (mm)" type="number" value={form.averageSizeMm || ''} onChange={v=>setForm({...form,averageSizeMm:v})} placeholder="Ex.: 8"/>
          <Field label="Alimentação" value={form.food || ''} onChange={v=>setForm({...form,food:v})} placeholder="Ex.: náuplios de artêmia, microvermes..."/>
          <Field label="Observações" value={form.notes || ''} onChange={v=>setForm({...form,notes:v})} placeholder="Ex.: estão nadando bem, separados por tamanho..." area/>
        </>}
        {modal === 'post' && <Field label="O que você gostaria de compartilhar?" value={form.text || ''} onChange={v=>setForm({...form,text:v})} placeholder="Conte uma experiência ou faça uma pergunta..." area/>}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setModal('')}>Cancelar</button><button type="submit" className="primary-button"><Plus size={17}/> Salvar</button></div>
      </form></div>}
    </div>
  );
}

function Stat({ icon: Icon, label, value, note, tone, onClick }) {
  return <article className="stat-card" role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={e => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); }} style={onClick ? {cursor:'pointer'} : undefined}><div className={'stat-icon '+tone}><Icon size={20}/></div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}
function Field({ label, value, onChange, placeholder, type='text', area=false }) {
  return <label className="field"><span>{label}</span>{area ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows="4"/> : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}</label>;
}
function Empty({ title, text }) { return <div className="empty-state"><Fish size={28}/><strong>{title}</strong><span>{text}</span></div>; }
function WaterTrend({ tests, field, label, unit }) {
  const values = tests.filter(test => test[field] !== null && test[field] !== undefined).slice(0, 8).reverse();
  const numbers = values.map(test => Number(test[field]));
  const min = numbers.length ? Math.min(...numbers) : 0;
  const max = numbers.length ? Math.max(...numbers) : 1;
  const range = max - min || 1;
  const points = numbers.map((value, index) => {
    const x = numbers.length === 1 ? 150 : 12 + (index / (numbers.length - 1)) * 276;
    const y = 78 - ((value - min) / range) * 58;
    return { x, y };
  });
  return <article className="panel water-trend-card"><div className="water-trend-heading"><strong>{label}</strong><span>{numbers.length ? numbers[numbers.length - 1] + unit : 'Sem dados'}</span></div>{numbers.length ? <><svg viewBox="0 0 300 92" role="img" aria-label={'Evolução de ' + label}><polyline points={points.map(point => point.x + ',' + point.y).join(' ')} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{points.map((point,index) => <circle key={index} cx={point.x} cy={point.y} r="3.5" fill="currentColor"/>)}</svg><small>{values.length === 1 ? 'Uma medição registrada' : values.length + ' medições mais recentes'}</small></> : <p>Registre medições para visualizar a evolução.</p>}</article>;
}

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
