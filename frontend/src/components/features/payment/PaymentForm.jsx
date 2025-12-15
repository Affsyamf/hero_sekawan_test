import {
  AlertCircle,
  Calendar,
  DollarSign,
  ShoppingCart,
  CreditCard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { searchSales } from "../../../services/sale_service";
import Button from "../../ui/button/Button";
import DropdownServer from "../../ui/dropdown-server/DropdownServer";
import Form from "../../ui/form/Form";
import Input from "../../ui/input/Input";
import Modal from "../../ui/modal/Modal";

export default function PaymentForm({ entry = null, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    sale_id: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});

      if (entry) {
        setFormData({
          date:
            entry.date?.split("T")[0] || new Date().toISOString().split("T")[0],
          amount: entry.amount || "",
          sale_id: entry.sale_id || "",
        });
      } else {
        setFormData({
          date: new Date().toISOString().split("T")[0],
          amount: "",
          sale_id: "",
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

    if (!formData.date.trim()) {
      newErrors.date = "Date is required";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!formData.sale_id) {
      newErrors.sale_id = "Sale is required";
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
        amount: parseFloat(formData.amount),
      });
    } catch (error) {
      console.error("Error saving payment entry:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? "Edit Payment" : "New Payment"}
      subtitle="Record payment transaction for sale"
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
            icon={CreditCard}
            label={loading ? "Saving..." : "Save Payment"}
            onClick={handleSubmit}
            disabled={loading}
          />
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <Form.Label htmlFor="amount" required>
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                Amount
              </div>
            </Form.Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="Enter payment amount"
              error={!!errors.amount}
            />
            <Form.Error>{errors.amount}</Form.Error>
          </Form.Group>
        </div>

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

        {formData.amount && (
          <div className="p-3 border rounded-lg bg-primary/10 border-primary/20">
            <h4 className="flex items-center gap-2 mb-2 text-sm font-medium text-primary">
              <AlertCircle className="w-3.5 h-3.5" />
              Payment Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-secondary-text">Payment Date:</span>
                <span className="ml-2 font-medium text-primary-text">
                  {formData.date}
                </span>
              </div>
              <div>
                <span className="text-secondary-text">Amount:</span>
                <span className="ml-2 font-medium text-green-600">
                  {parseFloat(formData.amount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
