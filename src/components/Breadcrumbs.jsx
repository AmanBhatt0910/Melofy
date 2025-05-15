import Link from 'next/link';

export default function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center text-sm mb-6">
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center">
          <Link
            href={item.href}
            className={`transition-colors ${
              index === items.length - 1
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            {item.label}
          </Link>
          {index < items.length - 1 && (
            <span className="mx-2 text-muted-foreground">/</span>
          )}
        </div>
      ))}
    </nav>
  );
}