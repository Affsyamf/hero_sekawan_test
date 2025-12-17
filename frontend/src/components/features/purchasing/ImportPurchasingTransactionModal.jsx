import { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Button from "../../ui/button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";
import { importApi } from "../../../services/import_service";

export default function ImportPurchasingTransactionModal({
  isOpen,
  onClose,
  onImportSuccess,
}) {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  const steps = [
    { n: 1, l: "Upload" },
    { n: 2, l: "Preview" },
    { n: 3, l: "Confirm" },
  ];

  const reset = () => {
    setStep(1);
    setFile(null);
    setPreview([]);
    setResult(null);
    setError(null);
    setProcessing(false);
  };

  // --- Fetch preview from backend ---
  const fetchPreview = async (f) => {
    setProcessing(true);
    try {
      const res = await importApi.previewLapPembelian(f);
      const data = res.data?.data;
      const sheetKey = Object.keys(data.sheets || {})[0];
      const sheet = data.sheets[sheetKey];

      setPreviewId(data.preview_id);

      setPreview({
        valid_rows: sheet.valid_rows,
        rows: sheet.preview_rows || [],
      });

      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Preview failed");
      setPreview({ valid_rows: 0, rows: [] });
    } finally {
      setProcessing(false);
    }
  };

  const selectFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      setError("Upload .xlsx file");
      return;
    }
    setFile(f);
    setError(null);
    await fetchPreview(f);
  };

  const next = () => {
    if (step === 1 && !file) {
      setError("Select file");
      return;
    }
    if (step === 2 && !(preview.rows?.length > 0)) {
      setError("No data");
      return;
    }
    setError(null);
    setStep((p) => p + 1);
  };

  const back = () => {
    setError(null);
    setStep((p) => p - 1);
  };

  // --- Perform actual import ---
  const doImport = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const res = await importApi.importLapPembelian(previewId);
      const data = res.data;
      setResult(data);
      if (onImportSuccess) onImportSuccess(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to import data"
      );
    } finally {
      setProcessing(false);
    }
  };

  // --- Render Step Indicator ---
  const renderIndicator = () => (
    <div
      className="px-6 py-4 border-b"
      style={{
        borderColor: colors.border.primary,
        backgroundColor: colors.background.secondary,
      }}
    >
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                  step >= s.n && "ring-2"
                )}
                style={{
                  backgroundColor:
                    step >= s.n ? colors.primary : colors.background.primary,
                  color:
                    step >= s.n ? colors.text.inverse : colors.text.secondary,
                  borderWidth: step >= s.n ? 0 : "2px",
                  borderColor: colors.border.primary,
                }}
              >
                {result && s.n === 3 ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  s.n
                )}
              </div>
              <span
                className="mt-2 text-sm font-medium"
                style={{
                  color: step >= s.n ? colors.primary : colors.text.secondary,
                }}
              >
                {s.l}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-1 mx-2 rounded"
                style={{
                  backgroundColor:
                    step > s.n ? colors.primary : colors.border.primary,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // --- Step 1: Upload ---
  const renderStep1 = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div
          className="p-8 text-center border-2 border-dashed rounded-lg"
          style={{ borderColor: colors.border.primary }}
        >
          <Upload
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: colors.text.secondary }}
          />
          <h3
            className="mb-2 text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            Upload Excel File
          </h3>
          <p className="mb-4 text-sm" style={{ color: colors.text.secondary }}>
            Select .xlsx with purchasing transactions
          </p>
          <input
            type="file"
            accept=".xlsx"
            onChange={selectFile}
            className="hidden"
            id="file-purch-trx"
          />
          <label
            htmlFor="file-purch-trx"
            className="inline-block px-4 py-2 rounded-lg cursor-pointer"
            style={{
              backgroundColor: colors.primary,
              color: colors.text.inverse,
            }}
          >
            Choose File
          </label>
          {file && (
            <div
              className="flex items-center gap-3 p-3 mt-4 rounded-lg"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <FileSpreadsheet
                className="w-5 h-5"
                style={{ color: colors.primary }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: colors.text.primary }}
              >
                {file.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- Step 2: Preview ---
  const renderStep2 = () => {
    // --- extract backend data ---
    const sheets = preview.sheets || []; // handled by fetchPreview below
    const validRows =
      preview.valid_rows || preview.total_rows || preview.length || 0;

    const totalRows = validRows || 0;
    const displayed = preview.rows
      ? preview.rows.slice(0, 30)
      : preview.slice(0, 30);

    const grouped = {};
    displayed.forEach((r) => {
      const k = r.no_bukti || r.tanggal;
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(r);
    });

    return (
      <div>
        <div
          className="p-4 mb-4 rounded-lg"
          style={{
            backgroundColor: `${colors.primary}15`,
            borderWidth: "1px",
            borderColor: colors.primary,
          }}
        >
          <p className="text-sm" style={{ color: colors.text.primary }}>
            <strong>{totalRows}</strong> row(s) imported
          </p>
        </div>

        {processing ? (
          <div
            className="py-6 text-sm text-center"
            style={{ color: colors.text.secondary }}
          >
            Loading preview...
          </div>
        ) : (
          <div
            className="overflow-hidden border rounded-lg"
            style={{ borderColor: colors.border.primary }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderBottomWidth: "1px",
                    borderColor: colors.border.primary,
                  }}
                >
                  <tr>
                    {[
                      "No",
                      "Sheet",
                      "No Bukti",
                      "Tanggal",
                      "Supplier",
                      "Nama Barang",
                      "Qty",
                      "Harga",
                      "Total",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-2 py-2 font-semibold text-left whitespace-nowrap"
                        style={{ color: colors.text.secondary }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((r, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottomWidth: "1px",
                        borderColor: colors.border.primary,
                      }}
                    >
                      <td className="px-2 py-2">{i + 1}</td>
                      <td className="px-2 py-2">{r.sheet}</td>
                      <td className="px-2 py-2 font-medium">{r.no_bukti}</td>
                      <td className="px-2 py-2">{r.tanggal}</td>
                      <td className="px-2 py-2">{r.supplier}</td>
                      <td className="px-2 py-2">{r.product}</td>
                      <td className="px-2 py-2 text-right">{r.qty}</td>
                      <td className="px-2 py-2 text-right">
                        {r.price?.toLocaleString?.() || 0}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {r.total?.toLocaleString?.() || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="p-3 text-sm text-center"
              style={{
                backgroundColor: colors.background.secondary,
                color: colors.text.secondary,
              }}
            >
              Showing {displayed.length} of {totalRows} rows
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Step 3: Confirm/Result ---
  const renderStep3 = () => {
    if (!result) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: colors.primary }}
          />
          <h3
            className="mb-2 text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            Ready to Import
          </h3>
          <p className="mb-6 text-sm" style={{ color: colors.text.secondary }}>
            {preview.length} detail(s) will be imported
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CheckCircle
          className="w-16 h-16 mx-auto mb-4"
          style={{ color: colors.status.success }}
        />
        <h3
          className="mb-2 text-lg font-semibold"
          style={{ color: colors.text.primary }}
        >
          Import Success!
        </h3>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Data imported successfully.
        </p>
      </div>
    );
  };

  // --- Actions ---
  const actions = (
    <>
      {step > 1 && !result && (
        <button
          onClick={back}
          disabled={processing}
          className="px-4 py-2 text-sm font-medium rounded-lg"
          style={{ color: colors.text.primary }}
        >
          Back
        </button>
      )}
      <div className="flex gap-3 ml-auto">
        <button
          onClick={() => {
            reset();
            onClose();
          }}
          className="px-4 py-2 text-sm font-medium rounded-lg"
          style={{
            backgroundColor: colors.background.primary,
            color: colors.text.primary,
            borderWidth: "1px",
            borderColor: colors.border.primary,
          }}
        >
          {result ? "Close" : "Cancel"}
        </button>
        {!result && (
          <>
            {step < 3 && (
              <Button
                icon={ChevronRight}
                label="Next"
                onClick={next}
                disabled={!file || (step === 2 && !(preview.rows?.length > 0))}
              />
            )}
            {step === 3 && (
              <button
                onClick={doImport}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium rounded-lg"
                style={{
                  backgroundColor: colors.status.success,
                  color: colors.text.inverse,
                }}
              >
                {processing ? "Importing..." : "Import"}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Import Purchasing Transactions"
      subtitle="Import purchasing data with details from Excel"
      size="xl"
      actions={actions}
      closeOnOverlayClick={!processing}
    >
      {renderIndicator()}
      <div className="mt-6">
        {error && (
          <div
            className="flex items-start gap-3 p-4 mb-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.error}15`,
              borderWidth: "1px",
              borderColor: colors.status.error,
            }}
          >
            <AlertCircle
              className="flex-shrink-0 w-5 h-5"
              style={{ color: colors.status.error }}
            />
            <p className="text-sm" style={{ color: colors.status.error }}>
              {error}
            </p>
          </div>
        )}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </Modal>
  );
}
