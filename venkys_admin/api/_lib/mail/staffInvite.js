/* eslint-env node */
// staff_invite template: the invite link sent to a new staff member.
// HTML moved verbatim from invites.js.

function buildInviteEmailHtml({ inviteUrl, role, invitedByName, expiresAt }, esc) {
  const expiresText = expiresAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
  return `
<div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1f2937; max-width: 560px;">
  <h2 style="margin: 0 0 4px;">You're invited to join Venky's staff</h2>
  <p style="color: #6b7280; margin: 0 0 20px; font-size: 13px;">Sent by ${esc(invitedByName)}</p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 4px 0; color: #6b7280; width: 90px; vertical-align: top;">What</td>
      <td style="padding: 4px 0;">${esc(invitedByName)} added you to the Venky's admin panel as <strong>${esc(role)}</strong>.</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; color: #6b7280; vertical-align: top;">Expires</td>
      <td style="padding: 4px 0;">${esc(expiresText)} IST — after that you'll need a fresh invite.</td>
    </tr>
  </table>

  <div style="margin: 24px 0;">
    <a href="${inviteUrl}" style="display: inline-block; background: #f59e0b; color: #1f2937; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
      Activate my access
    </a>
  </div>

  <p style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 10px 14px; margin: 0 0 20px; font-size: 14px;">
    <strong>Why it matters:</strong> This link only works when you sign in with the email address it was sent to. If you weren't expecting this, you can safely ignore it — nothing happens until the link is opened and confirmed.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
  <p style="color: #9ca3af; font-size: 11px;">Sent from Venky's Cheat Mealz staff onboarding</p>
</div>
  `.trim()
}

// data: { inviteUrl, role, invitedByName, expiresAt: Date }
export const staffInvite = {
  validate: (d) => (!d?.inviteUrl || !d?.role || !(d?.expiresAt instanceof Date) ? 'inviteUrl, role and expiresAt are required' : null),
  subject: () => "You're invited to join Venky's staff",
  html: (d, { esc }) => buildInviteEmailHtml(d, esc),
}
