import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Calendar,
  Building2,
  Palette,
  Plus,
  Trash2,
  Package,
  DollarSign,
  AlertCircle,
  Settings,
} from "lucide-react";
import Modal from "../../ui/modal/Modal";
import Form from "../../ui/form/Form";
import Input from "../../ui/input/Input";
import Button from "../../ui/button/Button";
import { formatCurrency } from "../../../utils/helpers";
import { searchClient } from "../../../services/client_service";
import { searchDesign } from "../../../services/design_service";
import DropdownServer from "../../ui/dropdown-server/DropdownServer";

// Enums
const PROCESS_TYPES = [
  { value: "DISPERSE", label: "DISPERSE" },
  { value: "REACTIVE", label: "REACTIVE" },
  { value: "PIGMENT", label: "PIGMENT" },
];

const FOLDING_TYPES = [
  { value: "Yard", label: "Yard" },
  { value: "Gulung", label: "Gulung" },
];

const FACE_DIRECTIONS = [
  { value: "Muka ke Dalam", label: "Muka ke Dalam" },
  { value: "Muka ke Luar", label: "Muka ke Luar" },
];

const PE_TYPES = [
  { value: "PE-I (Krg) PE", label: "PE-I (Krg) PE" },
  { value: "PE-II (Krg) PE", label: "PE-II (Krg) PE" },
];

const PRINTING_MACHINES = [
  { value: "Rotary", label: "Rotary" },
  { value: "Flat", label: "Flat" },
];

const PROCESS_CONDITIONS = [
  { value: "grey", label: "Grey" },
  { value: "perbaikan", label: "Perbaikan" },
  { value: "pfp", label: "PFP" },
  { value: "optic_white", label: "Optic White" },
  { value: "dyeing", label: "Dyeing" },
  { value: "printing", label: "Printing" },
  { value: "ser_bleach", label: "Ser Bleach" },
  { value: "resin_finish", label: "Resin Finish" },
];

export default function OpjForm({ opj = null, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    code: "",
    date: new Date().toISOString().split("T")[0],
    term: "",
    no_dyeing: "",
    gs_grey: "",
    gs_jadi: "",
    notes: "",
    process_type: "",
    jenis_kain: "",
    kode_kain: "",
    lebar: "",
    repeat_gambar: "",
    garis_potong: "",
    folding: "",
    face_direction: "",
    pe_type: "",
    printing_machine: "",
    jumlah_warna: "",
    unit_price: "",
    unit_type: "KG",
    client_id: "",
    client_name: "",
    design_id: "",
    design_name: "",
  });

  const [details, setDetails] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      setErrors({});

      if (opj) {
        // Edit mode
        setFormData({
          code: opj.code || "",
          date: opj.date?.split("T")[0] || new Date().toISOString().split("T")[0],
          term: opj.term || "",
          no_dyeing: opj.no_dyeing || "",
          gs_grey: opj.gs_grey || "",
          gs_jadi: opj.gs_jadi || "",
          notes: opj.notes || "",
          process_type: opj.process_type || "",
          jenis_kain: opj.jenis_kain || "",
          kode_kain: opj.kode_kain || "",
          lebar: opj.lebar || "",
          repeat_gambar: opj.repeat_gambar || "",
          garis_potong: opj.garis_potong || "",
          folding: opj.folding || "",
          face_direction: opj.face_direction || "",
          pe_type: opj.pe_type || "",
          printing_machine: opj.printing_machine || "",
          jumlah_warna: opj.jumlah_warna || "",
          unit_price: opj.unit_price || "",
          unit_type: opj.unit_type || "KG",
          client_id: opj.client_id || "",
          client_name: opj.client?.name || "",
          design_id: opj.design_id || "",
          design_name: opj.design?.name || "",
        });

        // Map details
        const mappedDetails = (opj.details || []).map((detail) => ({
          id: detail.id || Date.now() + Math.random(),
          ground_color: detail.ground_color || "",
          roll: detail.roll || 0,
          quantity: detail.quantity || 0,
        }));
        setDetails(mappedDetails);

        // Map processes
        const mappedProcesses = (opj.processes || []).map((process) => ({
          id: process.id || Date.now() + Math.random(),
          process_type: process.process_type || "",
        }));
        setProcesses(mappedProcesses);
      } else {
        // Create mode
        setFormData({
          code: "",
          date: new Date().toISOString().split("T")[0],
          term: "",
          no_dyeing: "",
          gs_grey: "",
          gs_jadi: "",
          notes: "",
          process_type: "",
          jenis_kain: "",
          kode_kain: "",
          lebar: "",
          repeat_gambar: "",
          garis_potong: "",
          folding: "",
          face_direction: "",
          pe_type: "",
          printing_machine: "",
          jumlah_warna: "",
          unit_price: "",
          unit_type: "KG",
          client_id: "",
          client_name: "",
          design_id: "",
          design_name: "",
        });
        setDetails([]);
        setProcesses([]);
      }
    }
  }, [isOpen, opj]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Detail handlers
  const handleAddDetail = () => {
    setDetails((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        ground_color: "",
        roll: 0,
        quantity: 0,
      },
    ]);
  };

  const handleRemoveDetail = (detailId) => {
    setDetails((prev) => prev.filter((detail) => detail.id !== detailId));
  };

  const handleUpdateDetail = (detailId, field, value) => {
    setDetails((prev) =>
      prev.map((detail) =>
        detail.id === detailId ? { ...detail, [field]: value } : detail
      )
    );
  };

  // Process handlers
  const handleAddProcess = () => {
    setProcesses((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        process_type: "",
      },
    ]);
  };

  const handleRemoveProcess = (processId) => {
    setProcesses((prev) => prev.filter((process) => process.id !== processId));
  };

  const handleUpdateProcess = (processId, value) => {
    setProcesses((prev) =>
      prev.map((process) =>
        process.id === processId ? { ...process, process_type: value } : process
      )
    );
  };

  // Summary calculations
  const summary = useMemo(() => {
    const totalRolls = details.reduce((sum, d) => sum + (parseFloat(d.roll) || 0), 0);
    const totalQuantity = details.reduce((sum, d) => sum + (parseFloat(d.quantity) || 0), 0);
    const totalPrice = totalQuantity * (parseFloat(formData.unit_price) || 0);

    return { totalRolls, totalQuantity, totalPrice };
  }, [details, formData.unit_price]);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "No Bukti is required";
    }

    if (!formData.date.trim()) {
      newErrors.date = "Date is required";
    }

    if (!formData.process_type) {
      newErrors.process_type = "Process Type is required";
    }

    if (!formData.printing_machine) {
      newErrors.printing_machine = "Printing Machine is required";
    }

    if (!formData.client_id) {
      newErrors.client_id = "Client is required";
    }

    if (details.length === 0) {
      newErrors.details = "At least one detail is required";
    }

    details.forEach((detail, index) => {
      if (!detail.ground_color.trim()) {
        newErrors[`detail_ground_color_${index}`] = "Ground Color is required";
      }
      if (!detail.roll || detail.roll <= 0) {
        newErrors[`detail_roll_${index}`] = "Valid roll is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        details: details.map(d => ({
          ground_color: d.ground_color,
          roll: parseFloat(d.roll) || 0,
          quantity: parseFloat(d.quantity) || 0,
        })),
        processes: processes.map(p => ({
          process_type: p.process_type,
        })),
        id: opj?.id,
      };

      // Remove display-only fields
      delete submitData.client_name;
      delete submitData.design_name;

      await onSave(submitData);
    } catch (error) {
      console.error("Error saving OPJ:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={opj ? "Edit OPJ" : "New OPJ"}
      subtitle="Order Produksi Jadi"
      size="xl"
      showFullscreenToggle={true}
      actions={
        <>
          <Button
            label="Cancel"
            onClick={onClose}
            disabled={loading}
            className="bg-transparent border border-default text-secondary-text hover:bg-background hover:text-primary-text"
          />
          <Button
            icon={FileText}
            label={loading ? "Saving..." : "Save OPJ"}
            onClick={handleSubmit}
            disabled={loading}
          />
        </>
      }
    >
      <div className="space-y-5">
        {/* Main Information */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Group>
            <Form.Label htmlFor="code" required>
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                No Bukti
              </div>
            </Form.Label>
            <Input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value)}
              placeholder="Enter document number"
              error={!!errors.code}
            />
            <Form.Error>{errors.code}</Form.Error>
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="date" required>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Date
              </div>
            </Form.Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              error={!!errors.date}
            />
            <Form.Error>{errors.date}</Form.Error>
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="term">Term</Form.Label>
            <Input
              id="term"
              type="text"
              value={formData.term}
              onChange={(e) => handleInputChange("term", e.target.value)}
              placeholder="Enter term"
            />
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="no_dyeing">No Dyeing</Form.Label>
            <Input
              id="no_dyeing"
              type="text"
              value={formData.no_dyeing}
              onChange={(e) => handleInputChange("no_dyeing", e.target.value)}
              placeholder="Enter no dyeing"
            />
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="gs_grey">GS Grey</Form.Label>
            <Input
              id="gs_grey"
              type="text"
              value={formData.gs_grey}
              onChange={(e) => handleInputChange("gs_grey", e.target.value)}
              placeholder="Enter GS Grey"
            />
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="gs_jadi">GS Jadi</Form.Label>
            <Input
              id="gs_jadi"
              type="text"
              value={formData.gs_jadi}
              onChange={(e) => handleInputChange("gs_jadi", e.target.value)}
              placeholder="Enter GS Jadi"
            />
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="client_id" required>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Client
              </div>
            </Form.Label>
            <DropdownServer
              apiService={searchClient}
              placeholder="Ketik untuk mencari client..."
              onChange={(selectedId, selectedObject) => {
                handleInputChange("client_id", selectedId);
                if (selectedObject) {
                  setFormData((prev) => ({
                    ...prev,
                    client_name: selectedObject.name,
                  }));
                }
              }}
              value={formData.client_id}
              initialLabel={formData.client_name}
              contentItem="name"
              valueKey="id"
              displayKey="name"
              name="client_id"
            />
            <Form.Error>{errors.client_id}</Form.Error>
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="design_id">
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-primary" />
                Design
              </div>
            </Form.Label>
            <DropdownServer
              apiService={searchDesign}
              placeholder="Ketik untuk mencari design..."
              onChange={(selectedId, selectedObject) => {
                handleInputChange("design_id", selectedId);
                if (selectedObject) {
                  setFormData((prev) => ({
                    ...prev,
                    design_name: selectedObject.code,
                  }));
                }
              }}
              value={formData.design_id}
              initialLabel={formData.design_name}
              contentItem="code"
              valueKey="id"
              displayKey="code"
              name="design_id"
            />
          </Form.Group>
        </div>

        {/* Process & Fabric Info */}
        <div className="p-4 border rounded-lg border-default bg-background/30">
          <h3 className="flex items-center gap-2 mb-3 text-sm font-medium text-primary-text">
            <Settings className="w-4 h-4 text-primary" />
            Process & Fabric Information
          </h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Form.Group>
              <Form.Label htmlFor="process_type" required>
                Process Type
              </Form.Label>
              <select
                id="process_type"
                value={formData.process_type}
                onChange={(e) => handleInputChange("process_type", e.target.value)}
                className="w-full px-3 py-2 text-sm transition-colors border rounded-lg bg-surface text-primary-text border-default focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select process type</option>
                {PROCESS_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <Form.Error>{errors.process_type}</Form.Error>
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="printing_machine" required>
                Printing Machine
              </Form.Label>
              <select
                id="printing_machine"
                value={formData.printing_machine}
                onChange={(e) => handleInputChange("printing_machine", e.target.value)}
                className="w-full px-3 py-2 text-sm transition-colors border rounded-lg bg-surface text-primary-text border-default focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select machine</option>
                {PRINTING_MACHINES.map((machine) => (
                  <option key={machine.value} value={machine.value}>
                    {machine.label}
                  </option>
                ))}
              </select>
              <Form.Error>{errors.printing_machine}</Form.Error>
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="jenis_kain">Jenis Kain</Form.Label>
              <Input
                id="jenis_kain"
                type="text"
                value={formData.jenis_kain}
                onChange={(e) => handleInputChange("jenis_kain", e.target.value)}
                placeholder="Enter jenis kain"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="kode_kain">Kode Kain</Form.Label>
              <Input
                id="kode_kain"
                type="text"
                value={formData.kode_kain}
                onChange={(e) => handleInputChange("kode_kain", e.target.value)}
                placeholder="Enter kode kain"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="lebar">Lebar (cm)</Form.Label>
              <Input
                id="lebar"
                type="number"
                step="0.01"
                value={formData.lebar}
                onChange={(e) => handleInputChange("lebar", e.target.value)}
                placeholder="Enter lebar"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="repeat_gambar">Repeat Gambar (cm)</Form.Label>
              <Input
                id="repeat_gambar"
                type="number"
                step="0.01"
                value={formData.repeat_gambar}
                onChange={(e) => handleInputChange("repeat_gambar", e.target.value)}
                placeholder="Enter repeat gambar"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="garis_potong">Garis Potong (mm)</Form.Label>
              <Input
                id="garis_potong"
                type="number"
                step="0.01"
                value={formData.garis_potong}
                onChange={(e) => handleInputChange("garis_potong", e.target.value)}
                placeholder="Enter garis potong"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="folding">Folding</Form.Label>
              <select
                id="folding"
                value={formData.folding}
                onChange={(e) => handleInputChange("folding", e.target.value)}
                className="w-full px-3 py-2 text-sm transition-colors border rounded-lg bg-surface text-primary-text border-default focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select folding</option>
                {FOLDING_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="face_direction">Face Direction</Form.Label>
              <select
                id="face_direction"
                value={formData.face_direction}
                onChange={(e) => handleInputChange("face_direction", e.target.value)}
                className="w-full px-3 py-2 text-sm transition-colors border rounded-lg bg-surface text-primary-text border-default focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select face direction</option>
                {FACE_DIRECTIONS.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="pe_type">PE Type</Form.Label>
              <select
                id="pe_type"
                value={formData.pe_type}
                onChange={(e) => handleInputChange("pe_type", e.target.value)}
                className="w-full px-3 py-2 text-sm transition-colors border rounded-lg bg-surface text-primary-text border-default focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select PE type</option>
                {PE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="jumlah_warna">Jumlah Warna</Form.Label>
              <Input
                id="jumlah_warna"
                type="number"
                value={formData.jumlah_warna}
                onChange={(e) => handleInputChange("jumlah_warna", e.target.value)}
                placeholder="Enter jumlah warna"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="unit_price">Unit Price</Form.Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => handleInputChange("unit_price", e.target.value)}
                placeholder="Enter unit price"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="unit_type">Unit Type</Form.Label>
              <Input
                id="unit_type"
                type="text"
                value={formData.unit_type}
                onChange={(e) => handleInputChange("unit_type", e.target.value)}
                placeholder="KG"
                disabled
              />
            </Form.Group>
          </div>
        </div>

        {/* Notes */}
        <Form.Group>
          <Form.Label htmlFor="notes">Notes</Form.Label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Enter additional notes"
            rows="3"
            className="w-full px-3 py-2 text-sm transition-colors border rounded-lg bg-surface text-primary-text border-default focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </Form.Group>

        {/* Process Conditions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-primary-text">
              <Settings className="w-4 h-4 text-primary" />
              Process Conditions
            </h3>
            <Button
              icon={Plus}
              label="Add Process"
              onClick={handleAddProcess}
            />
          </div>

          <div className="space-y-2">
            {processes.map((process, index) => (
              <div key={process.id} className="flex items-center gap-2">
                <select
                  value={process.process_type}
                  onChange={(e) => handleUpdateProcess(process.id, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm transition-colors border rounded-lg bg-surface text-primary-text border-default focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select process condition</option>
                  {PROCESS_CONDITIONS.map((cond) => (
                    <option key={cond.value} value={cond.value}>
                      {cond.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemoveProcess(process.id)}
                  className="p-2 transition-all duration-200 rounded text-danger hover:bg-danger/10"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {processes.length === 0 && (
              <p className="py-4 text-sm text-center text-secondary-text">
                No process conditions added yet
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-primary-text">
              <Package className="w-4 h-4 text-primary" />
              Details
            </h3>
            <Button icon={Plus} label="Add Detail" onClick={handleAddDetail} />
          </div>

          {errors.details && (
            <p className="flex items-center text-xs text-danger">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.details}
            </p>
          )}

          <div className="overflow-x-auto border rounded-lg border-default">
            <table className="w-full text-sm">
              <thead className="border-b bg-background/50 border-default">
                <tr>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    Ground Color
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    Roll
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-left uppercase text-secondary-text">
                    Quantity (KG)
                  </th>
                  <th className="p-3 text-xs font-medium tracking-wider text-center uppercase text-secondary-text">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {details.map((detail, index) => (
                  <tr
                    key={detail.id}
                    className="transition-colors duration-150 hover:bg-background/30"
                  >
                    <td className="p-3">
                      <Input
                        type="text"
                        size="sm"
                        value={detail.ground_color}
                        onChange={(e) =>
                          handleUpdateDetail(detail.id, "ground_color", e.target.value)
                        }
                        placeholder="Enter ground color"
                        error={!!errors[`detail_ground_color_${index}`]}
                      />
                      {errors[`detail_ground_color_${index}`] && (
                        <p className="mt-1 text-xs text-danger">
                          {errors[`detail_ground_color_${index}`]}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="0.01"
                        size="sm"
                        value={detail.roll}
                        onChange={(e) =>
                          handleUpdateDetail(detail.id, "roll", e.target.value)
                        }
                        placeholder="Roll"
                        error={!!errors[`detail_roll_${index}`]}
                      />
                      {errors[`detail_roll_${index}`] && (
                        <p className="mt-1 text-xs text-danger">
                          {errors[`detail_roll_${index}`]}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="0.01"
                        size="sm"
                        value={detail.quantity}
                        onChange={(e) =>
                          handleUpdateDetail(detail.id, "quantity", e.target.value)
                        }
                        placeholder="Quantity"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRemoveDetail(detail.id)}
                        className="p-1.5 text-danger hover:bg-danger/10 rounded transition-all duration-200"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {details.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-secondary-text">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-8 h-8 text-secondary-text/50" />
                        <p className="text-sm">No details added yet</p>
                        <p className="text-xs">Click "Add Detail" to start</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        {details.length > 0 && (
          <div className="p-3 border rounded-lg bg-primary/10 border-primary/20">
            <h4 className="flex items-center gap-2 mb-2 text-sm font-medium text-primary">
              <DollarSign className="w-3.5 h-3.5" />
              Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
              <div>
                <span className="text-secondary-text">Total Rolls:</span>
                <span className="ml-2 font-medium text-primary-text">
                  {summary.totalRolls.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-secondary-text">Total Quantity:</span>
                <span className="ml-2 font-medium text-primary-text">
                  {summary.totalQuantity.toFixed(2)} KG
                </span>
              </div>
              <div>
                <span className="text-secondary-text">Unit Price:</span>
                <span className="ml-2 font-medium text-primary-text">
                  {formatCurrency(formData.unit_price || 0)}
                </span>
              </div>
              <div>
                <span className="text-secondary-text">Total Price:</span>
                <span className="ml-2 font-medium text-primary">
                  {formatCurrency(summary.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}