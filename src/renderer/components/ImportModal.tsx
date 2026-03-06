import React, { useState } from 'react';
import type { CsvImportResult } from '../../shared/types';

interface Props {
  onImported: () => void;
  onClose: () => void;
}

export default function ImportModal({ onImported, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);

  async function handleChooseFile() {
    const filePath = await window.api.openFileDialog();
    if (!filePath) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await window.api.importCsv(filePath);
      setResult(res);
      if (res.inserted > 0 || res.updated > 0) onImported();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-[460px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Import CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-3">
            Expects your standard Zendesk renewal CSV with these key columns:
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 mb-3 leading-relaxed">
            Account Name · Account ARR · Seats · Next_Renewal_Date · AE Name · AE Manager · Matched Segment(s)
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Renewal date uses <span className="font-mono">NEXT_RENEWAL_DATE</span> column. Products are pulled from <span className="font-mono">Matched Segment(s)</span>. All other columns are saved to Notes.
          </p>

          <button
            onClick={handleChooseFile}
            disabled={loading}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Importing…' : 'Choose CSV File'}
          </button>

          {result && (
            <div className="mt-4">
              {(result.inserted > 0 || result.updated > 0) && (
                <div className="text-sm text-green-700 font-medium space-y-0.5">
                  {result.inserted > 0 && (
                    <p>✓ {result.inserted} account{result.inserted !== 1 ? 's' : ''} added</p>
                  )}
                  {result.updated > 0 && (
                    <p>↻ {result.updated} account{result.updated !== 1 ? 's' : ''} updated</p>
                  )}
                </div>
              )}
              {result.failed > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-600 font-medium">{result.failed} row{result.failed !== 1 ? 's' : ''} had errors:</p>
                  <ul className="mt-1 text-xs text-red-500 space-y-0.5 max-h-32 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
