import { useState } from 'react';
import { supabase } from './lib/supabase.js';
import { Fish, Waves } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email, password, options: { data: { display_name: name.trim() } }
        });
        if (authError) throw authError;
        if (data.session) setMessage('Cadastro realizado! Entrando na sua conta...');
        else setMessage('Cadastro iniciado! Confira seu e-mail para confirmar a conta e depois entre no AquaProFish.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      }
    } catch (err) {
      setError(err.message || 'Não foi possível concluir. Tente novamente.');
    } finally { setBusy(false); }
  }

  async function resetPassword() {
    if (!email.trim()) { setError('Digite seu e-mail primeiro.'); return; }
    setBusy(true); setError(''); setMessage('');
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (authError) setError(authError.message);
    else setMessage('Se esse e-mail estiver cadastrado, você receberá instruções para redefinir a senha.');
    setBusy(false);
  }

  return <main className="auth-screen">
    <section className="auth-card">
      <div className="auth-brand"><span><Waves size={25}/><Fish size={18}/></span><div><strong>AquaPro<span>Fish</span></strong><small>GESTÃO • CRIAÇÃO • COMUNIDADE</small></div></div>
      <div className="auth-heading"><span className="eyebrow">SEU MUNDO AQUÁTICO</span><h1>{mode === 'signup' ? 'Crie sua conta' : 'Bem-vindo de volta'}</h1><p>{mode === 'signup' ? 'Cadastre-se gratuitamente para começar.' : 'Entre para acessar seus aquários e sua comunidade.'}</p></div>
      <form onSubmit={submit} className="auth-form">
        {mode === 'signup' && <label className="field"><span>Como devemos te chamar?</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome" required maxLength={80}/></label>}
        <label className="field"><span>E-mail</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" required/></label>
        <label className="field"><span>Senha</span><input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" minLength={6} required/></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? 'Aguarde...' : mode === 'signup' ? 'Criar minha conta' : 'Entrar'}</button>
      </form>
      {mode === 'login' && <button className="auth-link" type="button" onClick={resetPassword} disabled={busy}>Esqueci minha senha</button>}
      <div className="auth-switch">{mode === 'signup' ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'} <button type="button" onClick={()=>{setMode(mode==='signup'?'login':'signup');setError('');setMessage('');}}>{mode === 'signup' ? 'Entrar' : 'Criar conta'}</button></div>
      <p className="auth-foot">Sua conta é protegida pelo Supabase. Nunca compartilhe sua senha.</p>
    </section>
  </main>;
}
