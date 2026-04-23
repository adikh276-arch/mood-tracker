import React, { createContext, useContext, useEffect, useState } from 'react';
import { sql } from '@/lib/neon';

interface AuthContextType {
    userId: number | null;
    loading: boolean;
    isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userId, setUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMock, setIsMock] = useState(false);

    useEffect(() => {
        const validateToken = async () => {
            try {
                // Check URL parameters for token
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                
                if (token) {
                    sessionStorage.setItem('authToken', token);
                    // Immediately clean the URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                }

                const storedToken = sessionStorage.getItem('authToken');

                // Local development mockup fallback
                if (!storedToken && window.location.hostname === 'localhost') {
                    console.log('No token found on localhost, using mock user 1');
                    setUserId(1);
                    setIsMock(true);
                    setLoading(false);
                    return;
                }

                if (!storedToken) {
                    console.warn('No authentication token found');
                    window.location.href = '/token';
                    return;
                }

                console.log('Validating token:', storedToken);

                // Validate token via API
                try {
                    const response = await fetch('https://api.mantracare.com/user/user-info', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: storedToken })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`API Error (${response.status}):`, errorText);
                        throw new Error(`Auth API returned ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('API Response:', data);
                    
                    if (data && data.user_id) {
                        const validatedUserId = parseInt(data.user_id);
                        setUserId(validatedUserId);
                        setLoading(false);

                        // User Initialization (Upsert)
                        await sql`
                            INSERT INTO users (id) 
                            VALUES (${validatedUserId}) 
                            ON CONFLICT (id) DO NOTHING
                        `;
                    } else {
                        throw new Error('Invalid user data returned from API');
                    }
                } catch (apiError) {
                    console.error('API Validation failed, checking for mock fallback:', apiError);
                    
                    if (window.location.hostname === 'localhost') {
                        console.warn('API failed on localhost, falling back to mock user 1');
                        setUserId(1);
                        setIsMock(true);
                    } else {
                        throw apiError;
                    }
                }
            } catch (error) {
                console.error('Authentication error:', error);
                sessionStorage.removeItem('authToken');
                window.location.href = '/token';
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Preparing...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ userId, loading, isMock }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
