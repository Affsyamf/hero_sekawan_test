import Button from "../button/Button";

export default function CategoryFilter({ value = null, onChange }) {
  const options = [
    { key: null, label: "All" },
    { key: "both", label: "Chemical + Sparepart" },
    { key: "chemical", label: "Chemical" },
    { key: "sparepart", label: "Sparepart" },
  ];

  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-3 text-sm">Category</h3>

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = value === opt.key;
          return (
            <Button
              key={opt.label}
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
