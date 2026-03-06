import React, { useState } from 'react';
import type { Account } from '../../shared/types';
import RenewalBadge from './RenewalBadge';
import ProductTags from './ProductTags';

interface Props {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  search: string;
  onSearchChange: (v: string) => void;
}

type SortKey = 'account_name' | 'arr' | 'renewal_date' | 'account_owner';

export default function AccountTable({ accounts, onEdit, onDelete, search, onSearchChange }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('renewal_date');
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((a) => !a);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const filtered = accounts
    .filter((a) => {
      const q = search.toLowerCase();
      return (
        a.account_name.toLowerCase().includes(q) ||
        a.account_owner.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === 'string'
          ? av.localeCompare(bv as string)
          : (av as number) - (bv as number);
      return sortAsc ? cmp : -cmp;
    });

  function SortBtn({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <button onClick={() => handleSort(col)} className="flex items-center gap-1 group">
        <span>{label}</span>
        <span className={`text-xs ${active ? 'text-green-600' : 'text-gray-300 group-hover:text-gray-400'}`}>
          {active ? (sortAsc ? '↑' : '↓') : '↕'}
        </span>
      </button>
    );
  }

  function SfdcLink({ url }: { url: string }) {
    if (!url) return <span className="text-gray-300">—</span>;
    return (
      <button
        onClick={() => window.api.openExternal(url)}
        className="text-blue-500 hover:text-blue-700 hover:underline text-xs"
        title={url}
      >
        Open ↗
      </button>
    );
  }

  return (
    <div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {search ? 'No accounts match your search.' : 'No accounts yet. Add one or import a CSV.'}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3"><SortBtn col="account_name" label="Account" /></th>
                <th className="px-4 py-3"><SortBtn col="arr" label="ARR" /></th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3"><SortBtn col="renewal_date" label="Renewal" /></th>
                <th className="px-4 py-3"><SortBtn col="account_owner" label="AE" /></th>
                <th className="px-4 py-3">AE Manager</th>
                <th className="px-4 py-3">Current Products</th>
                <th className="px-4 py-3">Target Products</th>
                <th className="px-4 py-3">SFDC</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a) => (
                <tr key={a.id} className="bg-white hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.account_name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    ${a.arr.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.num_agents}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-600">{a.renewal_date}</span>
                      <RenewalBadge renewalDate={a.renewal_date} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.account_owner || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.ae_manager || '—'}</td>
                  <td className="px-4 py-3"><ProductTags products={a.current_products} /></td>
                  <td className="px-4 py-3"><ProductTags products={a.target_products} /></td>
                  <td className="px-4 py-3"><SfdcLink url={a.sfdc_link} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => onEdit(a)}
                        className="text-xs text-gray-500 hover:text-green-600 px-2 py-1 rounded hover:bg-green-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(a)}
                        className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
