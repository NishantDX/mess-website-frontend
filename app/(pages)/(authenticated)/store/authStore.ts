// firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from "firebase/auth";
import { auth } from "@/config/firebase/firebaseConfig";
import { User } from "@/utils/type";
import { create } from "zustand";
import axios from "axios";

// Return type definition
interface AuthResponse {
  user: UserCredential["user"];
  token: string;
}

type authStore = {
  user?: User;
  isAuthenticated: boolean;
  loading: boolean;
  logIn: (email: string, password: string) => Promise<AuthResponse>;
  restoreUser: (idToken: string | null) => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  logOut: () => Promise<void>;
};

// const useAuth = create<authStore>()((set, get) => ({
//     user:undefined;

// }))
export const useAuth = create<authStore>()((set, get) => ({
  user: undefined,
  isAuthenticated: false,
  loading: true,

  logIn: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      if (!email || typeof email !== "string" || !email.includes("@")) {
        throw new Error("Invalid email format");
      }
      // First authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();

      // Send the token to your backend with axios
      // const response = await axios.get("/api/auth/login", {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      //   // For GET requests, use params for query parameters
      //   params: {
      //     email,
      //     uid: firebaseUser.uid,
      //   },
      // });
      // const userData = response.data.user;
      // set({
      //   user: {
      //     uid: userData.uid,
      //     name: userData.name,
      //     email: userData.email,
      //     phone: userData.phone || firebaseUser.phoneNumber || "",
      //     student_id: userData.student_id,
      //     department: userData.department,
      //     role: userData.role,
      //   },
      //   isAuthenticated: true,
      // });
      return {
        user: firebaseUser,
        token,
      };
    } catch (error: unknown) {
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        console.error(
          "Backend authentication error:",
          error.response?.data || error.message
        );
        throw new Error(
          error.response?.data?.message || "Authentication failed"
        );
      }

      // Handle Firebase auth errors
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
    ) {
      const code = (error as { code: string }).code;
      if (code === "auth/user-not-found" || code === "auth/wrong-password") {
        throw new Error("Invalid email or password");
      } else if (code === "auth/too-many-requests") {
        throw new Error(
          "Too many failed login attempts. Please try again later."
        );
      }
    }

    // Fallback for unknown errors
    let message = "Unknown error";
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      message = (error as { message: string }).message;
    }
    console.error("Login failed:", error);
    throw new Error("Login failed: " + message);
  }
  },
  signUp: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const token = await user.getIdToken();
      console.log(token);
      return { user, token };
    } catch (error: unknown) {
      // Firebase auth errors have code property
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string"
      ) {
        const code = (error as { code: string }).code;
        if (code === "auth/email-already-in-use") {
          throw new Error("Email already in use");
        } else if (code === "auth/invalid-email") {
          throw new Error("Invalid email format");
        } else if (code === "auth/weak-password") {
          throw new Error("Password is too weak");
        }
      }
      console.error("Firebase auth error:", error);
      let message = "Unknown error";
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
      ) {
        message = (error as { message: string }).message;
      }
      throw new Error("Signup failed: " + message);
    }
  },

  async restoreUser(idToken) {
    if (!idToken) return set({ loading: false });
    try {
      console.log("user id token = ", idToken);
      // Make the API call
      const response = await axios.get("/api/auth/login", {
        headers: {
          Authorization: `Bearer ${idToken}`, // Use the idToken from the parameter
        },
      });

      console.log("User data from API:", response.data);
      const userData = response.data.user || response.data;

      // Update the state
      set({
        user: userData,
        loading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Error restoring user:", error);
      set({ loading: false });
    }
  },

  logOut: async () => {
    try {
      await signOut(auth);
      set({ user: undefined, isAuthenticated: false });
      localStorage.removeItem("authToken"); // if you're storing tokens
      console.log("Auth state after logout:", {
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  },
}));
// export const signup = async (
//   email: string,
//   password: string
// ): Promise<AuthResponse> => {
//   try {
//     const userCredential = await createUserWithEmailAndPassword(
//       auth,
//       email,
//       password
//     );
//     const user = userCredential.user;
//     const token = await user.getIdToken();
//     return { user, token };
//   } catch (error: any) {
//     // Firebase auth errors have code property
//     if (error.code === "auth/email-already-in-use") {
//       throw new Error("Email already in use");
//     } else if (error.code === "auth/invalid-email") {
//       throw new Error("Invalid email format");
//     } else if (error.code === "auth/weak-password") {
//       throw new Error("Password is too weak");
//     } else {
//       console.error("Firebase auth error:", error);
//       throw new Error("Signup failed: " + (error.message || "Unknown error"));
//     }
//   }
// };

// export const login = async (
//   email: string,
//   password: string
// ): Promise<AuthResponse> => {
//   try {
//     // First authenticate with Firebase
//     const userCredential = await signInWithEmailAndPassword(
//       auth,
//       email,
//       password
//     );
//     const firebaseUser = userCredential.user;
//     const token = await firebaseUser.getIdToken();

//     const response = await axios.post(
//       "/api/auth/login",
//       {
//         email,
//         uid: firebaseUser.uid,
//         // Add any other data you want to send to backend
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     return {
//       user: {
//         ...firebaseUser,
//         ...response.data.user, // Merge any additional user data from your backend
//       },
//       token,
//     };
//   } catch (error) {
//     // Handle axios errors
//     if (axios.isAxiosError(error)) {
//       console.error(
//         "Backend authentication error:",
//         error.response?.data || error.message
//       );
//       throw new Error(error.response?.data?.message || "Authentication failed");
//     }

//     // Handle Firebase auth errors
//     if (
//       error.code === "auth/user-not-found" ||
//       error.code === "auth/wrong-password"
//     ) {
//       throw new Error("Invalid email or password");
//     } else if (error.code === "auth/too-many-requests") {
//       throw new Error(
//         "Too many failed login attempts. Please try again later."
//       );
//     } else {
//       console.error("Login failed:", error);
//       throw new Error("Login failed: " + (error.message || "Unknown error"));
//     }
//   }
// };
