import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
  login: (username: string) => void;
  logout: () => void;
  initialiseAuth: () => void;
}

export const useAuthState = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  // Called after RS or HD enters their name
  login: (username: string) => {
    localStorage.setItem("acquire_auth_user", username);
    set({
      isAuthenticated: true,
      user: username,
    });
  },

  // Clears localStorage + resets state
  logout: () => {
    localStorage.removeItem("acquire_auth_user");
    set({
      isAuthenticated: false,
      user: null,
    });
  },

  // Runs when the app loads or refreshes
  initialiseAuth: () => {
    const savedUser = localStorage.getItem("acquire_auth_user");
    if (savedUser) {
      set({
        isAuthenticated: true,
        user: savedUser,
      });
    }
  },
}));
