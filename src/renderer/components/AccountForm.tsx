import React, { useState, useEffect } from 'react';
import type { Account, AccountFormData, Product } from '../../shared/types';
import { PRODUCTS } from '../../shared/types';

interface Props {
  account?: Account | null;
  onSave: () => void;
  onClose: () => void;
}

const empty: AccountFormData = {
  account_name: '',
  arr: 0,
  num_agents: 0,
  renewal_date: '',
  account_owner: '',
  current_products: [],
  target_products: [],
  sfdc_link: '',
  ae_manager: '',
  notes: '',
};

export default function AccountForm({ account, onSave, onClose }: Props) {
  const [form, setForm] = useState<AccountFormData>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof AccountFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setForm({
        account_name: account.account_name,
        arr: account.arr,
        num_agents: account.num_agents,
        renewal_date: account.renewal_date,
        account_owner: account.account_owner,
        current_products: account.current_products,
        target_products: account.target_products,
        sfdc_link: account.sfdc_link,
        ae_manager: account.ae_manager,
        notes: account.notes,
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [account]);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.account_name.trim()) e.account_name = 'Account name is required';
    if (!form.renewal_date) e.renewal_date = 'Renewal date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (account) {
        await window.api.updateAccount(account.id, form);
      } else {
        await window.api.addAccount(form);
      }
      onSave();
    } finally {
      setSaving(false);
    }
  }

  function toggleCurrent(p: Product) {
    setForm((f) => ({
      ...f,
      current_products: f.current_products.includes(p)
        ? f.current_products.filter((x) => x !== p)
        : [...f.current_products, p],
    }));
  }

  function toggleTarget(p: Product) {
    setForm((f) => ({
      ...f,
      target_products: f.target_products.includes(p)
        ? f.target_products.filter((x) => x !== p)
        : [...f.target_products, p],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-[520px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {account ? 'Edit Account' : 'Add Account'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Account Name *</label>
            <input
              type="text"
              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 ${errors.account_name ? 'border-red-400' : 'border-gray-200'}`}
              value={form.account_name}
              onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
            />
            {errors.account_name && <p className="text-xs text-red-500 mt-1">{errors.account_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ARR ($)</label>
              <input
                type="number"
                min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
                value={form.arr}
                onChange={(e) => setForm((f) => ({ ...f, arr: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Seats</label>
              <input
                type="number"
                min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
                value={form.num_agents}
                onChange={(e) => setForm((f) => ({ ...f, num_agents: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Renewal Date *</label>
              <input
                type="date"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 ${errors.renewal_date ? 'border-red-400' : 'border-gray-200'}`}
                value={form.renewal_date}
                onChange={(e) => setForm((f) => ({ ...f, renewal_date: e.target.value }))}
              />
              {errors.renewal_date && <p className="text-xs text-red-500 mt-1">{errors.renewal_date}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Owner</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
                value={form.account_owner}
                onChange={(e) => setForm((f) => ({ ...f, account_owner: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">AE Manager</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
              value={form.ae_manager}
              onChange={(e) => setForm((f) => ({ ...f, ae_manager: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Salesforce Link</label>
            <input
              type="url"
              placeholder="https://zendesk.my.salesforce.com/…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
              value={form.sfdc_link}
              onChange={(e) => setForm((f) => ({ ...f, sfdc_link: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Current Products</label>
              <div className="flex flex-col gap-1.5">
                {PRODUCTS.map((p) => (
                  <label key={p} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.current_products.includes(p)}
                      onChange={() => toggleCurrent(p)}
                      className="accent-green-600"
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Target Products</label>
              <div className="flex flex-col gap-1.5">
                {PRODUCTS.map((p) => (
                  <label key={p} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.target_products.includes(p)}
                      onChange={() => toggleTarget(p)}
                      className="accent-green-600"
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 resize-none"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : account ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
