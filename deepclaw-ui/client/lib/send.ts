// A successful socket write is not a gateway acknowledgement.
export function sendAcknowledged(socket: WebSocket, request: { id: string; [key: string]: unknown }, timeoutMs = 15000): Promise<boolean> {
  return new Promise(resolve => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('close', onClose);
      socket.removeEventListener('error', onClose);
      resolve(ok);
    };
    const onMessage = (event: MessageEvent) => {
      try {
        const result = JSON.parse(event.data);
        if (result.type === 'res' && result.id === request.id) finish(result.ok === true);
      } catch { /* unrelated message */ }
    };
    const onClose = () => finish(false);
    const timer = setTimeout(() => finish(false), timeoutMs);
    socket.addEventListener('message', onMessage);
    socket.addEventListener('close', onClose);
    socket.addEventListener('error', onClose);
    try { socket.send(JSON.stringify(request)); } catch { finish(false); }
  });
}
