import test from 'node:test';
import assert from 'node:assert/strict';
import { sendAcknowledged } from '../client/lib/send.ts';

class Socket extends EventTarget {
  send() {}
  reply(data) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) })); }
}
test('only the matching positive gateway response confirms a send', async () => {
  const socket = new Socket();
  const pending = sendAcknowledged(socket, { id: 'a' }, 100);
  socket.reply({ type: 'event', id: 'a', ok: true });
  socket.reply({ type: 'res', id: 'other', ok: true });
  socket.reply({ type: 'res', id: 'a', ok: true });
  assert.equal(await pending, true);
});
test('gateway rejection preserves failure', async () => {
  const socket = new Socket();
  const pending = sendAcknowledged(socket, { id: 'a' }, 100);
  socket.reply({ type: 'res', id: 'a', ok: false });
  assert.equal(await pending, false);
});
test('disconnect and timeout never imply delivery', async () => {
  const socket = new Socket();
  const pending = sendAcknowledged(socket, { id: 'a' }, 100);
  socket.dispatchEvent(new Event('close'));
  assert.equal(await pending, false);
  assert.equal(await sendAcknowledged(new Socket(), { id: 'b' }, 5), false);
});
test('a thrown socket write resolves as failure', async () => {
  const socket = new Socket(); socket.send = () => { throw new Error('closed'); };
  assert.equal(await sendAcknowledged(socket, { id: 'a' }), false);
});
