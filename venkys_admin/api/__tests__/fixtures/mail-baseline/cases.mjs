// Fixed inputs shared by the baseline generator and the regression test.
export const TS = '21 Sept 2026, 7:00 pm'
export const LOG_CASES = {
  roles_create_changed: { type: 'roles_create', message: '[CREATE] Staff member added <b>x</b>', metadata: { documentId: 'a@b.com', performedBy: 'owner@x.com', changedFields: { role: { from: null, to: 'staff' }, pageAccess: { from: { a: 1 }, to: '' } } } },
  roles_update: { type: 'roles_update', message: '[UPDATE] Staff member updated', metadata: { performedBy: 'owner@x.com', changedFields: { role: { from: 'staff', to: 'admin' } } } },
  stock_low: { type: 'stock_low_alert', message: 'Cheese is below 2 kg', metadata: { item: 'cheese', qty: 1.5 } },
  rate_limit: { type: 'rate_limit_violation', message: 'Rate limit exceeded for place-order', metadata: { clientId: 'ip:1.2.3.4', routeName: 'place-order', reason: 'burst', timestamp: '2026-09-21T13:30:00.000Z' } },
  unknown_no_meta: { type: 'something_new', message: 'Hello & "quotes"' },
}
export const CLEANUP = { count: 42, reviewUrl: 'https://venkys-admin.web.app/admin/log-cleanup?token=abc', oldestLabel: '1 Jul 2026, 9:00 am' }
export const INVITE = { inviteUrl: 'https://venkys-admin.web.app/claim?token=xyz', role: 'staff', invitedByName: 'Owner <O>', expiresAt: new Date('2026-09-23T13:30:00.000Z') }
