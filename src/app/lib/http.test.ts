/// <reference types="node" />

import test from 'node:test';
import assert from 'node:assert/strict';
import { HTTP_ERROR_TEXT, getJsonApiErrorMessage, readJsonSafely } from './http.ts';

test('readJsonSafely parses valid JSON payloads', async () => {
  const response = new Response(JSON.stringify({ ok: true, message: 'hello' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  const parsed = await readJsonSafely<{ ok: boolean; message: string }>(response);

  assert.equal(parsed.ok, true);
  assert.equal(parsed.status, 200);
  assert.equal(parsed.parseError, null);
  assert.deepEqual(parsed.data, { ok: true, message: 'hello' });
});

test('readJsonSafely reports empty bodies', async () => {
  const response = new Response('', { status: 502 });

  const parsed = await readJsonSafely<{ error?: string; message?: string }>(response);

  assert.equal(parsed.parseError, HTTP_ERROR_TEXT.emptyBody);
  assert.equal(getJsonApiErrorMessage(parsed), `${HTTP_ERROR_TEXT.emptyBody} (HTTP 502)`);
});

test('readJsonSafely reports non-JSON bodies', async () => {
  const response = new Response('<html>nope</html>', { status: 500 });

  const parsed = await readJsonSafely<{ error?: string; message?: string }>(response);

  assert.equal(parsed.parseError, HTTP_ERROR_TEXT.nonJsonBody);
  assert.equal(getJsonApiErrorMessage(parsed), `${HTTP_ERROR_TEXT.nonJsonBody} (HTTP 500)`);
});

test('getJsonApiErrorMessage standardizes non-2xx JSON errors', async () => {
  const response = new Response(JSON.stringify({ error: 'Bad credentials' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });

  const parsed = await readJsonSafely<{ error?: string }>(response);

  assert.equal(parsed.ok, false);
  assert.equal(getJsonApiErrorMessage(parsed), `${HTTP_ERROR_TEXT.jsonApiError} Bad credentials`);
});
