import Button from "../button/Button";

export default function UnitFilter({ value = null, onChange }) {
  const options = [
    { key: null, label: "Rupiah" },
    { key: "unit", label: "Unit" },
  ];

  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-3 text-sm">Unit</h3>

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = value === opt.key;
          return (
            <Button
              label={opt.label}
              onClick={() => onChange(opt.key)}
              variant={isActive ? "primary" : "neutral"}
            />
          );
        })}
      </div>
    </div>
  );
}
