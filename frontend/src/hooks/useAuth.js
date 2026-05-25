import { useState, useEffect } from "react";
import { getCurrentUser, signOut, fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(async () => {
        const attributes = await fetchUserAttributes();
        setUser({ username: attributes.email });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function getToken() {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  }

  async function logout() {
    await signOut();
    setUser(null);
  }

  return { user, loading, logout, getToken };
}