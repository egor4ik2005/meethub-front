import React, { createContext, useContext, useState, useCallback } from 'react';
import { MeetEvent } from '@/lib/mockData';

interface FavoritesContextType {
  favorites: MeetEvent[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (event: MeetEvent) => void;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<MeetEvent[]>([]);

  const isFavorite = useCallback((id: string) => favorites.some((e) => e.id === id), [favorites]);

  const toggleFavorite = useCallback((event: MeetEvent) => {
    setFavorites((prev) =>
      prev.some((e) => e.id === event.id)
        ? prev.filter((e) => e.id !== event.id)
        : [event, ...prev]
    );
  }, []);

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
