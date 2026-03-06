import React, { useEffect, useState } from 'react';
import type { NotificationLogEntry } from '../../shared/types';

const TYPE_LABEL: Record<string, string> = {
  '3_month_warning': '3-month warning',
};

export default function History() {
  const [log, setLog] = useState<NotificationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api.getNotificationLog().then((data) => {
      setLog(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Notification History</h2>
        <p className="text-sm text-gray-400 mt-0.5">All renewal alerts that have been sent</p>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : log.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">No notifications sent yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Account</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Alert Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Fiscal Year</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {log.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2.5 text-gray-900 font-medium">{entry.account_name}</td>
                  <td className="px-5 py-2.5 text-gray-500">
                    {TYPE_LABEL[entry.notification_type] ?? entry.notification_type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-5 py-2.5 text-gray-500">{entry.fiscal_year}</td>
                  <td className="px-5 py-2.5 text-gray-400 text-xs">
                    {new Date(entry.sent_at).toLocaleString()}
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
