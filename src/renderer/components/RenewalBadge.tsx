import React from 'react';

interface Props {
  renewalDate: string;
}

export function daysUntil(renewalDate: string): number {
  return Math.ceil(
    (new Date(renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

export default function RenewalBadge({ renewalDate }: Props) {
  const days = daysUntil(renewalDate);

  if (days < 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
        Expired
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
        {days}d — Urgent
      </span>
    );
  }
  if (days <= 60) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
        {days}d
      </span>
    );
  }
  if (days <= 90) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
        {days}d
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
      {days}d
    </span>
  );
}
