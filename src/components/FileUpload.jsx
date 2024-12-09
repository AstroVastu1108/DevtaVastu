import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { isValidFileType } from '../utils/fileUtils';

const FileUpload = ({ onFileSelect }) => {


  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onFileSelect}
    >
      <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
        <Upload size={20} />
        <span>Upload File</span>
        <input
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={onFileSelect}
        />
      </label>
    </div>
  );
};

export default FileUpload;