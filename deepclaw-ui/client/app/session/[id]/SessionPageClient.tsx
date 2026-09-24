'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import LobsterLogo from '@/components/LobsterLogo';
import ChatPanel from '@/components/ChatPanel';
import BladeCursor from '@/components/BladeCursor';
import { getSessionLinkedProject } from '@/lib/api';

export default function SessionPageClient() {
  const params       = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const sessionId    = decodeURIComponent(params.id);
  const [initialQ, setInitialQ] = useState('');

  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [linkedSlug, setLinkedSlug] = useState<string | null>(null);
  const [linkError, setLinkError] = useState('');

   
  useEffect(() => {
    setSessionKey(sessionStorage.getItem(`sk-${sessionId}`));
    setInitialQ(sessionStorage.getItem(`draft-${sessionId}`) || searchParams.get('q') || '');
  }, [sessionId, searchParams]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const slug = await getSessionLinkedProject(sessionId);
        if (cancelled) return;
        setLinkError('');
        if (slug) {
          setLinkedSlug(slug);
          router.replace(`/project/${encodeURIComponent(slug)}`);
          return;
        }
      } catch {
        if (!cancelled) setLinkError('项目关联暂不可用，正在重试。对话仍保留。');
      }
      if (!cancelled) timer = setTimeout(check, 3000);
    };
    void check();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sessionId, router]);

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 shrink-0"
              style={{ background: 'var(--bg-surface)', borderBottom: '2px solid var(--border)', minHeight: 46 }}>
        <button onClick={() => router.push('/')} className="dc-btn-ghost flex items-center gap-1.5">
          <LobsterLogo size={17} />
          <span style={{ fontFamily: 'var(--font-brand)', fontSize: 14, letterSpacing: '0.06em' }}>DeepClaw</span>
        </button>
        <span style={{ color: 'var(--border)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>/</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)',
                       letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          NEW SESSION
          <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
            {sessionId.slice(0, 12)}…
          </span>
        </span>

        <div className="flex items-center gap-2 ml-auto">
          {linkedSlug ? (
            <>
              <span className="pulse-dot inline-block"
                    style={{ width: 6, height: 6, borderRadius: 0, background: 'var(--nb-lime)', display: 'inline-block' }} />
              <span style={{ fontSize: 10, color: 'var(--nb-lime)', fontFamily: 'var(--font-mono)',
                             letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                PROJECT CREATED: {linkedSlug} — REDIRECTING…
              </span>
            </>
          ) : (
            <>
              <span className="pulse-dot inline-block"
                    style={{ width: 6, height: 6, borderRadius: 0, background: 'var(--nb-cyan)', display: 'inline-block' }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                             letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                WAITING FOR AI TO CREATE PROJECT…
              </span>
            </>
          )}
        </div>
      </header>

      {/* Chat */}
      {linkError && <p role="status" className="dc-error">{linkError}</p>}
      <div className="flex-1 overflow-hidden">
        <ChatPanel
          sessionId={sessionId}
          sessionKey={sessionKey}
          initialMessage={initialQ || undefined}
        />
      </div>

      <BladeCursor />
    </div>
  );
}
