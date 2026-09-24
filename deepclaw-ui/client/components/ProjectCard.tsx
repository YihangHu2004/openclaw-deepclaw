'use client';

import { useRef, useState } from 'react';
import { ProjectMeta } from '@/lib/api';

interface Props {
  project: ProjectMeta;
  index: number;
  onClick: () => void;
  onDelete?: (slug: string) => Promise<void>;
}

export default function ProjectCard({ project, index, onClick, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const remove = async () => {
    if (!onDelete || busy.current) return;
    busy.current = true; setDeleting(true); setError('');
    try { await onDelete(project.slug); }
    catch { setError('删除未完成，请重试。'); }
    finally { busy.current = false; setDeleting(false); }
  };
  return <article className="dc-project-row">
    <button className="dc-project-open" onClick={onClick} disabled={deleting || confirming}>
      <span className="dc-project-index">{String(index + 1).padStart(2, '0')}</span>
      <span className="dc-project-copy">
        <span className="dc-project-row-title">{project.title || project.slug}</span>
        {project.topic && <span className="dc-project-row-topic">{project.topic}</span>}
        <span className="dc-project-row-tags">{project.tags.slice(0, 4).join(' · ')}</span>
      </span>
      <span className="dc-project-row-meta">
        <span>{project.status === 'unknown' ? '阶段待确认' : project.status}</span>
        <span>{project.sessionKey ? '会话已关联' : '未关联会话'}</span>
        <time>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('zh-CN') : '暂无更新时间'}</time>
      </span>
    </button>
    {onDelete && !confirming && <button className="dc-btn-ghost dc-project-delete" onClick={() => setConfirming(true)} aria-label={`删除项目 ${project.slug}`}>删除</button>}
    {confirming && <div className="dc-project-confirm">
      <span>删除「{project.slug}」及其工作区文件？此操作无法撤销。</span>
      <button className="dc-btn-ghost" onClick={() => setConfirming(false)} disabled={deleting}>取消</button>
      <button className="dc-btn-ghost" onClick={remove} disabled={deleting}>{deleting ? '删除中…' : '确认删除'}</button>
    </div>}
    {error && <p role="alert" className="dc-error">{error}</p>}
  </article>;
}
