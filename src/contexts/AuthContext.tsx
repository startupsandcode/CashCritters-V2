
import { createContext, useContext } from "react";
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

interface AuthUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const loading = status === "loading";
  const user = session?.user ?? null;

  const signUp = async (email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to create account");
    }
    await nextAuthSignIn("credentials", { email, password, redirect: false });
  };

  const signIn = async (email: string, password: string) => {
    const result = await nextAuthSignIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      throw new Error("Invalid email or password");
    }
  };

  const signInWithGoogle = async () => {
    await nextAuthSignIn("google", { redirect: false });
  };

  const logout = async () => {
    await nextAuthSignOut({ redirect: false });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
