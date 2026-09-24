'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSession, uploadPdfs } from '@/lib/api';

interface Props {
  open:    boolean;
  onClose: () => void;
  inline?: boolean;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  outline: 'none',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-ui)',
  fontSize: 14,
  transition: 'border-color 200ms, box-shadow 200ms',
};

export default function LaunchDialog({ open, onClose, inline = false }: Props) {
  const router = useRouter();
  const [question, setQuestion]   = useState('');
  const [pdfFiles, setPdfFiles]   = useState<File[]>([]);
  const [creating, setCreating]   = useState(false);
  const [error, setError]         = useState('');
  const [dragOver, setDragOver]   = useState(false);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const dragCounterRef            = useRef(0);
  const inFlight = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const previous = document.activeElement as HTMLElement | null;
      if (!inline) textareaRef.current?.focus();
      return () => { if (!inline) previous?.focus(); };
    }
  }, [open, inline]);

  const addFiles = (incoming: File[]) => {
    const pdfs = incoming.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (incoming.length !== pdfs.length) setError('仅支持 PDF 文件');
    if (pdfs.some(f => f.size > 50 * 1024 * 1024) || pdfFiles.length + pdfs.length > 10) {
      setError('最多添加 10 篇 PDF，每篇不超过 50 MB'); return;
    }
    if (!pdfs.length) return;
    setPdfFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      return [...prev, ...pdfs.filter(f => !existingNames.has(f.name))];
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current += 1;
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setDragOver(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current = 0;
    setDragOver(false);
    if (creating) return;
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removePdf = (name: string) => {
    setPdfFiles(prev => prev.filter(f => f.name !== name));
  };

  const handleLaunch = useCallback(async () => {
    if (inFlight.current) return;
    const q = question.trim();
    if (!q && pdfFiles.length === 0) { setError('请输入研究问题或上传 PDF 论文'); return; }
    inFlight.current = true;
    setCreating(true); setError('');
    try {
      let initialMessage = q;
      if (pdfFiles.length > 0) {
        const uploaded = await uploadPdfs(pdfFiles);
        const fileLines = uploaded.map(f => `- ${f.name} → ${f.path}`).join('\n');
        initialMessage = [
          '[PDF-INPUT]',
          `文件列表：`,
          fileLines,
          q ? `用户备注：${q}` : '',
        ].filter(Boolean).join('\n');
      }
      const { sessionId, sessionKey } = await createSession();
      sessionStorage.setItem(`sk-${sessionId}`, sessionKey);
      sessionStorage.setItem(`draft-${sessionId}`, initialMessage);
      router.push(`/session/${encodeURIComponent(sessionId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create session');
      setCreating(false);
      inFlight.current = false;
    }
  }, [question, pdfFiles, onClose, router]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !inFlight.current && !inline) onClose();
    if (e.key === 'Tab' && !inline) {
      const items = panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled), input:not(:disabled):not([type=file]), a[href]');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  const focusStyle = (el: HTMLElement) => {
    el.style.borderColor = 'rgba(52,211,153,0.4)';
    el.style.boxShadow   = '0 0 18px rgba(52,211,153,0.08)';
  };
  const blurStyle = (el: HTMLElement) => {
    el.style.borderColor = 'rgba(255,255,255,0.1)';
    el.style.boxShadow   = 'none';
  };

  if (!open) return null;

  const canLaunch = (question.trim().length > 0 || pdfFiles.length > 0) && !creating;

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        position: inline ? 'relative' : 'fixed', inset: 0, zIndex: inline ? 1 : 9000,
        background: inline ? 'transparent' : 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: inline ? 0 : 16,
      }}
      onClick={e => { if (!inline && !inFlight.current && e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role={inline ? undefined : 'dialog'}
        aria-modal={inline ? undefined : true}
        aria-labelledby="launch-heading"
        aria-busy={creating}
        className="card-enter"
        style={{
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: 'clamp(20px, 4vw, 32px)',
          width: '100%', maxWidth: inline ? 'none' : 540,
          maxHeight: inline ? undefined : 'calc(100dvh - 32px)', overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 40, right: 40, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.4), transparent)',
          borderRadius: '0 0 2px 2px',
        }} />

        {/* Close */}
        {!inline && <button
          aria-label="关闭研究窗口"
          disabled={creating}
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 18, lineHeight: 1,
            padding: '4px 8px', borderRadius: 6,
            transition: 'color 150ms, background 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
        >
          ✕
        </button>}

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div id="launch-heading" style={{
            fontFamily: 'var(--font-brand)',
            fontSize: 20, fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            新的研究，从一个问题开始
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', lineHeight: 1.5 }}>
            描述问题或导入论文，确认研究方向和运行模式后开始。
          </div>
        </div>

        {/* PDF upload area */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="research-pdfs" style={{
            display: 'block', marginBottom: 8,
            fontSize: 10, fontFamily: 'var(--font-mono)',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            上传 PDF 论文（可选，支持多篇）
          </label>
          <input
            ref={fileInputRef}
            id="research-pdfs"
            type="file"
            accept=".pdf"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              border: dragOver ? '1px dashed rgba(52,211,153,0.6)' : '1px dashed rgba(255,255,255,0.12)',
              borderRadius: 10,
              padding: '12px 14px',
              background: dragOver ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
              minHeight: 48,
              transition: 'border-color 150ms, background 150ms',
            }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={creating}
              style={{
                padding: '5px 12px', borderRadius: 7,
                border: '1px solid rgba(52,211,153,0.3)',
                background: 'rgba(52,211,153,0.06)',
                color: 'var(--cm-emerald)',
                fontFamily: 'var(--font-ui)', fontSize: 12,
                cursor: creating ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 150ms',
              }}
              onMouseEnter={e => { if (!creating) e.currentTarget.style.background = 'rgba(52,211,153,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.06)'; }}
            >
              + 选择 PDF
            </button>
            {pdfFiles.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
                {dragOver ? '松开以添加 PDF' : '拖入 PDF 或点击选择'}
              </span>
            )}
            {pdfFiles.map(f => (
              <span
                key={f.name}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 8px 3px 10px', borderRadius: 6,
                  background: 'rgba(52,211,153,0.08)',
                  border: '1px solid rgba(52,211,153,0.2)',
                  fontSize: 12, color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-ui)',
                  maxWidth: 200, overflow: 'hidden',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name}
                </span>
                <button
                   type="button"
                   onClick={() => removePdf(f.name)}
                   disabled={creating}
                   aria-label={`移除 ${f.name}`}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: 13, lineHeight: 1,
                    padding: 0, flexShrink: 0,
                    transition: 'color 120ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fb7185'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Research question */}
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="research-question" style={{
            display: 'block', marginBottom: 8,
            fontSize: 10, fontFamily: 'var(--font-mono)',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            研究问题（可选，有 PDF 时可留空）
          </label>
          <textarea
            ref={textareaRef}
            id="research-question"
            disabled={creating}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (!e.nativeEvent.isComposing && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleLaunch(); } }}
            placeholder={pdfFiles.length > 0 ? '可补充方向要求，也可直接留空让 AI 自行分析…' : '描述你的研究主题、假设或核心问题…'}
            rows={4}
            style={{
              ...INPUT_STYLE,
              resize: 'none',
              lineHeight: 1.7,
              fontSize: 14,
            } as React.CSSProperties}
            onFocus={e => focusStyle(e.currentTarget)}
            onBlur={e => blurStyle(e.currentTarget)}
          />
          <div style={{ marginTop: 6, fontSize: 12, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)' }}>
            Ctrl+Enter 发送
          </div>
        </div>

        {error && (
          <div role="alert" style={{
            marginBottom: 20, padding: '9px 14px',
            background: 'rgba(251,113,133,0.08)',
            border: '1px solid rgba(251,113,133,0.25)',
            borderRadius: 8,
            fontSize: 12, color: '#fb7185', fontFamily: 'var(--font-mono)',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {!inline && <button
            onClick={onClose}
            disabled={creating}
            style={{
              padding: '10px 20px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-ui)', fontSize: 13,
              cursor: creating ? 'not-allowed' : 'pointer',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => { if (!creating) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            取消
          </button>}
          <button
            onClick={handleLaunch}
            disabled={!canLaunch}
            style={{
              padding: '10px 28px', borderRadius: 10,
              border: `1px solid ${canLaunch ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)'}`,
              background: canLaunch ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
              color: canLaunch ? 'var(--cm-emerald)' : 'var(--text-muted)',
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500,
              cursor: canLaunch ? 'pointer' : 'not-allowed',
              transition: 'all 200ms',
              boxShadow: canLaunch ? '0 0 24px rgba(52,211,153,0.12)' : 'none',
            }}
          >
            {creating ? '正在处理…' : '开始研究 →'}
          </button>
        </div>
      </div>
    </div>
  );
}
