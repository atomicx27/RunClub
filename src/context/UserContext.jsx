import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(() => {
        // Load from local storage on initialization
        const savedUser = localStorage.getItem('runclub_user');
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            // Backward compatibility for users who didn't reset
            if (!parsed.team) {
                parsed.team = 'blue';
                parsed.color = '#3b82f6';
            }
            return parsed;
        }
        return null;
    });
    const [loading, setLoading] = useState(true);

    // Sync with Firebase Auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // If we have a local user but the ID doesn't match (old local storage)
                // we should probably update it or re-login.
                // For now, if we have a local user, we just ensure they are signed in.
                setUser(prev => {
                    if (prev && prev.id !== firebaseUser.uid) {
                        const updated = { ...prev, id: firebaseUser.uid };
                        localStorage.setItem('runclub_user', JSON.stringify(updated));
                        return updated;
                    }
                    return prev;
                });
            } else {
                // If not signed in to Firebase but we have a local user,
                // we need to re-authenticate them (handled by login or on load)
                if (user) {
                    signInAnonymously(auth).catch(console.error);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const login = async (name, team = 'blue') => {
        try {
            const userCredential = await signInAnonymously(auth);
            const newUser = {
                id: userCredential.user.uid,
                name: name,
                team: team,
                color: team === 'blue' ? '#3b82f6' : '#ef4444',
                joinedAt: new Date().toISOString()
            };

            localStorage.setItem('runclub_user', JSON.stringify(newUser));
            setUser(newUser);
        } catch (error) {
            console.error("Firebase Auth Error:", error);
        }
    };

    const logout = () => {
        auth.signOut();
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
