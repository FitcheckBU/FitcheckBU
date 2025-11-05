import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { StoreRecord, UserRecord, UserType } from "../lib/userService";

export interface AuthenticatedUser extends UserRecord {
  buyerLocation?: string;
  store?: StoreRecord;
}

interface UserContextValue {
  user: AuthenticatedUser | null;
  setUser: (user: AuthenticatedUser) => void;
  signOut: () => void;
}

const USER_STORAGE_KEY = "fitcheck_user";

const UserContext = createContext<UserContextValue | undefined>(undefined);

const readStoredUser = (): AuthenticatedUser | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    const parsed = JSON.parse(stored) as AuthenticatedUser & {
      user_type: UserType;
    };
    return parsed;
  } catch {
    return null;
  }
};

const writeStoredUser = (user: AuthenticatedUser | null) => {
  if (typeof window === "undefined") {
    return;
  }
  if (!user) {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<AuthenticatedUser | null>(() =>
    readStoredUser(),
  );

  useEffect(() => {
    writeStoredUser(user);
  }, [user]);

  const setUser = useCallback((nextUser: AuthenticatedUser) => {
    setUserState(nextUser);
  }, []);

  const signOut = useCallback(() => {
    setUserState(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      signOut,
    }),
    [signOut, setUser, user],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
