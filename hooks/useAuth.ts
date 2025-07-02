import useStore from "@/zustand/store";

/**
 * useAuth hook - Provides authentication state and actions
 */
const useAuth = () => {
  const {
    accessToken,
    refreshToken,
    userID,
    login,
    logout,
    isInitialized,
    isLoading,
  } = useStore();

  const isAuthenticated = !!accessToken && !!refreshToken;

  return {
    isInitialized,
    isAuthenticated,
    isLoading,
    accessToken,
    refreshToken,
    userID,
    login,
    logout,
  };
};

export default useAuth;
