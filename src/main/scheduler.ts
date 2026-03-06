import { Notification } from 'electron';
import { getAllAccounts, hasNotificationBeenSent, logNotification, getSettings } from './database';
import { sendRenewalNotification } from './slack';
import type { Account } from '../shared/types';

function sendMacNotification(account: Account, daysUntil: number): void {
  const arr = `$${account.arr.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  const products = account.target_products.length > 0
    ? account.target_products.join(', ')
    : 'No target products';

  new Notification({
    title: `Renewal in ${daysUntil} days — ${account.account_name}`,
    body: `${arr} ARR · ${products} · Owner: ${account.account_owner || 'Unassigned'}`,
  }).show();
}

export async function runRenewalCheck(): Promise<number> {
  const settings = getSettings();
  if (!settings.notification_enabled) return 0;

  const accounts = getAllAccounts();
  const now = new Date();
  let sent = 0;

  for (const account of accounts) {
    const renewalDate = new Date(account.renewal_date);
    const daysUntil = Math.ceil(
      (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntil <= 0 || daysUntil > 90) continue;

    const fiscalYear = renewalDate.getFullYear().toString();
    if (hasNotificationBeenSent(account.id, '3_month_warning', fiscalYear)) continue;

    // Always send macOS notification
    sendMacNotification(account, daysUntil);

    // Also send Slack if configured
    if (settings.slack_webhook_url) {
      await sendRenewalNotification(account);
    }

    logNotification(account.id, '3_month_warning', fiscalYear);
    sent++;
  }

  return sent;
}

export function startScheduler(): void {
  runRenewalCheck().catch(console.error);

  setInterval(() => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 10) {
      runRenewalCheck().catch(console.error);
    }
  }, 6 * 60 * 60 * 1000);
}
