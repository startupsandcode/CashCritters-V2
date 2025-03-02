
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  UserCredential
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export const authService = {
  signUp: async (email: string, password: string): Promise<UserCredential> => {
    return createUserWithEmailAndPassword(auth, email, password);
  },
  
  signIn: async (email: string, password: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
  },
  
  signOut: async (): Promise<void> => {
    return signOut(auth);
  }
};
