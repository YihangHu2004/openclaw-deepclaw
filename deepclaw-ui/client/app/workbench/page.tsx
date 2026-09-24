'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import LobsterLogo from '@/components/LobsterLogo';
import LaunchDialog from '@/components/LaunchDialog';
import { fetchProjects, ProjectMeta } from '@/lib/api';

export default function LandingPage() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [health, setHealth] = useState<'checking' | 'available' | 'offline' | 'error'>('checking');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setProjects(await fetchProjects()); }
    catch { setError('项目暂时无法加载，已有内容不会丢失。'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!cancelled) setHealth(data.gatewayAvailable ? 'available' : 'offline');
      } catch { if (!cancelled) setHealth('error'); }
    };
    void check();
    const timer = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);
  const recent = [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  return <div className="dc-home">
    <header className="dc-home-header">
      <Link href="/" className="dc-home-brand"><LobsterLogo size={30} /><span>DeepClaw</span></Link>
      <div className="dc-home-tools">
        <span role="status" className={`dc-health dc-health-${health}`}>
          <span aria-hidden="true">●</span> {{ checking: '检查服务中', available: '网关服务可达', offline: '网关未启动', error: '服务检查失败' }[health]}
        </span>
        <Link href="/projects" className="dc-btn-ghost">项目库 →</Link>
      </div>
    </header>
    <main className="dc-home-main">
      <div className="dc-home-intro">
        <p className="dc-home-eyebrow">你的科研工作台</p>
        <h1>让问题有来路，<br />让研究有进展。</h1>
        <p>从文献到证据，从研究计划到报告。<br className="dc-desktop-break" />在同一处整理思路，接续每一步工作。</p>
      </div>
      <section className="dc-home-launch" aria-label="开始研究">
        <LaunchDialog open inline onClose={() => {}} />
        {health === 'offline' && <p className="dc-home-notice" role="status">前端已就绪。开始对话前，请启动 OpenClaw 网关。</p>}
      </section>
      <section className="dc-home-recent" aria-labelledby="recent-heading">
        <div className="dc-section-heading"><h2 id="recent-heading">接着上次的研究</h2><Link href="/projects">全部项目 →</Link></div>
        {loading ? <p role="status" className="dc-home-empty">正在读取项目…</p>
          : error ? <div role="alert" className="dc-error">{error} <button onClick={load} className="dc-btn-ghost">重试</button></div>
          : recent.length === 0 ? <div className="dc-home-empty">还没有研究项目。先写下一个问题，或添加一篇论文。</div>
          : <ul className="dc-recent-list">{recent.map(project => <li key={project.slug}>
              <Link href={`/project/${encodeURIComponent(project.slug)}`}>
                <div><h3>{project.topic || project.title || project.slug}</h3><span>{project.slug}</span></div>
                <div className="dc-recent-meta"><span>{project.status === 'unknown' ? '阶段待确认' : project.status}</span><time>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('zh-CN') : '暂无更新时间'}</time></div>
                <span className="dc-recent-arrow" aria-label="继续">↗</span>
              </Link>
            </li>)}</ul>}
      </section>
    </main>
    <footer className="dc-home-footer">DeepClaw <span>基于 OpenClaw · 本地工作空间</span></footer>
  </div>;
}
