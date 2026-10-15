import { notFound } from 'next/navigation';
const routes = ['/signup?mode=signin', '/signup?mode=signup', '/marketplace', '/browse', '/onboarding/role', '/legal/terms', '/orders', '/messages', '/analytics', '/profile', '/settings', '/admin'];
export default async function DesignReview({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { page } = await searchParams;
  const source = routes.includes(page || '') ? page! : routes[0];
  return <main style={{ padding:24, background:'#eaf0f6', minHeight:'100vh', color:'#11172b' }}>
    <h1 style={{fontSize:20,fontWeight:700}}>Responsive design review · development only</h1>
    <nav style={{display:'flex',flexWrap:'wrap',gap:14,margin:'16px 0'}}>{routes.map((route) => <a key={route} href={`?page=${encodeURIComponent(route)}`} style={{fontSize:12,textDecoration:'underline'}}>{route}</a>)}</nav>
    <div style={{display:'flex',alignItems:'start',gap:24,flexWrap:'wrap'}}>
      <section><h2>Desktop · 1440 × 1024</h2><div style={{width:720,height:512,overflow:'hidden',marginTop:10}}><iframe title="Desktop design" src={source} width="1440" height="1024" style={{border:0,transform:'scale(.5)',transformOrigin:'top left',background:'#fff'}} /></div></section>
      <section><h2>Mobile · 390 × 844</h2><iframe title="Mobile design" src={source} width="390" height="844" style={{border:0,marginTop:10,background:'#fff'}} /></section>
    </div>
  </main>;
}
