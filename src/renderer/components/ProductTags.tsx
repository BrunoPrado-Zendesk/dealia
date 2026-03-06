import React from 'react';
import type { Product } from '../../shared/types';

const colors: Record<Product, string> = {
  'AI Agents': 'bg-purple-100 text-purple-700',
  Copilot: 'bg-blue-100 text-blue-700',
  QA: 'bg-teal-100 text-teal-700',
};

interface Props {
  products: Product[];
}

export default function ProductTags({ products }: Props) {
  if (products.length === 0) {
    return <span className="text-gray-400 text-xs">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {products.map((p) => (
        <span
          key={p}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${colors[p]}`}
        >
          {p}
        </span>
      ))}
    </div>
  );
}
