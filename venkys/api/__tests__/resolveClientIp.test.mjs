import test from 'node:test';
import assert from 'node:assert/strict';
import { getClientIp } from '../_lib/rateLimiter.js';

test('x-real-ip present: a spoofed x-forwarded-for is ignored', () => {
  const req = {
    headers: {
      'x-forwarded-for': '1.1.1.1, 2.2.2.2',
      'x-real-ip': '203.0.113.195',
    },
  };
  assert.equal(getClientIp(req), '203.0.113.195');
});

test('x-real-ip absent: the LAST x-forwarded-for entry (proxy-appended) is used, not the caller-supplied leftmost', () => {
  const req = {
    headers: {
      'x-forwarded-for': '198.51.100.1, 198.51.100.2, 203.0.113.50',
    },
  };
  assert.equal(getClientIp(req), '203.0.113.50');
});

test('x-vercel-forwarded-for wins over everything and takes its last entry', () => {
  const req = {
    headers: {
      'x-vercel-forwarded-for': '203.0.113.99',
      'x-real-ip': '198.51.100.5',
      'x-forwarded-for': '1.2.3.4',
    },
  };
  assert.equal(getClientIp(req), '203.0.113.99');
});

test('the old [0] behaviour is gone: leftmost spoof never wins', () => {
  const req = {
    headers: {
      'x-forwarded-for': '10.0.0.1, 203.0.113.44',
    },
  };
  assert.notEqual(getClientIp(req), '10.0.0.1');
  assert.equal(getClientIp(req), '203.0.113.44');
});

test('nothing usable -> stable fallback', () => {
  const req = {
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  };
  assert.equal(getClientIp(req), '127.0.0.1');
});
