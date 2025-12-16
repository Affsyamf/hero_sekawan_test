import { useState, useEffect } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Button from "../../ui/button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";
import { importApi } from "../../../services/import_service";

export default function ImportColorKitchenModal({
  isOpen,
  onClose,
  onImportSuccess,
}) {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const steps = [
    { n: 1, l: "Upload" },
    { n: 2, l: "Preview" },
    { n: 3, l: "Confirm" },
  ];

  const reset = () => {
    setStep(1);
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setProcessing(false);
  };

  // 🔹 Fetch preview from backend
  const fetchPreview = async (f) => {
    setProcessing(true);
    try {
      const res = await importApi.previewLapCk(f);
      const data = res.data?.data;

      setPreview(data);
      setError(null);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Preview failed");
      setPreview(null);
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
    if (step === 2 && !preview) {
      setError("No preview data available");
      return;
    }
    // Check for missing products/designs before allowing to proceed
    if (step === 2) {
      const hasMissingProducts = preview?.missing_products?.length > 0;
      // const hasMissingDesigns = preview?.missing_designs?.length > 0;
      if (hasMissingProducts) {
        setError(
          "Cannot proceed: Missing products. Please fix these issues first."
        );
        return;
      }
    }
    setError(null);
    setStep((p) => p + 1);
  };

  const back = () => {
    setError(null);
    setStep((p) => p - 1);
  };

  // 🔹 Perform actual import
  const doImport = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await importApi.importLapCk(preview.preview_id);
      const data = res.data?.data || res.data;
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

  // --- Step indicator
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

  // --- Step 1: Upload
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
            Select .xlsx with Color Kitchen data
          </p>
          <input
            type="file"
            accept=".xlsx"
            onChange={selectFile}
            className="hidden"
            id="file-ck"
            disabled={processing}
          />
          <label
            htmlFor="file-ck"
            className={cn(
              "inline-block px-4 py-2 rounded-lg",
              processing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
            style={{
              backgroundColor: colors.primary,
              color: colors.text.inverse,
            }}
          >
            {processing ? "Processing..." : "Choose File"}
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
        <div
          className="p-4 mt-4 rounded-lg"
          style={{ backgroundColor: colors.background.secondary }}
        >
          <p className="text-xs" style={{ color: colors.text.secondary }}>
            <strong>Format:</strong> Sheet "TEMPLATE QTY" with OPJ, DESIGN,
            JENIS KAIN, ROLL, and TGL columns.
          </p>
          <p className="mt-1 text-xs" style={{ color: colors.text.secondary }}>
            Empty rows separate batches.
          </p>
        </div>
      </div>
    </div>
  );

  // --- Step 2: Preview
  const renderStep2 = () => {
    if (!preview) {
      return (
        <div
          className="py-6 text-sm text-center"
          style={{ color: colors.text.secondary }}
        >
          No preview data available
        </div>
      );
    }

    if (processing) {
      return (
        <div
          className="py-10 text-sm text-center"
          style={{ color: colors.text.secondary }}
        >
          Loading preview...
        </div>
      );
    }

    const {
      batches = [],
      missing_products = [],
      missing_designs = [],
      skipped_rows = [],
      batch_count = 0,
      skipped_rows_count = 0,
    } = preview;

    // Flatten entries for display
    const allEntries = batches.flatMap((b) =>
      b.entries.map((e) => ({
        batch_code: b.code,
        batch_date: b.date,
        ...e,
      }))
    );

    const totalEntries = allEntries.length;
    const hasErrors = missing_products.length > 0;
    // const hasErrors = missing_products.length > 0 || missing_designs.length > 0;

    return (
      <div>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.primary}15`,
              borderWidth: "1px",
              borderColor: colors.primary,
            }}
          >
            <p
              className="mb-1 text-xs"
              style={{ color: colors.text.secondary }}
            >
              Batches
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.text.primary }}
            >
              {batch_count}
            </p>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.success}15`,
              borderWidth: "1px",
              borderColor: colors.status.success,
            }}
          >
            <p
              className="mb-1 text-xs"
              style={{ color: colors.text.secondary }}
            >
              Entries
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.success }}
            >
              {totalEntries}
            </p>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.warning}15`,
              borderWidth: "1px",
              borderColor: colors.status.warning,
            }}
          >
            <p
              className="mb-1 text-xs"
              style={{ color: colors.text.secondary }}
            >
              Skipped Rows
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.warning }}
            >
              {skipped_rows_count}
            </p>
          </div>
        </div>

        {/* Missing Products Error */}
        {missing_products.length > 0 && (
          <div
            className="flex items-start gap-3 p-4 mb-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.error}15`,
              borderWidth: "1px",
              borderColor: colors.status.error,
            }}
          >
            <XCircle
              className="flex-shrink-0 w-5 h-5 mt-0.5"
              style={{ color: colors.status.error }}
            />
            <div className="flex-1">
              <p
                className="mb-2 text-sm font-medium"
                style={{ color: colors.status.error }}
              >
                Missing Products ({missing_products.length})
              </p>
              <p
                className="mb-2 text-xs"
                style={{ color: colors.text.secondary }}
              >
                These products are referenced but don't exist in the database.
                Please add them first:
              </p>
              <div className="space-y-1 overflow-y-auto max-h-40">
                {missing_products.map((product, idx) => (
                  <p
                    key={idx}
                    className="font-mono text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    • {product}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Missing Designs Error */}
        {/* {missing_designs.length > 0 && (
          <div
            className="flex items-start gap-3 p-4 mb-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.error}15`,
              borderWidth: "1px",
              borderColor: colors.status.error,
            }}
          >
            <XCircle
              className="flex-shrink-0 w-5 h-5 mt-0.5"
              style={{ color: colors.status.error }}
            />
            <div className="flex-1">
              <p
                className="mb-2 text-sm font-medium"
                style={{ color: colors.status.error }}
              >
                Missing Designs ({missing_designs.length})
              </p>
              <p
                className="mb-2 text-xs"
                style={{ color: colors.text.secondary }}
              >
                These designs are referenced but don't exist in the database.
                Please add them first:
              </p>
              <div className="space-y-1 overflow-y-auto max-h-40">
                {missing_designs.map((design, idx) => (
                  <p
                    key={idx}
                    className="font-mono text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    • {design}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )} */}

        {/* Skipped Rows Warning */}
        {skipped_rows.length > 0 && (
          <div
            className="flex items-start gap-3 p-4 mb-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.warning}15`,
              borderWidth: "1px",
              borderColor: colors.status.warning,
            }}
          >
            <AlertTriangle
              className="flex-shrink-0 w-5 h-5 mt-0.5"
              style={{ color: colors.status.warning }}
            />
            <div className="flex-1">
              <p
                className="mb-2 text-sm font-medium"
                style={{ color: colors.text.primary }}
              >
                {skipped_rows.length} row(s) skipped (empty separators)
              </p>
              <div className="flex flex-wrap gap-2">
                {skipped_rows.slice(0, 20).map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs rounded"
                    style={{
                      backgroundColor: colors.background.secondary,
                      color: colors.text.secondary,
                    }}
                  >
                    Row {item.row}
                  </span>
                ))}
                {skipped_rows.length > 20 && (
                  <span
                    className="text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    +{skipped_rows.length - 20} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Table - Only show if no errors */}
        {!hasErrors && (
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
                      "Batch Code",
                      "OPJ",
                      "Design",
                      "Jenis Kain",
                      "Rolls",
                      "Date",
                      "Paste Qty",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 font-semibold text-left whitespace-nowrap"
                        style={{ color: colors.text.secondary }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allEntries.slice(0, 30).map((r, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottomWidth: "1px",
                        borderColor: colors.border.primary,
                      }}
                    >
                      <td
                        className="px-3 py-2"
                        style={{ color: colors.text.secondary }}
                      >
                        {i + 1}
                      </td>
                      <td
                        className="px-3 py-2 font-mono text-xs"
                        style={{ color: colors.text.secondary }}
                      >
                        {r.batch_code}
                      </td>
                      <td
                        className="px-3 py-2 font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {r.code}
                      </td>
                      <td
                        className="px-3 py-2"
                        style={{ color: colors.text.primary }}
                      >
                        {r.design}
                      </td>
                      <td
                        className="px-3 py-2"
                        style={{ color: colors.text.secondary }}
                      >
                        {r.jenis_kain}
                      </td>
                      <td
                        className="px-3 py-2 text-right"
                        style={{ color: colors.text.primary }}
                      >
                        {r.rolls}
                      </td>
                      <td
                        className="px-3 py-2"
                        style={{ color: colors.text.secondary }}
                      >
                        {r.date?.split("T")[0] || "-"}
                      </td>
                      <td
                        className="px-3 py-2 text-right"
                        style={{ color: colors.text.primary }}
                      >
                        {r.paste_quantity?.toFixed(2) || 0}
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
              Showing {Math.min(30, allEntries.length)} of {totalEntries}{" "}
              entries
            </div>
          </div>
        )}

        {/* Blocking message if there are errors */}
        {hasErrors && (
          <div
            className="p-6 text-center rounded-lg"
            style={{
              backgroundColor: colors.background.secondary,
              borderWidth: "2px",
              borderColor: colors.status.error,
            }}
          >
            <XCircle
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: colors.status.error }}
            />
            <p
              className="mb-1 text-sm font-medium"
              style={{ color: colors.text.primary }}
            >
              Cannot Proceed with Import
            </p>
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              Please fix the missing products and/or designs above before
              importing.
            </p>
          </div>
        )}
      </div>
    );
  };

  // --- Step 3: Confirm/Result
  const renderStep3 = () => {
    if (!result) {
      const totalEntries =
        preview?.batches?.reduce(
          (sum, b) => sum + (b.entries?.length || 0),
          0
        ) || 0;

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
          <div className="space-y-2 text-center">
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              <strong style={{ color: colors.primary }}>{totalEntries}</strong>{" "}
              entries in{" "}
              <strong style={{ color: colors.primary }}>
                {preview?.batch_count || 0}
              </strong>{" "}
              batches will be imported
            </p>
          </div>
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
          Color Kitchen data imported successfully.
        </p>
      </div>
    );
  };

  // --- Actions
  const hasValidationErrors = preview?.missing_products?.length > 0;
  // preview?.missing_products?.length > 0 ||
  // preview?.missing_designs?.length > 0;

  const actions = (
    <>
      {step > 1 && !result && (
        <button
          onClick={back}
          disabled={processing}
          className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50"
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
          disabled={processing}
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
                label={processing ? "Loading..." : "Next"}
                onClick={next}
                disabled={
                  processing || !file || (step === 2 && hasValidationErrors)
                }
              />
            )}
            {step === 3 && (
              <button
                onClick={doImport}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50"
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
      title="Import Color Kitchen"
      subtitle="Import batches and entries from Excel"
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
