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
      <div className="auth-brand" style={{justifyContent:'center',gap:14}}>
        <img className="auth-logo" src={`${import.meta.env.BASE_URL}aquaprofish-logo-original.png`} alt="Logomarca AquaProFish" style={{width:'100%',maxWidth:170,height:90,objectFit:'contain',flex:'0 1 170px'}} />
        <div style={{flex:'0 0 auto',textAlign:'left'}}>
          <strong style={{fontSize:32,lineHeight:1.12,letterSpacing:"0.1px"}}>AquaPro<span>Fish</span></strong>
          <small>GESTÃO • CRIAÇÃO • COMUNIDADE</small>
        </div>
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
      <a href="https://github.com/andrino0/AquaProFish/releases/download/apk-latest/AquaProFish.apk" className="app-download-button" download style={{display:"flex",alignItems:"center",justifyContent:"center",gap:9,width:"100%",marginTop:18,padding:"13px 16px",borderRadius:12,border:"1px solid #2b8cba",color:"#0877a8",fontWeight:700,textDecoration:"none"}}>↓ Baixar APP para Android</a>
      <p className="auth-foot">Sua conta é protegida pelo Supabase. Nunca compartilhe sua senha.</p>
    </section>
  </main>;
}
