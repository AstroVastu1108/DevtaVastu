import { FileType } from '../types';

export const isValidFileType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  return validTypes.includes(file.type);
};

export const createObjectURL = (file: File): string => {
  return URL.createObjectURL(file);
};

export const revokeObjectURL = (url: string): void => {
  URL.revokeObjectURL(url);
};