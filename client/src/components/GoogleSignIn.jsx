import { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function GoogleSignIn({ onSuccess, onError, mode = 'login' }) {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef(null);
  const [clientId, setClientId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.get('/auth/google-config').then((res) => setClientId(res.data.clientId || null)).catch(() => setClientId(null));
  }, []);

  useEffect(() => {
    if (!clientId || !buttonRef.current) return undefined;

    function handleCredential(response) {
      const credential = response.credential;
      const action =
        mode === 'reset'
          ? api.post('/auth/forgot-password/google', { credential }).then((res) => onSuccess?.(res.data.token))
          : loginWithGoogle(credential).then(() => onSuccess?.());

      action.catch((err) => onError?.(err.response?.data?.message || err.message || 'Google sign-in failed'));
    }

    function renderButton() {
      if (!window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential
      });
      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'rectangular'
      });
      setReady(true);
    }

    const existing = document.getElementById('google-gsi');
    if (existing && window.google?.accounts?.id) {
      renderButton();
      return undefined;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = renderButton;
    document.head.appendChild(script);
    return undefined;
  }, [clientId, loginWithGoogle, mode, onError, onSuccess]);

  if (!clientId) return null;

  return (
    <div className="google-signin">
      <div ref={buttonRef} />
      {!ready ? <p className="muted">Loading Google…</p> : null}
    </div>
  );
}
