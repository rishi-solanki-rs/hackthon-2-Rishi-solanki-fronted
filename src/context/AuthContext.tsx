import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, JoinSocietyInput } from '@sidekit/shared';
import { sidekitService } from '../services';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  switchPersona: (userId: string) => Promise<void>;
  joinSociety: (data: JoinSocietyInput) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  simulatedTime: Date;
  advanceClock: (hours: number) => void;
  resetClock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [simulatedTime, setSimulatedTime] = useState<Date>(sidekitService.getSimulatedTime());

  const loadData = async () => {
    // A sleeping free-tier backend can take up to a minute to wake, so retry with backoff
    const retryDelaysMs = [2000, 5000, 10000, 20000, 30000];
    setIsLoading(true);
    for (let attempt = 0; ; attempt++) {
      try {
        const [user, users] = await Promise.all([
          sidekitService.getCurrentUser(),
          sidekitService.getAllUsers(),
        ]);
        setCurrentUser(user);
        setAllUsers(users);
        setSimulatedTime(sidekitService.getSimulatedTime());
        break;
      } catch (err) {
        if (attempt >= retryDelaysMs.length) {
          console.error('Failed to load auth context:', err);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelaysMs[attempt]));
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const switchPersona = async (userId: string) => {
    const user = await sidekitService.switchUser(userId);
    setCurrentUser(user);
  };

  const joinSociety = async (data: JoinSocietyInput) => {
    const user = await sidekitService.joinSociety(data);
    setCurrentUser(user);
    const users = await sidekitService.getAllUsers();
    setAllUsers(users);
  };

  const refreshCurrentUser = async () => {
    const user = await sidekitService.getCurrentUser();
    setCurrentUser(user);
  };

  const advanceClock = (hours: number) => {
    sidekitService.advanceSimulatedHours(hours);
    setSimulatedTime(sidekitService.getSimulatedTime());
  };

  const resetClock = () => {
    sidekitService.resetSimulatedTime();
    setSimulatedTime(sidekitService.getSimulatedTime());
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        switchPersona,
        joinSociety,
        refreshCurrentUser,
        simulatedTime,
        advanceClock,
        resetClock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

