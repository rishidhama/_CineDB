import { createContext, useContext, useEffect, useState } from "react";
import { getMe, loginRequest, registerRequest } from "../src/api/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  async function login(email, password) {
    const data = await loginRequest(email, password);
    localStorage.setItem("cinedb-token", data.token);
    setUser(data.user);
  }

  async function register(name, email, password) {
    const data = await registerRequest(name, email, password);
    localStorage.setItem("cinedb-token", data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("cinedb-token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
