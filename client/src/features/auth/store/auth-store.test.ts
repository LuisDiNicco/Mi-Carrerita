import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuthStore } from './auth-store';

describe('useAuthStore', () => {
    const mockUser = { name: 'Luis D', email: 'luis@test.com' };

    beforeEach(() => {
        useAuthStore.setState({ user: null, isGuest: true });
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('debería inicializar vacío y como guest', () => {
        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.isGuest).toBe(true);
    });

    it('login debería establecer el usuario en state y localStorage', () => {
        useAuthStore.getState().login(mockUser);

        expect(useAuthStore.getState().user).toEqual(mockUser);
        expect(useAuthStore.getState().isGuest).toBe(false);
        expect(localStorage.getItem('mi-carrerita-user')).toBe(JSON.stringify(mockUser));
        expect(localStorage.getItem('mi-carrerita-guest')).toBeNull();
    });

    it('logout debería purgar el usuario de state y localStorage', () => {
        useAuthStore.getState().login(mockUser);
        useAuthStore.getState().logout();

        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().isGuest).toBe(true);
        expect(localStorage.getItem('mi-carrerita-user')).toBeNull();
        expect(localStorage.getItem('mi-carrerita-guest')).toBe('true');
    });

    it('continueAsGuest debería purgar user y setear flags the guest', () => {
        useAuthStore.getState().login(mockUser);
        useAuthStore.getState().continueAsGuest();

        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().isGuest).toBe(true);
        expect(localStorage.getItem('mi-carrerita-user')).toBeNull();
        expect(localStorage.getItem('mi-carrerita-guest')).toBe('true');
    });

    describe('hydrate', () => {
        it('debería recuperar al usuario desde localStorage si existe y no reventar', () => {
            localStorage.setItem('mi-carrerita-user', JSON.stringify(mockUser));
            useAuthStore.getState().hydrate();

            expect(useAuthStore.getState().user).toEqual(mockUser);
            expect(useAuthStore.getState().isGuest).toBe(false);
        });

        it('debería ignorar la recuperación si el JSON de localStorage es corrupto', () => {
            localStorage.setItem('mi-carrerita-user', 'invalid JSON');
            useAuthStore.getState().hydrate();

            expect(useAuthStore.getState().user).toBeNull();
            // Since originally logged out/guest flag could be undefined
            expect(localStorage.getItem('mi-carrerita-user')).toBeNull(); // Removed from storage
        });
    });
});
