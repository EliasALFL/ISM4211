// Supabase Auth (email + password). The publishable key is designed to be public;
// never put a service_role / secret key in this file.
// Docs: https://supabase.com/docs/guides/auth/passwords
const SUPABASE_URL = 'https://qbiqgzfowfzpidhlpvxb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-CWLbRkDyxTJqIQrbEvkYA_L12HH_R3';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let mode = 'signin'; // 'signin' | 'signup' | 'reset' | 'newpass'

function setMode(next) {
  mode = next;
  const copy = {
    signin: ['Sign in', 'Sign in to see FAU Boca Raton weather.', 'Sign in', 'New here? Create an account'],
    signup: ['Create account', 'Use your email and a password (6+ characters).', 'Create account', 'Already have an account? Sign in'],
    reset: ['Reset password', "Enter your email and we'll send you a reset link.", 'Send reset link', 'Back to sign in'],
    newpass: ['Choose a new password', 'Enter a new password for your account.', 'Update password', 'Back to sign in'],
  }[next];
  $('authTitle').textContent = copy[0];
  $('authSub').textContent = copy[1];
  $('authSubmit').textContent = copy[2];
  $('toggleMode').textContent = copy[3];
  $('pwLabel').hidden = next === 'reset';
  $('password').required = next !== 'reset';
  $('password').autocomplete = next === 'signin' ? 'current-password' : 'new-password';
  $('email').closest('label').hidden = next === 'newpass';
  $('email').required = next !== 'newpass';
  $('forgot').hidden = next !== 'signin';
  showMsg('');
}

function showMsg(text, kind = 'info') {
  const el = $('authMsg');
  el.textContent = text;
  el.className = `auth-msg ${kind}`;
  el.hidden = !text;
}

function renderAuth(session) {
  const signedIn = !!session && mode !== 'newpass';
  $('auth').hidden = signedIn;
  $('app').hidden = !signedIn;
  $('search').hidden = !signedIn;
  $('userbar').hidden = !signedIn;
  $('userEmail').textContent = session?.user?.email || '';
  if (signedIn) window.startWeather();
}

$('toggleMode').addEventListener('click', () => setMode(mode === 'signin' ? 'signup' : 'signin'));
$('forgot').addEventListener('click', () => setMode('reset'));
$('signOut').addEventListener('click', () => sb.auth.signOut());

$('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('email').value.trim();
  const password = $('password').value;
  const btn = $('authSubmit');
  btn.disabled = true;
  showMsg('');
  try {
    if (mode === 'signin') {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else if (mode === 'signup') {
      const { data, error } = await sb.auth.signUp({
        email, password, options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      if (!data.session) {
        setMode('signin');
        showMsg('Check your email for a confirmation link, then sign in.', 'ok');
      }
    } else if (mode === 'reset') {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) throw error;
      showMsg('If that email has an account, a reset link is on its way.', 'ok');
    } else if (mode === 'newpass') {
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      setMode('signin');
      const { data } = await sb.auth.getSession();
      renderAuth(data.session);
    }
  } catch (err) {
    showMsg(err.message || 'Something went wrong. Please try again.', 'error');
  } finally {
    btn.disabled = false;
  }
});

sb.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') setMode('newpass');
  // Defer so we never call other Supabase methods inside this callback.
  setTimeout(() => renderAuth(session), 0);
});

setMode('signin');
sb.auth.getSession().then(({ data }) => renderAuth(data.session));
