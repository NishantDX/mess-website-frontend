// firebase/auth.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { auth } from "./firebaseConfig";

// Return type definition
interface AuthResponse {
  user: UserCredential["user"];
  token: string;
}

export const signup = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();
        return { user, token };
      } catch (error: any) {
        // Firebase auth errors have code property
        if (error.code === 'auth/email-already-in-use') {
          throw new Error('Email already in use');
        } else if (error.code === 'auth/invalid-email') {
          throw new Error('Invalid email format');
        } else if (error.code === 'auth/weak-password') {
          throw new Error('Password is too weak');
        } else {
          console.error('Firebase auth error:', error);
          throw new Error('Signup failed: ' + (error.message || 'Unknown error'));
        }
      }
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const token = await user.getIdToken();
  console.log(userCredential)
  return { user, token };
};
