import { useState } from 'react';
import { useAuthStore } from '../store/auth-store';
import { clearAccessToken } from '../lib/auth';
import { registerUser, loginUser } from '../lib/api';
import { RetroButton } from '../../../shared/ui/RetroButton';
import { Eye, EyeOff } from 'lucide-react';

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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLocalAuth = async () => {
    setError(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Ingrese un email válido.');
      return;
    }

    if (trimmedPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (mode === 'register' && !/[A-Z]/.test(trimmedPassword)) {
      setError('La contraseña debe incluir al menos una letra mayúscula.');
      return;
    }

    if (mode === 'register' && !/[a-z]/.test(trimmedPassword)) {
      setError('La contraseña debe incluir al menos una letra minúscula.');
      return;
    }

    if (mode === 'register' && !/\d/.test(trimmedPassword)) {
      setError('La contraseña debe incluir al menos un número.');
      return;
    }

    if (mode === 'register' && trimmedName.length < 2) {
      setError('Ingrese un nombre válido.');
      return;
    }

    setIsLoading(true);
    try {
      const result = mode === 'register'
        ? await registerUser({
            email: trimmedEmail,
            password: trimmedPassword,
            name: trimmedName || undefined,
          })
        : await loginUser({
            email: trimmedEmail,
            password: trimmedPassword,
          });

      login({
        name: result.user?.name || trimmedName || 'Usuario',
        email: result.user?.email || trimmedEmail,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : mode === 'register'
          ? 'No se pudo completar el registro. Intentá nuevamente.'
          : 'No se pudo iniciar sesión. Intentá nuevamente.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border-2 border-app bg-surface p-6 shadow-retro">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-app font-retro">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>
          <button className="text-muted" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm text-muted">
          Ingresá con tu cuenta para guardar progreso o usá invitado para explorar.
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
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                className={`rounded-lg border-2 py-2 text-sm font-bold transition-all ${
                  mode === 'login'
                    ? 'border-unlam-500 bg-unlam-500/20 text-app'
                    : 'border-app-border text-muted hover:border-app'
                }`}
                onClick={() => setMode('login')}
              >
                Iniciar sesión
              </button>
              <button
                className={`rounded-lg border-2 py-2 text-sm font-bold transition-all ${
                  mode === 'register'
                    ? 'border-unlam-500 bg-unlam-500/20 text-app'
                    : 'border-app-border text-muted hover:border-app'
                }`}
                onClick={() => setMode('register')}
              >
                Registrarse
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {mode === 'register' && (
                <label className="flex flex-col gap-1 text-sm text-muted">
                  <span className="font-bold">Nombre</span>
                  <input
                    type="text"
                    className="bg-elevated border-2 border-app-border rounded-lg px-3 py-2 text-app focus:border-unlam-500 outline-none transition-all"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Tu nombre"
                  />
                </label>
              )}
              <label className="flex flex-col gap-1 text-sm text-muted">
                <span className="font-bold">Email</span>
                <input
                  type="email"
                  className="bg-elevated border-2 border-app-border rounded-lg px-3 py-2 text-app focus:border-unlam-500 outline-none transition-all"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@email.com"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-muted">
                <span className="font-bold">Contraseña</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-elevated border-2 border-app-border rounded-lg pl-3 pr-10 py-2 text-app focus:border-unlam-500 outline-none transition-all"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Al menos 8 caracteres"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-app"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {mode === 'register' && (
                  <p className="text-xs text-muted/70 mt-1">
                    Debe incluir mínimo 8 caracteres, una mayúscula, una minúscula y un número.
                  </p>
                )}
              </label>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border-2 border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400 font-bold">⛔ {error}</p>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <RetroButton
                variant="primary"
                size="sm"
                onClick={handleLocalAuth}
                disabled={isLoading}
                className="sm:col-span-2"
              >
                {isLoading ? 'Procesando...' : mode === 'login' ? 'Entrar con Email' : 'Crear cuenta'}
              </RetroButton>
              <button
                className="rounded-lg border-2 border-app-border bg-elevated px-4 py-2 text-sm font-bold text-app hover:border-app transition-all"
                onClick={handleGuest}
                disabled={isLoading}
              >
                Invitado
              </button>
              <button
                className="sm:col-span-3 rounded-lg border-2 border-app-border bg-elevated px-4 py-2 text-sm font-bold text-app hover:border-unlam-500 transition-all"
                onClick={handleGoogle}
                disabled={isLoading}
              >
                Continuar con Google
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
