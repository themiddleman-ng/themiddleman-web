function hash(seed: string): number {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) value += seed.charCodeAt(index);
  return value;
}

export default function GigPreview({ category, seed }: { category: string; seed: string }) {
  const variant = hash(seed) % 3;

  if (category === "development") {
    return <div className="h-full w-full bg-[#14181D] p-4 sm:p-5"><div className="flex h-full flex-col overflow-hidden rounded-md border border-white/10 bg-white shadow-sm"><div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-3 py-2"><span className="h-2 w-2 rounded-full bg-red-400/60" /><span className="h-2 w-2 rounded-full bg-yellow-400/60" /><span className="h-2 w-2 rounded-full bg-green-400/60" /><span className="ml-2 h-1.5 w-24 rounded bg-gray-200" /></div><div className="space-y-2 p-3"><div className="h-2 w-1/2 rounded bg-gray-800" /><div className="h-1.5 w-3/4 rounded bg-gray-300" /><div className="h-1.5 w-2/3 rounded bg-gray-300" /><div className="mt-3 h-6 w-20 rounded bg-[#F26419]/80" /></div></div></div>;
  }
  if (category === "design") {
    return <div className="relative h-full w-full bg-[#EFE7DB] p-4 sm:p-5"><div className="relative flex h-full w-full flex-col gap-2 overflow-hidden rounded-md bg-white p-3 shadow-sm"><div className="flex gap-2"><div className="h-8 w-8 rounded-full bg-[#F26419]" /><div className="flex-1 space-y-1.5 pt-1"><div className="h-2 w-1/2 rounded bg-gray-800" /><div className="h-1.5 w-3/4 rounded bg-gray-300" /></div></div><div className="flex flex-1 items-center justify-center rounded bg-gray-50"><span className="font-display text-2xl font-bold text-gray-800">Aa</span></div><div className="flex gap-1"><div className="h-3 w-3 rounded-full bg-gray-800" /><div className="h-3 w-3 rounded-full bg-[#F26419]" /><div className="h-3 w-3 rounded-full bg-gray-300" /></div></div></div>;
  }
  if (category === "marketing") {
    return <div className="h-full w-full bg-[#191D24] p-4 sm:p-5"><div className="flex h-full flex-col justify-between rounded-md border border-white/10 bg-[#11141A] p-3 shadow-sm"><div className="flex items-center justify-between"><span className="h-1.5 w-14 rounded bg-white/15" /><span className="rounded-full bg-[#F26419]/15 px-2 py-0.5 text-[8px] font-semibold tracking-wider text-[#F26419]">+24%</span></div><div className="flex h-12 items-end gap-1"><div className="flex-1 rounded-sm bg-white/10" style={{ height: "40%" }} /><div className="flex-1 rounded-sm bg-white/10" style={{ height: "65%" }} /><div className="flex-1 rounded-sm bg-[#F26419]/80" style={{ height: "90%" }} /><div className="flex-1 rounded-sm bg-white/10" style={{ height: "50%" }} /></div><div className="mt-2 flex gap-2"><div className="h-4 flex-1 rounded bg-white/5" /><div className="h-4 flex-1 rounded bg-white/5" /></div></div></div>;
  }
  if (category === "writing") {
    const widths = [95, 88, 92, 78, 85, 60];
    return <div className="relative h-full w-full bg-[#E7DFD2] p-4 sm:p-5"><div className="relative flex h-full w-full flex-col overflow-hidden rounded-md bg-white p-4 shadow-sm"><div className="mb-2 h-2.5 w-3/5 rounded-sm bg-gray-800" /><div className="mb-3 h-1.5 w-2/5 rounded-sm bg-gray-400" /><div className="flex-1 space-y-1.5">{widths.map((width) => <div key={width} className="h-1.5 rounded-sm bg-gray-200" style={{ width: `${width}%` }} />)}</div><div className="mt-2 h-1.5 w-1/4 rounded-sm bg-[#F26419]/60" /></div></div>;
  }
  return <div className="relative h-full w-full bg-[#101318] p-4 sm:p-5"><div className="relative flex h-full w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-[#0C0F13] shadow-sm"><div className="flex h-8 w-8 items-center justify-center rounded border border-white/20 bg-white/5"><div className="h-2 w-2 rounded-full bg-white/40" /></div><div className="h-px w-4 bg-[#F26419]/50" /><div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F26419] bg-[#F26419]/10"><span className="text-[8px] font-bold text-[#F26419]">AI</span></div><div className="h-px w-4 bg-[#F26419]/50" /><div className="flex h-8 w-8 items-center justify-center rounded border border-white/20 bg-white/5"><div className="h-3 w-3 rounded-sm bg-[#F26419]/60" /></div></div></div>;
}