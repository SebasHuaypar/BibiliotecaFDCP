
"use client";

import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import type { UserCredentials } from '@/types';

interface AuthContextType {
  user: UserCredentials | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Path to the users JSON file (relative to the public directory)
// IMPORTANT: For static export, this file MUST be in the `public` directory.
const USERS_JSON_PATH = '/data/users.json';

async function fetchUsers(): Promise<UserCredentials[]> {
  try {
    // Use fetch API to get the JSON file
    const response = await fetch(USERS_JSON_PATH);
    if (!response.ok) {
      // If the file doesn't exist (e.g., first run), return an empty array
      if (response.status === 404) {
        console.warn('users.json not found. Starting with empty user list.');
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const users = await response.json();
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error('Error fetching or parsing users.json:', error);
    return []; // Return empty array on error
  }
}

// IMPORTANT: Writing to users.json is NOT possible in a static deployment like GitHub Pages.
// This function simulates the write for local dev but won't persist in production.
// A real backend or alternative (like browser's localStorage for demo) is needed for persistent registration.
async function saveUsers(users: UserCredentials[]): Promise<boolean> {
    console.warn("Simulating saveUsers. In a static deployment, this won't persist changes to users.json.");
    // In a Node.js environment (local dev), you might use fs.promises.writeFile
    // For this static setup, we can't actually write to the file system from the browser.
    // We'll just return true to simulate success.
    // To make registration 'appear' to work during a session, you could update an in-memory array,
    // but it won't persist across page loads or for other users.
    return true; // Simulate success
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserCredentials | null>(null);
  const [users, setUsers] = useState<UserCredentials[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      // Load users from JSON
      const loadedUsers = await fetchUsers();
      setUsers(loadedUsers);

      // Check localStorage for persisted login
      try {
        const storedUser = localStorage.getItem('biblioUser');
        if (storedUser) {
          const parsedUser: UserCredentials = JSON.parse(storedUser);
           // Optional: Verify user still exists in users.json (in case deleted)
           if (loadedUsers.some(u => u.username === parsedUser.username)) {
                setUser(parsedUser);
           } else {
               localStorage.removeItem('biblioUser'); // Clean up invalid stored user
           }
        }
      } catch (error) {
        console.error("Error reading user from localStorage:", error);
        localStorage.removeItem('biblioUser'); // Clear potentially corrupted data
      } finally {
          setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const foundUser = users.find(
      (u) => u.username === username && u.password === password // Plain text comparison (INSECURE!)
    );

    if (foundUser) {
      setUser(foundUser);
       try {
           localStorage.setItem('biblioUser', JSON.stringify(foundUser));
       } catch (error) {
            console.error("Error saving user to localStorage:", error);
       }
      return true;
    }
    return false;
  };

 const register = async (username: string, password: string): Promise<boolean> => {
    const existingUser = users.find((u) => u.username === username);
    if (existingUser) {
      console.error('Username already exists');
      return false; // Username already exists
    }

    const newUser: UserCredentials = { username, password };
    const updatedUsers = [...users, newUser];

    // Attempt to "save" (will only work in theory/local dev, not on static host)
    const success = await saveUsers(updatedUsers);

    if (success) {
        // Update state immediately for responsiveness, even if save isn't real
        setUsers(updatedUsers);
        console.log("User registered (simulated save):", newUser);
        return true;
    } else {
        console.error("Failed to 'save' new user.");
        return false;
    }
};


  const logout = () => {
    setUser(null);
    try {
        localStorage.removeItem('biblioUser');
    } catch (error) {
        console.error("Error removing user from localStorage:", error);
    }
    // Optionally force a reload to clear state completely or redirect to login
    // window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
