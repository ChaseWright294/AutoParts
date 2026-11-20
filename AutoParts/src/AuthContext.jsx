import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'autoparts-user';

// Reads the saved user so a page refresh doesn't log you out.
// localStorage can throw (private windows, blocked storage), so fail quietly.
function loadSavedUser() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(loadSavedUser);

    function login(newUser) {
        setUser(newUser);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser)); } catch { /* ignore */ }
    }

    function logout() {
        setUser(null);
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Any component can call: const { user, login, logout } = useAuth();
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
    return context;
}
