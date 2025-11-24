import React, { useState, ReactNode } from "react";
import { PhotoContext } from "./photoContextStore";

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
