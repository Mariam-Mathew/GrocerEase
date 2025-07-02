import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userID: string | null;
  isInitialized: boolean;
  isLoading: boolean;

  // Actions
  login: (tokens: {
    accessToken: string;
    refreshToken: string;
    userID?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setTokens: (tokens: {
    accessToken: string;
    refreshToken: string;
    userID?: string;
  }) => void;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER_ID: "userID",
};

const useStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  userID: null,
  isInitialized: false,
  isLoading: false,

  initializeAuth: async () => {
    if (get().isInitialized) {
      console.log("Store: Auth already initialized");
      return;
    }

    try {
      console.log("Store: Starting auth initialization...");
      set({ isLoading: true });

      const [accessToken, refreshToken, userID] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
      ]);

      console.log("Store: Retrieved tokens from storage:", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasUserID: !!userID,
      });

      set({
        accessToken,
        refreshToken,
        userID,
        isInitialized: true,
        isLoading: false,
      });

      console.log("Store: Auth initialization completed successfully");
    } catch (error) {
      console.error("Store: Auth initialization failed:", error);
      // Mark as initialized even on error to prevent infinite loading
      set({
        isInitialized: true,
        isLoading: false,
        // Clear any partial data on error
        accessToken: null,
        refreshToken: null,
        userID: null,
      });
    }
  },

  setTokens: (tokens) => {
    console.log("Store: Setting tokens in memory");
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userID: tokens.userID || null,
    });
  },

  login: async (tokens) => {
    try {
      console.log("Store: Starting login process...");
      set({ isLoading: true });

      // Validate tokens
      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error("Invalid tokens provided");
      }

      // Save to AsyncStorage
      const storagePromises = [
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
      ];

      if (tokens.userID) {
        storagePromises.push(
          AsyncStorage.setItem(STORAGE_KEYS.USER_ID, tokens.userID)
        );
      } else {
        storagePromises.push(AsyncStorage.removeItem(STORAGE_KEYS.USER_ID));
      }

      await Promise.all(storagePromises);
      console.log("Store: Tokens saved to AsyncStorage");

      // Update state
      set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userID: tokens.userID || null,
        isLoading: false,
      });

      console.log("Store: Login completed successfully");
    } catch (error) {
      console.error("Store: Login failed:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      console.log("Store: Starting logout process...");
      set({ isLoading: true });

      // Clear AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
      ]);

      console.log("Store: Tokens removed from AsyncStorage");

      // Clear state
      set({
        accessToken: null,
        refreshToken: null,
        userID: null,
        isLoading: false,
      });

      console.log("Store: Logout completed successfully");
    } catch (error) {
      console.error("Store: Logout failed:", error);
      set({ isLoading: false });
      throw error;
    }
  },
}));

export default useStore;
