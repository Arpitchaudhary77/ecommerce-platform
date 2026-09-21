import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
} from '../api';

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response =
          await getCurrentUser();

        setUser(
          response.data.user
        );
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function register(
    data
  ) {
    const response =
      await registerUser(
        data
      );

    setUser(
      response.data.user
    );

    return response.data.user;
  }

  async function login(
    data
  ) {
    const response =
      await loginUser(
        data
      );

    setUser(
      response.data.user
    );

    return response.data.user;
  }

  async function logout() {
    await logoutUser();

    setUser(null);
  }

  async function saveProfile(
    data
  ) {
    const response =
      await updateProfile(
        data
      );

    setUser(
      response.data.user
    );

    return response.data.user;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated:
          Boolean(user),
        register,
        login,
        logout,
        saveProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}
