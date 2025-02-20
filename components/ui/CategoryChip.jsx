export default function CategoryChip({ category, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium ${className}`}
      style={{
        backgroundColor: `${category.color}15`,
        color: category.color
      }}
      contentEditable={false}
    >
      {category.icon && <span className="mr-1">{category.icon}</span>}
      {category.name}
    </span>
  );
}
