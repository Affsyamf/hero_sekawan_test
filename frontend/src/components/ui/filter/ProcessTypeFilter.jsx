// ProcessTypeFilter.jsx
import Button from "../button/Button";

export default function ProcessTypeFilter({ value = [], onChange }) {
  const options = [
    { key: "disperse", label: "DISPERSE" },
    { key: "reactive", label: "REACTIVE" },
    { key: "pigment", label: "PIGMENT" },
  ];

  // Pastikan value adalah array
  const currentValue = Array.isArray(value) ? value : [];

  const toggleOption = (key) => {
    if (currentValue.includes(key)) {
      onChange(currentValue.filter(v => v !== key));
    } else {
      onChange([...currentValue, key]);
    }
  };

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-800">Process Type</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = currentValue.includes(opt.key);
          return (
            <Button
              key={opt.label}
              label={opt.label}
              onClick={() => toggleOption(opt.key)}
              variant={isActive ? "primary" : "neutral"}
            />
          );
        })}
      </div>
    </div>
  );
}