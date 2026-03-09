import { useState } from 'react';
import { FileImage, Download, CheckCircle, Upload, Database, Zap } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import { uploadArchivo, getArchivoUrl, bulkInsertOrdenes } from '../services/api';

export default function FilesPage() {
  // ── File Management State ──────────────────────────
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileMsg, setFileMsg] = useState({ text: '', isError: false });
  const [preview, setPreview] = useState(null);

  // ── Bulk Operations State ──────────────────────────
  const [bulkCantidad, setBulkCantidad] = useState(1000);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState({ text: '', isError: false });
  const [bulkResult, setBulkResult] = useState(null);

  // ── File Upload Handler ────────────────────────────
  const handleUpload = async (file) => {
    setUploading(true);
    setFileMsg({ text: '', isError: false });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadArchivo(formData);
      const newFile = {
        id: res.data.file_id,
        name: res.data.file_name || file.name,
        size: file.size,
        type: file.type,
        url: getArchivoUrl(res.data.file_id),
        uploadedAt: new Date().toLocaleString(),
      };
      setFiles((prev) => [newFile, ...prev]);
      setFileMsg({ text: res.data.message || 'File uploaded successfully', isError: false });

      if (file.type.startsWith('image/')) {
        setPreview(newFile.url);
      }
    } catch (err) {
      setFileMsg({
        text: err.response?.data?.error || 'Error uploading file',
        isError: true,
      });
    } finally {
      setUploading(false);
    }
  };

  // ── Bulk Insert Handler ────────────────────────────
  const handleBulkInsert = async () => {
    setBulkLoading(true);
    setBulkMsg({ text: '', isError: false });
    setBulkResult(null);
    try {
      const res = await bulkInsertOrdenes(bulkCantidad);
      setBulkResult({
        documentos_creados: res.data.documentos_creados,
        status: res.data.status,
        message: res.data.message,
      });
      setBulkMsg({
        text: res.data.message || `Successfully created ${res.data.documentos_creados} orders`,
        isError: false,
      });
    } catch (err) {
      setBulkMsg({
        text: err.response?.data?.error || 'Error performing bulk insert',
        isError: true,
      });
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-10">
      {/* ═══════════════════════════════════════════════════
          SECTION 1: File Management (GridFS)
          ═══════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-100 rounded-xl">
            <Upload size={22} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">File Management (GridFS)</h2>
            <p className="text-sm text-gray-500">Upload and manage files using MongoDB GridFS</p>
          </div>
        </div>

        {/* GridFS Info Card */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <Database size={20} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-indigo-800 mb-1">How GridFS Works</h4>
              <p className="text-sm text-indigo-700 leading-relaxed">
                MongoDB GridFS stores files by splitting them into chunks
                (<code className="bg-indigo-100 px-1.5 py-0.5 rounded text-xs font-mono">fs.chunks</code>, 255KB each)
                and metadata
                (<code className="bg-indigo-100 px-1.5 py-0.5 rounded text-xs font-mono">fs.files</code>).
                This allows storing files larger than 16MB.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Status Message */}
        {fileMsg.text && (
          <div
            className={`p-3 rounded-lg text-sm flex items-center gap-2 mb-4 ${
              fileMsg.isError
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {!fileMsg.isError && <CheckCircle size={16} />}
            {fileMsg.text}
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload File</h3>
          <FileUpload onUpload={handleUpload} loading={uploading} />
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Image Preview</h3>
              <button
                onClick={() => setPreview(null)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="flex justify-center">
              <img
                src={preview}
                alt="Preview"
                className="max-h-80 rounded-lg shadow-sm border border-gray-200"
                onError={() => setPreview(null)}
              />
            </div>
          </div>
        )}

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Uploaded Files ({files.length})
            </h3>
            <div className="space-y-3">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <FileImage size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{f.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatSize(f.size)} &middot; {f.uploadedAt}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">ID: {f.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.type?.startsWith('image/') && (
                      <button
                        onClick={() => setPreview(f.url)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
                      >
                        Preview
                      </button>
                    )}
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* ═══════════════════════════════════════════════════
          SECTION 2: Bulk Operations
          ═══════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-100 rounded-xl">
            <Zap size={22} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Bulk Operations</h2>
            <p className="text-sm text-gray-500">Test MongoDB bulk write capabilities with mass data insertion</p>
          </div>
        </div>

        {/* Bulk Info Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <Database size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-800 mb-1">How BulkWrite Works</h4>
              <p className="text-sm text-amber-700 leading-relaxed">
                BulkWrite inserts many documents efficiently in a single operation.
                This demonstrates MongoDB's bulk write capabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Bulk Status Message */}
        {bulkMsg.text && (
          <div
            className={`p-3 rounded-lg text-sm flex items-center gap-2 mb-4 ${
              bulkMsg.isError
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {!bulkMsg.isError && <CheckCircle size={16} />}
            {bulkMsg.text}
          </div>
        )}

        {/* Bulk Insert Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Test Orders</h3>

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-4">
            <div className="w-full sm:w-auto">
              <label htmlFor="bulkCantidad" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                id="bulkCantidad"
                type="number"
                min={100}
                max={100000}
                value={bulkCantidad}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) setBulkCantidad(Math.min(100000, Math.max(100, val)));
                }}
                className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-colors"
                disabled={bulkLoading}
              />
              <p className="text-xs text-gray-400 mt-1">Min: 100 &middot; Max: 100,000</p>
            </div>

            <button
              onClick={handleBulkInsert}
              disabled={bulkLoading}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                bulkLoading
                  ? 'bg-amber-300 text-amber-800 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {bulkLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Inserting...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Generate Test Orders
                </>
              )}
            </button>
          </div>

          {/* Loading Progress Message */}
          {bulkLoading && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-amber-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Inserting {bulkCantidad.toLocaleString()} orders...
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    This may take a moment depending on the quantity. Please wait.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Result Display */}
          {bulkResult && !bulkLoading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Bulk Insert Complete</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-green-700">
                      Documents created:{' '}
                      <span className="font-bold">{bulkResult.documentos_creados?.toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-green-700">
                      Status: <span className="font-medium">{bulkResult.status}</span>
                    </p>
                    {bulkResult.message && (
                      <p className="text-sm text-green-600">{bulkResult.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <p className="text-xs text-gray-400 italic">
            This creates test orders in the database for volume testing purposes.
          </p>
        </div>
      </section>
    </div>
  );
}
