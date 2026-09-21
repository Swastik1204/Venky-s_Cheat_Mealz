/* eslint-env node */
// log_cleanup_review template: the weekly "old logs are ready for cleanup"
// email to the super admin. HTML moved verbatim from cleanup-logs.js.

function buildReviewEmailHtml({ count, reviewUrl, oldestLabel }, esc) {
  return `
<div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1f2937; max-width: 560px;">
  <h2 style="margin: 0 0 4px;">${count} old logs are ready for cleanup</h2>
  <p style="color: #6b7280; margin: 0 0 20px; font-size: 13px;">Weekly audit log review</p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 4px 0; color: #6b7280; width: 90px; vertical-align: top;">What</td>
      <td style="padding: 4px 0;">${count} audit log entries are older than 2 months and are candidates for deletion. Oldest entry: ${esc(oldestLabel)}.</td>
    </tr>
  </table>

  <div style="margin: 24px 0;">
    <a href="${reviewUrl}" style="display: inline-block; background: #f59e0b; color: #1f2937; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
      Review &amp; decide
    </a>
  </div>

  <p style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 10px 14px; margin: 0 0 20px; font-size: 14px;">
    <strong>Why it matters:</strong> Nothing is deleted automatically. Every entry is pre-selected on the review page, but you choose exactly what stays or goes before anything is removed.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
  <p style="color: #9ca3af; font-size: 11px;">Sent from Venky's Cheat Mealz log maintenance</p>
</div>
  `.trim()
}

// data: { count, reviewUrl, oldestLabel }
export const logCleanupReview = {
  validate: (d) => (!Number.isFinite(d?.count) || !d?.reviewUrl ? 'count and reviewUrl are required' : null),
  subject: (d) => `🔔 ${d.count} old logs are ready for cleanup`,
  html: (d, { esc }) => buildReviewEmailHtml({ count: d.count, reviewUrl: d.reviewUrl, oldestLabel: d.oldestLabel || 'unknown' }, esc),
}
