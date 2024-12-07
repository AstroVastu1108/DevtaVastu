export const isValidFileType = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  return validTypes.includes(file.type);
};

export const createObjectURL = (file) => {
  return URL.createObjectURL(file);
};

export const revokeObjectURL = (url) => {
  URL.revokeObjectURL(url);
};