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
  importDataMasterLapChemical,
  importDataMasterLapChemicalPreview,
  importDataMasterLapPembelian,
  importDataMasterLapPembelianPreview,
  importDataMasterLapCk,
  importDataMasterLapCkPreview,
} from "../../../services/import_data_master_service";

export default function ImportDataMasterModal({
  isOpen,
  onClose,
  onImportSuccess,
}) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(1); // Main step: 1, 2, 3
  const [subStep, setSubStep] = useState(1); // Sub step: 1=Upload, 2=Preview, 3=Confirm

  // State untuk setiap data master
  const [chemicalFile, setChemicalFile] = useState(null);
  const [chemicalPreview, setChemicalPreview] = useState(null);
  const [chemicalResult, setChemicalResult] = useState(null);
  const [chemicalError, setChemicalError] = useState(null);

  const [pembelianFile, setPembelianFile] = useState(null);
  const [pembelianPreview, setPembelianPreview] = useState(null);
  const [pembelianResult, setPembelianResult] = useState(null);
  const [pembelianError, setPembelianError] = useState(null);

  const [ckFile, setCkFile] = useState(null);
  const [ckPreview, setCkPreview] = useState(null);
  const [ckResult, setCkResult] = useState(null);
  const [ckError, setCkError] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const steps = [
    { number: 1, label: "Laporan Pembelian", key: "pembelian" },
    { number: 2, label: "Laporan Chemical", key: "chemical" },
    { number: 3, label: "Laporan CK", key: "ck" },
  ];

  const subSteps = [
    { n: 1, l: "Upload" },
    { n: 2, l: "Preview" },
    { n: 3, l: "Confirm" },
  ];

  const getCurrentStepConfig = () => {
    switch (currentStep) {
      case 1:
        return {
          key: "pembelian",
          file: pembelianFile,
          setFile: setPembelianFile,
          preview: pembelianPreview,
          setPreview: setPembelianPreview,
          result: pembelianResult,
          setResult: setPembelianResult,
          error: pembelianError,
          setError: setPembelianError,
          title: "Import Data Master - Laporan Pembelian",
          description: "Upload file Excel dari Laporan Pembelian",
          importApi: importDataMasterLapPembelian,
          previewApi: importDataMasterLapPembelianPreview,
        };

      case 2:
        return {
          key: "chemical",
          file: chemicalFile,
          setFile: setChemicalFile,
          preview: chemicalPreview,
          setPreview: setChemicalPreview,
          result: chemicalResult,
          setResult: setChemicalResult,
          error: chemicalError,
          setError: setChemicalError,
          title: "Import Data Master - Laporan Chemical",
          description: "Upload file Excel dari Laporan Chemical",
          importApi: importDataMasterLapChemical,
          previewApi: importDataMasterLapChemicalPreview,
        };

      case 3:
        return {
          key: "ck",
          file: ckFile,
          setFile: setCkFile,
          preview: ckPreview,
          setPreview: setCkPreview,
          result: ckResult,
          setResult: setCkResult,
          error: ckError,
          setError: setCkError,
          title: "Import Data Master - Laporan CK",
          description: "Upload file Excel dari Laporan CK",
          importApi: importDataMasterLapCk,
          previewApi: importDataMasterLapCkPreview,
        };
      default:
        return null;
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setSubStep(1);

    setChemicalFile(null);
    setChemicalPreview(null);
    setChemicalResult(null);
    setChemicalError(null);

    setPembelianFile(null);
    setPembelianPreview(null);
    setPembelianResult(null);
    setPembelianError(null);

    setCkFile(null);
    setCkPreview(null);
    setCkResult(null);
    setCkError(null);

    setIsProcessing(false);
  };

  const handleClose = () => {
    if (isProcessing) return;
    resetModal();
    onClose();
  };

  // Fetch preview from backend (sama seperti ImportPurchasingTransaction)
  const fetchPreview = async (file, config) => {
    setIsProcessing(true);
    try {
      const res = await config.previewApi(file);
      const data = res.data?.data || res.data; // Handle both response formats

      config.setPreview(data);
      config.setError(null);
    } catch (err) {
      config.setError(
        err.response?.data?.detail || err.message || "Preview failed"
      );
      config.setPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Select file and auto-fetch preview (sama seperti ImportPurchasingTransaction)
  const selectFile = async (e) => {
    const config = getCurrentStepConfig();
    const f = e.target.files?.[0];

    if (!f) return;

    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      config.setError("Upload .xlsx file");
      return;
    }

    config.setFile(f);
    config.setError(null);
    await fetchPreview(f, config);
  };

  const handleNext = () => {
    const config = getCurrentStepConfig();

    if (subStep === 1 && !config.file) {
      config.setError("Select file");
      return;
    }
    if (subStep === 2 && !config.preview) {
      config.setError("No data");
      return;
    }

    config.setError(null);
    setSubStep((prev) => prev + 1);
  };

  const handleBack = () => {
    const config = getCurrentStepConfig();
    config.setError(null);
    setSubStep((prev) => prev - 1);
  };

  // Perform actual import
  const doImport = async () => {
    const config = getCurrentStepConfig();
    if (!config.preview.preview_id) return;

    setIsProcessing(true);
    config.setError(null);

    try {
      const res = await config.importApi(config.preview.preview_id);
      const data = res.data;

      config.setResult(data);
      if (onImportSuccess) {
        onImportSuccess(data);
      }
    } catch (err) {
      config.setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Failed to import data"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextStep = () => {
    const config = getCurrentStepConfig();

    if (!config.result) {
      config.setError(
        "Please complete the import before proceeding to the next step"
      );
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setSubStep(1); // Reset ke Upload untuk step berikutnya
    }
  };

  // Render Main Step Indicator
  const renderMainStepIndicator = () => (
    <div
      className="px-6 py-4 border-b"
      style={{
        borderColor: colors.border.primary,
        backgroundColor: colors.background.secondary,
      }}
    >
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                  currentStep >= step.number ? "ring-2" : ""
                )}
                style={{
                  backgroundColor:
                    currentStep > step.number
                      ? colors.status.success
                      : currentStep === step.number
                      ? colors.primary
                      : colors.background.primary,
                  color:
                    currentStep >= step.number
                      ? colors.text.inverse
                      : colors.text.secondary,
                  borderWidth: currentStep >= step.number ? 0 : "2px",
                  borderColor: colors.border.primary,
                  ringColor:
                    currentStep > step.number
                      ? colors.status.success
                      : colors.primary,
                }}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className="mt-2 text-xs font-medium text-center"
                style={{
                  color:
                    currentStep >= step.number
                      ? currentStep > step.number
                        ? colors.status.success
                        : colors.primary
                      : colors.text.secondary,
                }}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="flex-1 h-1 mx-2 transition-all rounded"
                style={{
                  backgroundColor:
                    currentStep > step.number
                      ? colors.status.success
                      : colors.border.primary,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Render Sub Step Indicator
  const renderSubStepIndicator = () => (
    <div
      className="px-6 py-3 border-b"
      style={{
        borderColor: colors.border.primary,
      }}
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
                {getCurrentStepConfig()?.result && s.n === 3 ? (
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

  // Step 1: Upload
  const renderUploadStep = () => {
    const config = getCurrentStepConfig();

    return (
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
              {config.description}
            </h3>
            <p
              className="mb-4 text-sm"
              style={{ color: colors.text.secondary }}
            >
              Select .xlsx file with {config.key} data
            </p>
            <input
              type="file"
              accept=".xlsx"
              onChange={selectFile}
              className="hidden"
              id={`file-${config.key}`}
              disabled={isProcessing}
            />
            <label
              htmlFor={`file-${config.key}`}
              className={cn(
                "inline-block px-4 py-2 rounded-lg",
                isProcessing
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              )}
              style={{
                backgroundColor: colors.primary,
                color: colors.text.inverse,
              }}
            >
              {isProcessing ? "Loading..." : "Choose File"}
            </label>
            {config.file && (
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
                  {config.file.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Step 2: Preview
  const renderPreviewStep = () => {
    const config = getCurrentStepConfig();

    if (isProcessing) {
      return (
        <div
          className="py-12 text-center"
          style={{ color: colors.text.secondary }}
        >
          Loading preview...
        </div>
      );
    }

    if (!config.preview) {
      return (
        <div
          className="py-12 text-center"
          style={{ color: colors.text.secondary }}
        >
          No preview data available
        </div>
      );
    }

    // Extract data dari backend response
    const summary = config.preview.summary || {};
    const samples = config.preview.samples || {};

    const totalToInsert =
      (summary.accounts_to_insert || 0) +
      (summary.products_to_insert || 0) +
      (summary.suppliers_to_insert || 0);

    return (
      <div>
        {/* Summary Cards */}
        <div
          className="p-4 mb-4 rounded-lg"
          style={{
            backgroundColor: `${colors.primary}15`,
            borderWidth: "1px",
            borderColor: colors.primary,
          }}
        >
          <p className="text-sm" style={{ color: colors.text.primary }}>
            <strong>{totalToInsert}</strong> total record(s) will be imported
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Accounts */}
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
              Accounts
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.success }}
            >
              {summary.accounts_to_insert || 0}
            </p>
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              {summary.skipped_accounts || 0} skipped
            </p>
          </div>

          {/* Products */}
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
              Products
            </p>
            <p className="text-2xl font-bold" style={{ color: colors.primary }}>
              {summary.products_to_insert || 0}
            </p>
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              {summary.skipped_products || 0} skipped
            </p>
          </div>

          {/* Suppliers */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.info}15`,
              borderWidth: "1px",
              borderColor: colors.status.info,
            }}
          >
            <p
              className="mb-1 text-xs"
              style={{ color: colors.text.secondary }}
            >
              Suppliers
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.status.info }}
            >
              {summary.suppliers_to_insert || 0}
            </p>
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              {summary.skipped_suppliers || 0} skipped
            </p>
          </div>
        </div>

        {/* Warning for missing accounts */}
        {summary.missing_account_refs > 0 && (
          <div
            className="flex items-start gap-3 p-4 mb-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.warning}15`,
              borderWidth: "1px",
              borderColor: colors.status.warning,
            }}
          >
            <AlertCircle
              className="flex-shrink-0 w-5 h-5"
              style={{ color: colors.status.warning }}
            />
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: colors.status.warning }}
              >
                {summary.missing_account_refs} products have missing account
                references
              </p>
              <p
                className="mt-1 text-xs"
                style={{ color: colors.text.secondary }}
              >
                These products will be skipped during import
              </p>
            </div>
          </div>
        )}

        {/* Sample Tables */}
        <div className="space-y-4">
          {/* Products Sample */}
          {samples.products && samples.products.length > 0 && (
            <div>
              <h4
                className="mb-2 text-sm font-semibold"
                style={{ color: colors.text.primary }}
              >
                Products Preview ({summary.products_to_insert})
              </h4>
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
                        <th className="px-3 py-2 font-semibold text-left">
                          No
                        </th>
                        <th className="px-3 py-2 font-semibold text-left">
                          Product Name
                        </th>
                        <th className="px-3 py-2 font-semibold text-left">
                          Unit
                        </th>
                        <th className="px-3 py-2 font-semibold text-left">
                          Account
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {samples.products.slice(0, 20).map((prod, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottomWidth: "1px",
                            borderColor: colors.border.primary,
                          }}
                        >
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium">{prod.name}</td>
                          <td className="px-3 py-2">{prod.unit || "-"}</td>
                          <td className="px-3 py-2 text-xs">
                            {prod.account_no}: {prod.account_name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  className="p-2 text-xs text-center"
                  style={{
                    backgroundColor: colors.background.secondary,
                    color: colors.text.secondary,
                  }}
                >
                  Showing {Math.min(20, samples.products.length)} of{" "}
                  {summary.products_to_insert} products
                </div>
              </div>
            </div>
          )}

          {/* Accounts & Suppliers in collapsible sections if needed */}
        </div>
      </div>
    );
  };

  // Step 3: Confirm/Result
  const renderConfirmStep = () => {
    const config = getCurrentStepConfig();

    if (config.result) {
      // Show result after import
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center">
              <CheckCircle
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: colors.status.success }}
              />
              <h3
                className="mb-2 text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                Import Successful!
              </h3>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Data from {steps[currentStep - 1].label} has been imported
                successfully
              </p>
            </div>

            <div className="space-y-3">
              {/* Accounts Result */}
              {config.result?.accounts && (
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: `${colors.status.success}15`,
                    borderWidth: "1px",
                    borderColor: colors.status.success,
                  }}
                >
                  <p
                    className="mb-2 text-sm font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    Accounts
                  </p>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: colors.text.secondary }}>
                      Inserted:
                    </span>
                    <span style={{ color: colors.status.success }}>
                      {config.result.accounts.inserted}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: colors.text.secondary }}>
                      Skipped:
                    </span>
                    <span>{config.result.accounts.skipped}</span>
                  </div>
                </div>
              )}

              {/* Products Result */}
              {config.result?.products && (
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: `${colors.primary}15`,
                    borderWidth: "1px",
                    borderColor: colors.primary,
                  }}
                >
                  <p
                    className="mb-2 text-sm font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    Products
                  </p>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: colors.text.secondary }}>
                      Inserted:
                    </span>
                    <span style={{ color: colors.primary }}>
                      {config.result.products.inserted}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: colors.text.secondary }}>
                      Skipped:
                    </span>
                    <span>{config.result.products.skipped}</span>
                  </div>
                </div>
              )}

              {/* Suppliers Result */}
              {config.result?.suppliers && (
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: `${colors.status.info}15`,
                    borderWidth: "1px",
                    borderColor: colors.status.info,
                  }}
                >
                  <p
                    className="mb-2 text-sm font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    Suppliers
                  </p>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: colors.text.secondary }}>
                      Inserted:
                    </span>
                    <span style={{ color: colors.status.info }}>
                      {config.result.suppliers.inserted}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: colors.text.secondary }}>
                      Skipped:
                    </span>
                    <span>{config.result.suppliers.skipped}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Next step hint */}
            {currentStep < 3 && (
              <div
                className="p-4 mt-6 rounded-lg"
                style={{
                  backgroundColor: `${colors.primary}15`,
                  borderWidth: "1px",
                  borderColor: colors.primary,
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.primary }}
                >
                  Click "Next Step" to continue with {steps[currentStep].label}
                </p>
              </div>
            )}

            {currentStep === 3 && (
              <div
                className="p-4 mt-6 rounded-lg"
                style={{
                  backgroundColor: `${colors.status.success}15`,
                  borderWidth: "1px",
                  borderColor: colors.status.success,
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.status.success }}
                >
                  ✓ All data master imports completed successfully!
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Confirm before import
    const summary = config.preview?.summary || {};
    const totalToInsert =
      (summary.accounts_to_insert || 0) +
      (summary.products_to_insert || 0) +
      (summary.suppliers_to_insert || 0);

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-full max-w-md text-center">
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
            {totalToInsert} total record(s) will be imported
          </p>
          <div
            className="p-4 space-y-2 text-left rounded-lg"
            style={{ backgroundColor: colors.background.secondary }}
          >
            <p className="text-sm" style={{ color: colors.text.primary }}>
              <strong>File:</strong> {config.file?.name}
            </p>
            <div className="text-sm" style={{ color: colors.text.primary }}>
              <strong>Records:</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• {summary.accounts_to_insert || 0} Accounts</li>
                <li>• {summary.products_to_insert || 0} Products</li>
                <li>• {summary.suppliers_to_insert || 0} Suppliers</li>
              </ul>
            </div>
            {summary.missing_account_refs > 0 && (
              <p
                className="pt-2 text-xs"
                style={{ color: colors.status.warning }}
              >
                ⚠️ {summary.missing_account_refs} products will be skipped
                (missing accounts)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const config = getCurrentStepConfig();

    return (
      <>
        {config.error && (
          <div
            className="flex items-start gap-3 p-4 mb-4 rounded-lg"
            style={{
              backgroundColor: `${colors.status.error}15`,
              borderWidth: "1px",
              borderColor: colors.status.error,
            }}
          >
            <AlertCircle
              className="flex-shrink-0 w-5 h-5 mt-0.5"
              style={{ color: colors.status.error }}
            />
            <p className="text-sm" style={{ color: colors.status.error }}>
              {config.error}
            </p>
          </div>
        )}
        {subStep === 1 && renderUploadStep()}
        {subStep === 2 && renderPreviewStep()}
        {subStep === 3 && renderConfirmStep()}
      </>
    );
  };

  const modalActions = (
    <>
      {subStep > 1 && !getCurrentStepConfig()?.result && (
        <button
          onClick={handleBack}
          disabled={isProcessing}
          className="px-4 py-2 text-sm font-medium transition-colors rounded-lg disabled:opacity-50"
          style={{ color: colors.text.primary }}
        >
          <ChevronLeft className="inline w-4 h-4 mr-1" />
          Back
        </button>
      )}
      <div className="flex gap-3 ml-auto">
        <button
          onClick={handleClose}
          disabled={isProcessing}
          className="px-4 py-2 text-sm font-medium transition-colors rounded-lg"
          style={{
            backgroundColor: colors.background.primary,
            color: colors.text.primary,
            borderWidth: "1px",
            borderColor: colors.border.primary,
          }}
        >
          {currentStep === 3 && getCurrentStepConfig()?.result
            ? "Finish"
            : "Cancel"}
        </button>

        {!getCurrentStepConfig()?.result && (
          <>
            {subStep < 3 && (
              <Button
                icon={ChevronRight}
                label="Next"
                onClick={handleNext}
                disabled={
                  !getCurrentStepConfig()?.file ||
                  (subStep === 2 && !getCurrentStepConfig()?.preview) ||
                  isProcessing
                }
              />
            )}

            {subStep === 3 && (
              <button
                onClick={doImport}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium transition-colors rounded-lg disabled:opacity-50"
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

        {getCurrentStepConfig()?.result && currentStep < 3 && (
          <Button
            icon={ChevronRight}
            label="Next Step"
            onClick={handleNextStep}
          />
        )}
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Data Master"
      subtitle="Import data master from 3 different reports sequentially"
      size="xl"
      actions={modalActions}
      closeOnOverlayClick={!isProcessing}
    >
      {renderMainStepIndicator()}
      {renderSubStepIndicator()}
      <div className="mt-6">{renderContent()}</div>
    </Modal>
  );
}
