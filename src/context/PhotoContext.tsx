import React, { createContext, useState, useContext, ReactNode } from "react";

interface PhotoContextType {
  photos: string[];
  addPhoto: (photo: string) => void;
  setPhotos: (photos: string[]) => void;
  clearPhotos: () => void;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export const PhotoProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [photos, setPhotosState] = useState<string[]>([]);

  const addPhoto = (photo: string) => {
    setPhotosState((prevPhotos) => [...prevPhotos, photo]);
  };

  const setPhotos = (newPhotos: string[]) => {
    setPhotosState(newPhotos);
  };

  const clearPhotos = () => {
    setPhotosState([]);
  };

  return (
    <PhotoContext.Provider value={{ photos, addPhoto, setPhotos, clearPhotos }}>
      {children}
    </PhotoContext.Provider>
  );
};

export const usePhotoContext = () => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error("usePhotoContext must be used within a PhotoProvider");
  }
  return context;
};
