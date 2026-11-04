import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshUserProfile: () => Promise<UserProfile | null>;
  openAuthModal: (mode?: 'login' | 'register', redirectAction?: 'postAd' | 'admin' | null) => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  authRedirectAction: 'postAd' | 'admin' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'mela_user_profile';
const REGISTERED_USERS_KEY = 'mela_registered_users';

// Pre-seeded accounts (all default to ordinary user role until database grant)
const defaultDemoUsers: { profile: UserProfile; passwordHash: string }[] = [
  {
    profile: {
      id: 'user-miki',
      name: 'Mikiyae Lebrhane',
      email: 'mikiaelebrhane21@gmail.com',
      phone: '+251904503245',
      role: 'user', // Default to 'user'; admin privileges must be granted database-side
      createdAt: '2026-10-01',
    },
    passwordHash: 'admin123',
  },
  {
    profile: {
      id: 'seller-almaz',
      name: 'Almaz Kebede (Verified Merchant)',
      email: 'almaz@melamarket.et',
      phone: '+251904503245',
      role: 'seller',
      createdAt: '2026-10-05',
    },
    passwordHash: 'seller123',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authRedirectAction, setAuthRedirectAction] = useState<'postAd' | 'admin' | null>(null);

  // Initialize registered users in local storage if not present
  useEffect(() => {
    const existing = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!existing) {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(defaultDemoUsers));
    }
  }, []);

  // Fetch / refresh user profile from database
  const refreshUserProfile = async (): Promise<UserProfile | null> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const freshUser: UserProfile = {
              id: profile.id,
              name: profile.name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || profile.email || '',
              phone: profile.phone || '',
              role: profile.role || 'user',
              createdAt: profile.created_at || new Date().toISOString(),
            };
            setUser(freshUser);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(freshUser));
            return freshUser;
          }
        }
      } catch (err) {
        console.warn('Failed to refresh Supabase profile:', err);
      }
    }
    return user;
  };

  // Restore session
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              const freshUser: UserProfile = {
                id: profile.id,
                name: profile.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || profile.email || '',
                phone: profile.phone || '',
                role: profile.role || 'user',
                createdAt: profile.created_at || new Date().toISOString(),
              };
              setUser(freshUser);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(freshUser));
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Supabase session check failed, falling back to local session', err);
        }
      }

      // Fallback local session
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
        } catch (e) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login', redirectAction: 'postAd' | 'admin' | null = null) => {
    setAuthModalMode(mode);
    setAuthRedirectAction(redirectAction);
    setError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setError(null);
  };

  const clearError = () => setError(null);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    // Validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      const err = 'Please enter a valid email address.';
      setError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    if (!password || password.length < 6) {
      const err = 'Password must be at least 6 characters.';
      setError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    // Try Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (sbError) {
          setError(sbError.message);
          setIsLoading(false);
          return { success: false, error: sbError.message };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const userProfile: UserProfile = {
            id: data.user.id,
            name: profile?.name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || cleanEmail,
            phone: profile?.phone || '',
            role: profile?.role || 'user', // Strictly database-side role check
            createdAt: profile?.created_at || new Date().toISOString(),
          };

          setUser(userProfile);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
          setIsLoading(false);
          setIsAuthModalOpen(false);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase auth failed, verifying via local store', err);
      }
    }

    // Local authentication check
    const rawUsers = localStorage.getItem(REGISTERED_USERS_KEY);
    const users: { profile: UserProfile; passwordHash: string }[] = rawUsers ? JSON.parse(rawUsers) : defaultDemoUsers;

    const matched = users.find(u => u.profile.email.toLowerCase() === cleanEmail);

    if (!matched) {
      const err = 'Invalid email or password. No account found with this email.';
      setError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    if (matched.passwordHash !== password) {
      const err = 'Incorrect password. Please verify and try again.';
      setError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    // Role comes strictly from the stored account profile
    const updatedProfile: UserProfile = {
      ...matched.profile,
      role: matched.profile.role || 'user',
    };

    setUser(updatedProfile);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedProfile));
    setIsLoading(false);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const signUp = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    const cleanPhone = data.phone.trim();

    if (!cleanName || cleanName.length < 2) {
      const err = 'Please provide your full name.';
      setError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      const err = 'Please enter a valid email address.';
      setError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    if (!cleanPhone || cleanPhone.length < 9) {
      const err = 'Please enter a valid Ethiopian telephone number.';
      setError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    if (!data.password || data.password.length < 6) {
      const err = 'Password must be at least 6 characters.';
      setError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    // Check duplicate in local store
    const rawUsers = localStorage.getItem(REGISTERED_USERS_KEY);
    const users: { profile: UserProfile; passwordHash: string }[] = rawUsers ? JSON.parse(rawUsers) : defaultDemoUsers;

    if (users.some(u => u.profile.email.toLowerCase() === cleanEmail)) {
      const err = 'An account with this email already exists. Please sign in instead.';
      setError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    // Supabase SignUp if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sbData, error: sbError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone,
            },
          },
        });

        if (sbError) {
          setError(sbError.message);
          setIsLoading(false);
          return { success: false, error: sbError.message };
        }

        if (sbData.user) {
          const role = 'user'; // All new accounts are standard users; admin role must be granted database-side
          await supabase.from('profiles').insert([
            {
              id: sbData.user.id,
              name: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              role,
            },
          ]);

          const newProfile: UserProfile = {
            id: sbData.user.id,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            role,
            createdAt: new Date().toISOString(),
          };

          setUser(newProfile);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newProfile));
          setIsLoading(false);
          setIsAuthModalOpen(false);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase signup error, continuing with local profile registration', err);
      }
    }

    // Local profile creation (always user role by default)
    const newId = 'user-' + Date.now().toString(36);
    const role = 'user';

    const newProfile: UserProfile = {
      id: newId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role,
      createdAt: new Date().toISOString().split('T')[0],
    };

    users.push({
      profile: newProfile,
      passwordHash: data.password,
    });

    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    setUser(newProfile);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newProfile));
    setIsLoading(false);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn(e);
      }
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Strictly check that the verified user object possesses the administrator role
  const isAdmin = Boolean(user && user.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        clearError,
        refreshUserProfile,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalMode,
        authRedirectAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
