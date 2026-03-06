import type { Account } from '../shared/types';
import { getSetting } from './database';

export async function sendRenewalNotification(account: Account): Promise<void> {
  const webhookUrl = getSetting('slack_webhook_url');
  if (!webhookUrl) return;

  const daysUntilRenewal = Math.ceil(
    (new Date(account.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const products = account.target_products.length > 0 ? account.target_products.join(', ') : 'None';
  const arrFormatted = `$${account.arr.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

  const payload = {
    text: `Renewal Alert: *${account.account_name}*`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔔 Renewal Alert — 3 Months Out' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Account:*\n${account.account_name}` },
          { type: 'mrkdwn', text: `*ARR:*\n${arrFormatted}` },
          { type: 'mrkdwn', text: `*Renewal Date:*\n${account.renewal_date} (${daysUntilRenewal} days)` },
          { type: 'mrkdwn', text: `*Account Owner:*\n${account.account_owner || 'Unassigned'}` },
          { type: 'mrkdwn', text: `*Products:*\n${products}` },
          { type: 'mrkdwn', text: `*# Agents:*\n${account.num_agents}` },
        ],
      },
    ],
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function sendTestNotification(): Promise<{ ok: boolean; error?: string }> {
  const webhookUrl = getSetting('slack_webhook_url');
  if (!webhookUrl) {
    return { ok: false, error: 'No webhook URL configured' };
  }

  const payload = {
    text: '✅ Deal Tracker test notification — your Slack integration is working!',
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return { ok: true };
    } else {
      return { ok: false, error: `Slack returned ${res.status}` };
    }
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
