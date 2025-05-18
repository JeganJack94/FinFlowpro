import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  type User, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  googleSignIn: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<User> => {
    const response = await signInWithEmailAndPassword(auth, email, password);
    return response.user;
  };
  
  // Sign up with email and password
  const signUp = async (email: string, password: string): Promise<User> => {
    const response = await createUserWithEmailAndPassword(auth, email, password);
    return response.user;
  };
  
  // Sign in with Google
  const googleSignIn = async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const response = await signInWithPopup(auth, provider);
    return response.user;
  };
  
  // Sign out
  const logout = (): Promise<void> => {
    return signOut(auth);
  };
  
  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };
  
  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const value = {
    currentUser,
    loading,
    signIn,
    signUp,
    googleSignIn,
    logout,
    resetPassword,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
