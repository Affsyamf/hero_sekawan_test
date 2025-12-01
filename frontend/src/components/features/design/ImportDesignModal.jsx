import { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import Modal from "../../ui/modal/Modal";
import Button from "../../ui/button/Button";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";

import {
  importDataMasterLapCk,
  importDataMasterLapCkPreview,
} from "../../../services/import_data_master_service";

export default function ImportDesignModal({
  isOpen,
  onClose,
  onImportSuccess,
}) {
  const { colors } = useTheme();

  // EXACT SAME SUBSTEPS AS ORIGINAL
  const [subStep, setSubStep] = useState(1); // 1 = Upload, 2 = Preview, 3 = Confirm

  // CK STATES EXACTLY THE SAME
  const [ckFile, setCkFile] = useState(null);
  const [ckPreview, setCkPreview] = useState(null);
  const [ckResult, setCkResult] = useState(null);
  const [ckError, setCkError] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const reset = () => {
    setSubStep(1);
    setCkFile(null);
    setCkPreview(null);
    setCkResult(null);
    setCkError(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    if (isProcessing) return;
    reset();
    onClose();
  };

  const fetchPreview = async (file) => {
    setIsProcessing(true);
    try {
      const res = await importDataMasterLapCkPreview(file);
      const data = res.data?.data || res.data;
      setCkPreview(data);
      setCkError(null);
    } catch (err) {
      setCkError(err.response?.data?.detail || "Preview failed");
      setCkPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      setCkError("Upload .xlsx file");
      return;
    }

    setCkFile(f);
    setCkError(null);
    await fetchPreview(f);
  };

  const handleNext = () => {
    if (subStep === 1 && !ckFile) {
      setCkError("Select file");
      return;
    }
    if (subStep === 2 && !ckPreview) {
      setCkError("No preview data");
      return;
    }

    setCkError(null);
    setSubStep((p) => p + 1);
  };

  const handleBack = () => {
    setCkError(null);
    setSubStep((p) => p - 1);
  };

  const doImport = async () => {
    if (!ckFile) return;

    setIsProcessing(true);
    setCkError(null);

    try {
      const res = await importDataMasterLapCk(ckFile);
      setCkResult(res.data);
      if (onImportSuccess) onImportSuccess(res.data);
    } catch (err) {
      setCkError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Failed to import CK"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const subSteps = [
    { n: 1, l: "Upload" },
    { n: 2, l: "Preview" },
    { n: 3, l: "Confirm" },
  ];

  // --- SUBSTEP INDICATOR ---
  const renderSubSteps = () => (
    <div
      className="px-6 py-3 border-b"
      style={{ borderColor: colors.border.primary }}
    >
      <div className="flex items-center justify-between max-w-xl mx-auto">
        {subSteps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                  subStep >= s.n && "ring-2"
                )}
                style={{
                  backgroundColor:
                    subStep >= s.n ? colors.primary : colors.background.primary,
                  color:
                    subStep >= s.n
                      ? colors.text.inverse
                      : colors.text.secondary,
                  borderWidth: subStep >= s.n ? 0 : "2px",
                  borderColor: colors.border.primary,
                }}
              >
                {ckResult && s.n === 3 ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  s.n
                )}
              </div>

              <span
                className="mt-1 text-xs font-medium"
                style={{
                  color:
                    subStep >= s.n ? colors.primary : colors.text.secondary,
                }}
              >
                {s.l}
              </span>
            </div>

            {i < subSteps.length - 1 && (
              <div
                className="flex-1 h-1 mx-2 rounded"
                style={{
                  backgroundColor:
                    subStep > s.n ? colors.primary : colors.border.primary,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // --- STEP 1: UPLOAD ---
  const renderUpload = () => (
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
            Upload file Excel Laporan CK
          </h3>

          <p className="mb-4 text-sm" style={{ color: colors.text.secondary }}>
            Select .xlsx file
          </p>

          <input
            type="file"
            accept=".xlsx"
            onChange={selectFile}
            className="hidden"
            id="file-ck"
            disabled={isProcessing}
          />

          <label
            htmlFor="file-ck"
            className={cn(
              "inline-block px-4 py-2 rounded-lg",
              isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
            style={{
              backgroundColor: colors.primary,
              color: colors.text.inverse,
            }}
          >
            {isProcessing ? "Loading..." : "Choose File"}
          </label>

          {ckFile && (
            <div
              className="flex items-center gap-3 p-3 mt-4 rounded-lg"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <FileSpreadsheet
                className="w-5 h-5"
                style={{ color: colors.primary }}
              />
              <span className="text-sm">{ckFile.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- STEP 2: PREVIEW ---
  const renderPreview = () => {
    if (isProcessing)
      return (
        <div
          className="py-12 text-center"
          style={{ color: colors.text.secondary }}
        >
          Loading preview...
        </div>
      );

    if (!ckPreview)
      return (
        <div
          className="py-12 text-center"
          style={{ color: colors.text.secondary }}
        >
          No preview available
        </div>
      );

    const summary = ckPreview.summary || {};
    const insertSamples = ckPreview.insert_samples || [];
    const existingSamples = ckPreview.existing_samples || [];
    const skippedSamples = ckPreview.skipped_samples || [];

    return (
      <div className="p-6 space-y-6">
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-4 gap-4">
          {/* Total Rows */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.primary}15`,
              borderColor: colors.primary,
              borderWidth: "1px",
            }}
          >
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              Total Rows
            </p>
            <p className="text-2xl font-bold" style={{ color: colors.primary }}>
              {summary.total_rows}
            </p>
          </div>

          {/* To Insert */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.success}15`,
              borderColor: colors.status.success,
              borderWidth: "1px",
            }}
          >
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              To Insert
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.success }}
            >
              {summary.to_insert}
            </p>
          </div>

          {/* Existing */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.info}15`,
              borderColor: colors.status.info,
              borderWidth: "1px",
            }}
          >
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              Already Exists
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.info }}
            >
              {summary.existing}
            </p>
          </div>

          {/* Skipped */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.warning}15`,
              borderColor: colors.status.warning,
              borderWidth: "1px",
            }}
          >
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              Skipped
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.warning }}
            >
              {summary.skipped}
            </p>
          </div>
        </div>

        {/* Missing Types Warning */}
        {summary.missing_types?.length > 0 && (
          <div
            className="p-4 rounded-lg flex gap-3"
            style={{
              backgroundColor: `${colors.status.error}15`,
              borderColor: colors.status.error,
              borderWidth: "1px",
            }}
          >
            <AlertCircle
              className="w-5 h-5"
              style={{ color: colors.status.error }}
            />
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: colors.status.error }}
              >
                Missing Types ({summary.missing_types.length})
              </p>
              <p className="text-xs" style={{ color: colors.text.secondary }}>
                These codes will be skipped.
              </p>
            </div>
          </div>
        )}

        {/* INSERT SAMPLES */}
        {insertSamples.length > 0 && (
          <div>
            <h4
              className="mb-2 text-sm font-semibold"
              style={{ color: colors.text.primary }}
            >
              Insert Samples ({insertSamples.length})
            </h4>

            <div
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: colors.border.primary }}
            >
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead
                    style={{
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.primary,
                      borderBottomWidth: "1px",
                    }}
                  >
                    <tr>
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insertSamples.slice(0, 30).map((row, i) => (
                      <tr
                        key={i}
                        className="border-b"
                        style={{ borderColor: colors.border.primary }}
                      >
                        <td className="px-3 py-2">{row.code}</td>
                        <td className="px-3 py-2">{row.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* EXISTING SAMPLES */}
        <div>
          <h4
            className="mb-2 text-sm font-semibold"
            style={{ color: colors.text.primary }}
          >
            Existing Samples ({existingSamples.length})
          </h4>

          <div
            className="border rounded-lg overflow-hidden"
            style={{ borderColor: colors.border.primary }}
          >
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-xs">
                <thead
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.primary,
                    borderBottomWidth: "1px",
                  }}
                >
                  <tr>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {existingSamples.slice(0, 30).map((row, i) => (
                    <tr
                      key={i}
                      className="border-b"
                      style={{ borderColor: colors.border.primary }}
                    >
                      <td className="px-3 py-2">{row.code}</td>
                      <td className="px-3 py-2">{row.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SKIPPED SAMPLES */}
        <div>
          <h4
            className="mb-2 text-sm font-semibold"
            style={{ color: colors.text.primary }}
          >
            Skipped Samples ({skippedSamples.length})
          </h4>

          <div
            className="border rounded-lg overflow-hidden"
            style={{ borderColor: colors.border.primary }}
          >
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-xs">
                <thead
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.primary,
                    borderBottomWidth: "1px",
                  }}
                >
                  <tr>
                    <th className="px-3 py-2 text-left">Code</th>
                  </tr>
                </thead>
                <tbody>
                  {skippedSamples.slice(0, 30).map((code, i) => (
                    <tr
                      key={i}
                      className="border-b"
                      style={{ borderColor: colors.border.primary }}
                    >
                      <td className="px-3 py-2">{code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- STEP 3: CONFIRM ---
  const renderConfirm = () => {
    if (ckResult) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <CheckCircle
            className="w-20 h-20 mb-4"
            style={{ color: colors.status.success }}
          />

          <h3
            className="text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            Import CK Successful
          </h3>

          <p className="text-sm mt-2" style={{ color: colors.text.secondary }}>
            Data CK berhasil diimport
          </p>
        </div>
      );
    }

    const summary = ckPreview?.summary || {};

    return (
      <div className="text-center py-12">
        <AlertCircle
          className="w-16 h-16 mx-auto mb-4"
          style={{ color: colors.primary }}
        />

        <h3
          className="text-lg font-semibold"
          style={{ color: colors.text.primary }}
        >
          Ready to Import
        </h3>

        <p className="mt-2 text-sm" style={{ color: colors.text.secondary }}>
          {summary.total_insert || 0} record(s) will be imported
        </p>

        <div className="mt-4 text-sm">
          <strong>File:</strong> {ckFile?.name}
        </div>
      </div>
    );
  };

  const renderContent = () => (
    <>
      {ckError && (
        <div
          className="flex items-start gap-3 p-4 mb-4 rounded-lg"
          style={{
            backgroundColor: `${colors.status.error}15`,
            borderColor: colors.status.error,
            borderWidth: "1px",
          }}
        >
          <AlertCircle
            className="w-5 h-5"
            style={{ color: colors.status.error }}
          />
          <p className="text-sm" style={{ color: colors.status.error }}>
            {ckError}
          </p>
        </div>
      )}

      {subStep === 1 && renderUpload()}
      {subStep === 2 && renderPreview()}
      {subStep === 3 && renderConfirm()}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Data Master - Laporan CK"
      subtitle="Import CK data with 3-step flow"
      size="xl"
      closeOnOverlayClick={!isProcessing}
      actions={
        <>
          {subStep > 1 && !ckResult && (
            <button
              onClick={handleBack}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ color: colors.text.primary }}
            >
              <ChevronLeft className="inline w-4 h-4 mr-1" />
              Back
            </button>
          )}

          <div className="ml-auto flex gap-3">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.primary,
                borderWidth: "1px",
                color: colors.text.primary,
              }}
            >
              {ckResult ? "Finish" : "Cancel"}
            </button>

            {!ckResult && (
              <>
                {subStep < 3 && (
                  <Button
                    icon={ChevronRight}
                    label="Next"
                    onClick={handleNext}
                    disabled={
                      !ckFile || (subStep === 2 && !ckPreview) || isProcessing
                    }
                  />
                )}

                {subStep === 3 && (
                  <button
                    className="px-4 py-2 rounded-lg text-sm"
                    onClick={doImport}
                    disabled={isProcessing}
                    style={{
                      backgroundColor: colors.status.success,
                      color: colors.text.inverse,
                    }}
                  >
                    {isProcessing ? "Importing..." : "Import"}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      }
    >
      {renderSubSteps()}
      <div className="mt-6">{renderContent()}</div>
    </Modal>
  );
}
