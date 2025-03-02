
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

export const authService = {
  signUp: async (email: string, password: string): Promise<UserCredential> => {
    return createUserWithEmailAndPassword(auth, email, password);
  },
  
  signIn: async (email: string, password: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
  },
  
  signInWithGoogle: async (): Promise<UserCredential> => {
    return signInWithPopup(auth, googleProvider);
  },
  
  signOut: async (): Promise<void> => {
    return signOut(auth);
  }
};
