const labels: Record<string, string> = { development: 'Web & software', design: 'Design studio', marketing: 'Content planning', writing: 'Launch copy', ai_assisted: 'Workflow tools' };

/** An illustrative cover, never represented as the seller's actual deliverable. */
export default function GigPreview({ category, seed, title = '' }: { category: string; seed: string; title?: string }) {
  const dashboard = /dashboard|spreadsheet|automation|invoice|tracker/i.test(title);
  const mobile = /mobile|figma/i.test(title);
  const variant = [...seed].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 3;
  return (
    <div className={`concept-cover concept-variant-${variant}`} role="img" aria-label={`Illustrative concept for ${title || labels[category] || 'digital product'}; not a seller preview`}>
      <div className="concept-toolbar"><span className="concept-dots">● ● ●</span><span>{labels[category] || 'Digital product'}</span><span>↗</span></div>
      <div className="concept-workspace" aria-hidden="true">
        {dashboard ? <div className="concept-dashboard">
          <div className="concept-sidebar"><b>Overview</b><span>Activity</span><span>Reports</span><span>Settings</span></div>
          <div className="concept-dashboard-main"><b>Your work, at a glance.</b><div className="concept-stats"><span>Projects<strong>12</strong></span><span>Complete<strong>08</strong></span></div><div className="concept-chart">{[32, 49, 38, 65, 54, 78, 88].map((h,i) => <i key={i} style={{height:`${h}%`}} />)}</div></div>
        </div> : mobile ? <div className="concept-mobile"><div className="concept-phone"><small>Discover</small><b>Good finds.<br />Great work.</b><div className="concept-tiles"><i/><i/><i/><i/></div><span>Explore →</span></div><div><small>Made for smaller screens</small><h3>Less friction.<br />More finding.</h3><span className="concept-swatch" /></div></div>
        : category === 'design' ? <div className="concept-brand"><small>Brand essentials / 01</small><h3>Aa<span>↗</span></h3><div className="concept-palette"><i/><i/><i/><i/></div><p>Identity. Type. Colour.</p></div>
        : category === 'marketing' ? <div className="concept-calendar"><b>A little planning. A better launch.</b><div>{Array.from({length:14},(_,i)=><span key={i}><small>{String(i+1).padStart(2,'0')}</small>{i%3===0 && <i>{['Launch','Story','Share'][i%3]}</i>}</span>)}</div></div>
        : category === 'writing' ? <div className="concept-writing"><small>THE LAUNCH EDIT</small><h3>Find the words.<br />Make your mark.</h3><p>A clear message starts here.</p><div className="concept-rule"/><span>Headline / Story / Call to action</span></div>
        : category === 'development' ? <div className="concept-landing"><small>YOUR NEXT IDEA</small><h3>Built to get<br />you moving.</h3><span>Take a look ↗</span><div className="concept-orbit">↗</div></div>
        : <div className="concept-workflow"><small>A REPEATABLE WORKFLOW</small><h3>From a thought<br />to a first draft.</h3><div><span>01 Brief</span><b>→</b><span>02 Draft</span><b>→</b><span>03 Review</span></div></div>}
      </div>
      <div className="concept-caption">Concept mockup · Seller preview not supplied</div>
    </div>
  );
}
