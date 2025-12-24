import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load from local storage on mount
        const savedUser = localStorage.getItem('runclub_user');
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            // Backward compatibility for users who didn't reset
            if (!parsed.team) {
                parsed.team = 'blue';
                parsed.color = '#3b82f6';
            }
            setUser(parsed);
        }
        setLoading(false);
    }, []);

    const login = (name, team = 'blue') => {
        // Generate a random ID 
        const newUser = {
            id: crypto.randomUUID(),
            name: name,
            team: team,
            // Use Team Color
            color: team === 'blue' ? '#3b82f6' : '#ef4444',
            joinedAt: new Date().toISOString()
        };

        localStorage.setItem('runclub_user', JSON.stringify(newUser));
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('runclub_user');
        setUser(null);
    };

    return (
        <UserContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
