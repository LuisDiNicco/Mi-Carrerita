import { useState } from 'react';
import { useAuthStore } from '../store/auth-store';
import { clearAccessToken } from '../lib/auth';
import { RetroButton } from '../../../shared/ui/RetroButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);
  const authUser = useAuthStore((state) => state.user);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setError(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Ingrese un email valido.');
      return;
    }

    if (mode === 'register' && trimmedName.length < 2) {
      setError('Ingrese un nombre valido.');
      return;
    }

    login({
      name: trimmedName || 'Usuario',
      email: trimmedEmail,
    });
    onClose();
  };

  const handleGoogle = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      clearAccessToken();
      logout();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-app bg-surface p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-app">{mode === 'login' ? 'Iniciar sesion' : 'Registrarse'}</h2>
          <button className="text-muted" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm text-muted">
          Podes usar la app como invitado o iniciar sesion para guardar tu progreso.
        </p>

        {authUser ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-app bg-elevated px-4 py-3 text-sm text-app">
              Sesion iniciada como <span className="font-semibold">{authUser.name}</span>.
            </div>
            <div className="flex flex-wrap gap-2">
              <RetroButton variant="primary" size="sm" onClick={handleLogout}>
                Cerrar sesion
              </RetroButton>
              <button
                className="rounded-lg border border-app bg-elevated px-4 py-2 text-sm text-app"
                onClick={onClose}
              >
                Volver
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 flex gap-2">
              <button
                className={`rounded-full border px-3 py-1 text-sm ${
                  mode === 'login' ? 'border-accent text-app' : 'border-app text-muted'
                }`}
                onClick={() => setMode('login')}
              >
                Iniciar sesion
              </button>
              <button
                className={`rounded-full border px-3 py-1 text-sm ${
                  mode === 'register' ? 'border-accent text-app' : 'border-app text-muted'
                }`}
                onClick={() => setMode('register')}
              >
                Registrarse
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {mode === 'register' && (
                <label className="flex flex-col gap-1 text-sm text-muted">
                  Nombre
                  <input
                    className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
              )}
              <label className="flex flex-col gap-1 text-sm text-muted">
                Email
                <input
                  className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
            </div>

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              <RetroButton variant="primary" size="sm" onClick={handleSubmit}>
                {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </RetroButton>
              <button
                className="rounded-lg border border-app bg-elevated px-4 py-2 text-sm text-app"
                onClick={continueAsGuest}
              >
                Continuar como invitado
              </button>
              <button
                className="rounded-lg border border-app bg-elevated px-4 py-2 text-sm text-app"
                onClick={handleGoogle}
              >
                Login con Google
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
