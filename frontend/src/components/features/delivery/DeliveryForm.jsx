import {
  AlertCircle,
  Calendar,
  FileText,
  Package,
  Truck,
  ShoppingCart,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { searchSales } from "../../../services/sale_service";
import { searchReturn } from "../../../services/return_service";
import Button from "../../ui/button/Button";
import DropdownServer from "../../ui/dropdown-server/DropdownServer";
import Form from "../../ui/form/Form";
import Input from "../../ui/input/Input";
import Modal from "../../ui/modal/Modal";

export default function DeliveryForm({
  entry = null,
  isOpen,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    code: "",
    date: new Date().toISOString().split("T")[0],
    quantity: "",
    sale_id: "",
    return_id: "",
    delivery_type: "sale", // to track which type is selected
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});

      if (entry) {
        setFormData({
          code: entry.code || "",
          date:
            entry.date?.split("T")[0] || new Date().toISOString().split("T")[0],
          quantity: entry.quantity || "",
          sale_id: entry.sale_id || "",
          return_id: entry.return_id || "",
          delivery_type: entry.sale_id ? "sale" : "return",
        });
      } else {
        setFormData({
          code: "",
          date: new Date().toISOString().split("T")[0],
          quantity: "",
          sale_id: "",
          return_id: "",
          delivery_type: "sale",
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

  const handleDeliveryTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      delivery_type: type,
      sale_id: "",
      return_id: "",
    }));
    // Clear related errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.sale_id;
      delete newErrors.return_id;
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "Code is required";
    }

    if (!formData.date.trim()) {
      newErrors.date = "Date is required";
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Valid quantity is required";
    }

    // Validate exclusive arc: exactly one of sale_id or return_id must be set
    if (formData.delivery_type === "sale" && !formData.sale_id) {
      newErrors.sale_id = "Sale is required";
    }

    if (formData.delivery_type === "return" && !formData.return_id) {
      newErrors.return_id = "Return is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        code: formData.code,
        date: formData.date,
        quantity: parseFloat(formData.quantity),
        id: entry?.id,
      };

      // Set only the relevant FK based on delivery_type
      if (formData.delivery_type === "sale") {
        payload.sale_id = formData.sale_id;
        payload.return_id = null;
      } else {
        payload.return_id = formData.return_id;
        payload.sale_id = null;
      }

      await onSave(payload);
    } catch (error) {
      console.error("Error saving delivery entry:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? "Edit Delivery" : "New Delivery"}
      subtitle="Manage delivery transaction details"
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
            icon={Truck}
            label={loading ? "Saving..." : "Save Delivery"}
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
                Code (No SJ)
              </div>
            </Form.Label>
            <Input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value)}
              placeholder="Enter delivery code"
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

        <Form.Group>
          <Form.Label htmlFor="quantity" required>
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-primary" />
              Quantity
            </div>
          </Form.Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            step="0.01"
            value={formData.quantity}
            onChange={(e) => handleInputChange("quantity", e.target.value)}
            placeholder="Enter delivery quantity"
            error={!!errors.quantity}
          />
          <Form.Error>{errors.quantity}</Form.Error>
        </Form.Group>

        <div className="space-y-3">
          <Form.Label required>
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-primary" />
              Delivery Type
            </div>
          </Form.Label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleDeliveryTypeChange("sale")}
              className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                formData.delivery_type === "sale"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-default bg-surface text-secondary-text hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span className="font-medium">From Sale</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDeliveryTypeChange("return")}
              className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                formData.delivery_type === "return"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-default bg-surface text-secondary-text hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span className="font-medium">From Return</span>
              </div>
            </button>
          </div>
        </div>

        {formData.delivery_type === "sale" && (
          <Form.Group>
            <Form.Label htmlFor="sale_id" required>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                Sale
              </div>
            </Form.Label>
            <DropdownServer
              apiService={searchSales}
              placeholder="Select Sale"
              value={formData.sale_id}
              onChange={(saleId) => handleInputChange("sale_id", saleId)}
              name="sale_id"
              valueKey="id"
              displayKey="code"
              contentItem="code"
            />
            <Form.Error>{errors.sale_id}</Form.Error>
          </Form.Group>
        )}

        {formData.delivery_type === "return" && (
          <Form.Group>
            <Form.Label htmlFor="return_id" required>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-primary" />
                Return
              </div>
            </Form.Label>
            <DropdownServer
              apiService={searchReturn}
              placeholder="Select Return"
              value={formData.return_id}
              onChange={(returnId) => handleInputChange("return_id", returnId)}
              name="return_id"
              valueKey="id"
              displayKey="code"
              contentItem="code"
            />
            <Form.Error>{errors.return_id}</Form.Error>
          </Form.Group>
        )}

        {formData.quantity && (
          <div className="p-3 border rounded-lg bg-primary/10 border-primary/20">
            <h4 className="flex items-center gap-2 mb-2 text-sm font-medium text-primary">
              <AlertCircle className="w-3.5 h-3.5" />
              Delivery Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-secondary-text">Delivery Type:</span>
                <span className="ml-2 font-medium capitalize text-primary-text">
                  {formData.delivery_type}
                </span>
              </div>
              <div>
                <span className="text-secondary-text">Quantity:</span>
                <span className="ml-2 font-medium text-primary-text">
                  {parseFloat(formData.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
