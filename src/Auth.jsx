import { useState } from 'react';
import { supabase } from './lib/supabase.js';

const APP_URL = 'https://andrino0.github.io/AquaProFish/';

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
          email,
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: APP_URL
          }
        });
        if (authError) throw authError;
        if (data.session) setMessage('Cadastro realizado! Entrando na sua conta...');
        else setMessage('Cadastro iniciado! Confira seu e-mail para confirmar a conta.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      }
    } catch (err) {
      setError(err.message || 'Não foi possível concluir. Tente novamente.');
    } finally { setBusy(false); }
  }

  async function resendConfirmation() {
    if (!email.trim()) { setError('Digite o mesmo e-mail usado no cadastro.'); return; }
    setBusy(true); setError(''); setMessage('');
    const { error: authError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: APP_URL }
    });
    if (authError) setError(authError.message);
    else setMessage('Se a conta ainda precisar de confirmação, enviaremos um novo e-mail. Confira também o spam.');
    setBusy(false);
  }

  async function resetPassword() {
    if (!email.trim()) { setError('Digite seu e-mail primeiro.'); return; }
    setBusy(true); setError(''); setMessage('');
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: APP_URL
    });
    if (authError) setError(authError.message);
    else setMessage('Se esse e-mail estiver cadastrado, você receberá instruções para redefinir a senha.');
    setBusy(false);
  }

  return <main className="auth-screen">
    <section className="auth-card">
      <div className="auth-brand">
        <img className="auth-logo" src="data:image/png;base64,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" alt="AquaProFish" style={{width:62,height:62,objectFit:'contain',flex:'0 0 62px'}} />
        <div><strong>AquaPro<span>Fish</span></strong><small>GESTÃO • CRIAÇÃO • COMUNIDADE</small></div>
      </div>
      <div className="auth-heading"><span className="eyebrow">SEU MUNDO AQUÁTICO</span><h1>{mode === 'signup' ? 'Crie sua conta' : 'Bem-vindo de volta'}</h1><p>{mode === 'signup' ? 'Cadastre-se gratuitamente para começar.' : 'Entre para acessar seus aquários e sua comunidade.'}</p></div>
      <form onSubmit={submit} className="auth-form">
        {mode === 'signup' && <label className="field"><span>Como devemos te chamar?</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome" required maxLength={80}/></label>}
        <label className="field"><span>E-mail</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" required/></label>
        <label className="field"><span>Senha</span><input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" minLength={6} required/></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? 'Aguarde...' : mode === 'signup' ? 'Criar minha conta' : 'Entrar'}</button>
      </form>
      {mode === 'login' && <>
        <button className="auth-link" type="button" onClick={resetPassword} disabled={busy}>Esqueci minha senha</button>
        <button className="auth-link" type="button" onClick={resendConfirmation} disabled={busy}>Reenviar e-mail de confirmação</button>
      </>}
      <div className="auth-switch">{mode === 'signup' ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'} <button type="button" onClick={()=>{setMode(mode==='signup'?'login':'signup');setError('');setMessage('');}}>{mode === 'signup' ? 'Entrar' : 'Criar conta'}</button></div>
      <p className="auth-foot">Sua conta é protegida pelo Supabase. Nunca compartilhe sua senha.</p>
    </section>
  </main>;
}
