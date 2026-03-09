import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';

export default function FileUpload({ onUpload, loading }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      onUpload(file);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx"
      />
      <Upload className="mx-auto text-gray-400 mb-3" size={36} />
      {loading ? (
        <p className="text-sm text-indigo-600 font-medium">Uploading...</p>
      ) : fileName ? (
        <p className="text-sm text-gray-600">
          Selected: <span className="font-medium">{fileName}</span>
        </p>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-700">
            Click to upload a file
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Images, PDFs, Documents
          </p>
        </>
      )}
    </div>
  );
}
