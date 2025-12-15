import {
  AlertCircle,
  Calendar,
  FileText,
  Package,
  ShoppingCart,
  Users,
  Layers,
} from "lucide-react";
import { useEffect, useState } from "react";
import { searchClient } from "../../../services/client_service";
import { searchColorKitchen } from "../../../services/color_kitchen_service";
import { searchOpj } from "../../../services/opj_service";
import Button from "../../ui/button/Button";
import DropdownServer from "../../ui/dropdown-server/DropdownServer";
import Form from "../../ui/form/Form";
import Input from "../../ui/input/Input";
import Modal from "../../ui/modal/Modal";

export default function SaleForm({
  entry = null,
  isOpen,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    code: "",
    date: new Date().toISOString().split("T")[0],
    quantity_start: "",
    quantity_end: "",
    client_id: "",
    opj_id: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});

      if (entry) {
        setFormData({
          code: entry.code || "",
          date: entry.date?.split("T")[0] || new Date().toISOString().split("T")[0],
          quantity_start: entry.quantity_start || "",
          quantity_end: entry.quantity_end || "",
          client_id: entry.client_id || "",
          opj_id: entry.opj_id || "",
        });
      } else {
        setFormData({
          code: "",
          date: new Date().toISOString().split("T")[0],
          quantity_start: "",
          quantity_end: "",
          client_id: "",
          opj_id: "",
        });
      }
    }
  }, [isOpen, entry]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "Code is required";
    }

    if (!formData.date.trim()) {
      newErrors.date = "Date is required";
    }

    if (!formData.quantity_start || parseFloat(formData.quantity_start) < 0) {
      newErrors.quantity_start = "Valid quantity start is required";
    }

    if (!formData.quantity_end || parseFloat(formData.quantity_end) < 0) {
      newErrors.quantity_end = "Valid quantity end is required";
    }

    if (!formData.client_id) {
      newErrors.client_id = "Client is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave({ 
        ...formData, 
        id: entry?.id,
        quantity_start: parseFloat(formData.quantity_start),
        quantity_end: parseFloat(formData.quantity_end),
      });
    } catch (error) {
      console.error("Error saving sale entry:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? "Edit Sale" : "New Sale"}
      subtitle="Manage sale transaction details"
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
            icon={ShoppingCart}
            label={loading ? "Saving..." : "Save Sale"}
            onClick={handleSubmit}
            disabled={loading}
          />
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Group>
            <Form.Label htmlFor="code" required>
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Code (No Faktur)
              </div>
            </Form.Label>
            <Input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value)}
              placeholder="Enter sale code"
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
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Group>
            <Form.Label htmlFor="quantity_start" required>
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-primary" />
                Quantity Start (Asal)
              </div>
            </Form.Label>
            <Input
              id="quantity_start"
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity_start}
              onChange={(e) => handleInputChange("quantity_start", e.target.value)}
              placeholder="Enter starting quantity"
              error={!!errors.quantity_start}
            />
            <Form.Error>{errors.quantity_start}</Form.Error>
          </Form.Group>

          <Form.Group>
            <Form.Label htmlFor="quantity_end" required>
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-primary" />
                Quantity End (Jadi)
              </div>
            </Form.Label>
            <Input
              id="quantity_end"
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity_end}
              onChange={(e) => handleInputChange("quantity_end", e.target.value)}
              placeholder="Enter final quantity"
              error={!!errors.quantity_end}
            />
            <Form.Error>{errors.quantity_end}</Form.Error>
          </Form.Group>
        </div>

        <Form.Group>
          <Form.Label htmlFor="client_id" required>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-primary" />
              Client
            </div>
          </Form.Label>
          <DropdownServer
            apiService={searchClient}
            placeholder="Select Client"
            value={formData.client_id}
            onChange={(clientId) => handleInputChange("client_id", clientId)}
            name="client_id"
            valueKey="id"
            displayKey="name"
            contentItem="name"
          />
          <Form.Error>{errors.client_id}</Form.Error>
        </Form.Group>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* <Form.Group>
            <Form.Label htmlFor="color_kitchen_id">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Color Kitchen (Optional)
              </div>
            </Form.Label>
            <DropdownServer
              apiService={searchColorKitchen}
              placeholder="Select Color Kitchen"
              value={formData.color_kitchen_id}
              onChange={(colorKitchenId) => handleInputChange("color_kitchen_id", colorKitchenId)}
              name="color_kitchen_id"
              valueKey="id"
              displayKey="name"
              contentItem="name"
            />
          </Form.Group> */}

          <Form.Group>
            <Form.Label htmlFor="opj_id">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                OPJ
              </div>
            </Form.Label>
            <DropdownServer
              apiService={searchOpj}
              placeholder="Select OPJ (Optional)"
              value={formData.opj_id}
              onChange={(opjId) => handleInputChange("opj_id", opjId)}
              name="opj_id"
              valueKey="id"
              displayKey="code"
              contentItem="code"
            />
          </Form.Group>
        </div>

        {formData.quantity_start && formData.quantity_end && (
          <div className="p-3 border rounded-lg bg-primary/10 border-primary/20">
            <h4 className="flex items-center gap-2 mb-2 text-sm font-medium text-primary">
              <AlertCircle className="w-3.5 h-3.5" />
              Quantity Summary
            </h4>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-secondary-text">Quantity Start:</span>
                <span className="ml-2 font-medium text-primary-text">
                  {parseFloat(formData.quantity_start).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-secondary-text">Quantity End:</span>
                <span className="ml-2 font-medium text-primary-text">
                  {parseFloat(formData.quantity_end).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-secondary-text">Difference:</span>
                <span className={`ml-2 font-medium ${
                  parseFloat(formData.quantity_start) > parseFloat(formData.quantity_end)
                    ? "text-red-600"
                    : parseFloat(formData.quantity_start) < parseFloat(formData.quantity_end)
                    ? "text-green-600"
                    : "text-primary-text"
                }`}>
                  {(parseFloat(formData.quantity_end) - parseFloat(formData.quantity_start)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}