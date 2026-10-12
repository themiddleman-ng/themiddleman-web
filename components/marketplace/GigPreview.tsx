const lineWidths = ["w-11/12", "w-4/5", "w-10/12", "w-3/4", "w-9/12", "w-2/3"];

function DocumentLines({ accent = false }: { accent?: boolean }) {
  return (
    <div className="space-y-2">
      {lineWidths.map((width, index) => (
        <div
          key={index}
          className={`h-1.5 rounded-sm ${index === 0 && accent ? "bg-[#D67A3B]/45" : "bg-[#34485C]/10"} ${width}`}
        />
      ))}
    </div>
  );
}

export default function GigPreview({ category }: { category: string; seed: string }) {
  if (category === "development") {
    return (
      <div className="h-full w-full bg-[#e3edf4] p-3 sm:p-4">
        <div className="flex h-full overflow-hidden rounded-sm bg-[#f9fbfc]">
          <div className="hidden w-1/4 border-r border-[#d5e2e8] bg-[#edf3f7] p-2 sm:block">
            <div className="h-1.5 w-2/3 rounded bg-[#3c5367]/20" />
            <div className="mt-4 space-y-2">
              <div className="h-1 w-full rounded bg-[#3c5367]/10" />
              <div className="h-1 w-4/5 rounded bg-[#547fa5]/35" />
              <div className="h-1 w-5/6 rounded bg-[#3c5367]/10" />
            </div>
          </div>
          <div className="flex-1 p-3 sm:p-4">
            <div className="h-2 w-2/5 rounded bg-[#3c5367]/25" />
            <div className="mt-4 space-y-2">
              <div className="h-1.5 w-1/3 rounded bg-[#547fa5]/45" />
              <DocumentLines />
            </div>
            <div className="mt-4 h-7 w-full rounded-sm border border-[#d5e2e8] bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (category === "design") {
    return (
      <div className="h-full w-full bg-[#ece7f3] p-3 sm:p-4">
        <div className="flex h-full flex-col justify-between bg-[#fbf9fd] p-4 sm:p-5">
          <div>
            <div className="h-1.5 w-1/4 rounded bg-[#514469]/20" />
            <div className="mt-5 font-display text-3xl font-semibold tracking-tight text-[#23364B] sm:text-4xl">Aa</div>
          </div>
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <div className="h-1.5 w-16 rounded bg-[#514469]/15" />
              <div className="h-1.5 w-11 rounded bg-[#514469]/10" />
            </div>
            <div className="flex gap-1.5">
              <span className="h-4 w-4 rounded-full bg-[#896bab]" />
              <span className="h-4 w-4 rounded-full bg-[#514469]" />
              <span className="h-4 w-4 rounded-full bg-[#b9a7d3]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (category === "marketing") {
    return (
      <div className="h-full w-full bg-[#f8e7dd] p-3 sm:p-4">
        <div className="h-full rounded-sm bg-[#fffaf7] p-3 sm:p-4">
          <div className="flex items-center justify-between border-b border-[#f0d9ca] pb-2">
            <div className="h-2 w-1/3 rounded bg-[#34485C]/20" />
            <div className="h-1.5 w-1/5 rounded bg-[#34485C]/10" />
          </div>
          <div className="mt-3 grid h-[calc(100%-2rem)] grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="rounded-sm border border-[#f0d9ca] bg-[#fcf0e7] p-1.5">
                <div className="h-1 w-1/2 rounded bg-[#34485C]/10" />
                {index % 3 === 0 && <div className="mt-1.5 h-3 rounded-sm bg-[#D67A3B]/20" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (category === "writing") {
    return (
      <div className="h-full w-full bg-[#e3f0eb] p-3 sm:p-4">
        <div className="h-full bg-[#f9fcfa] p-4 sm:p-5">
          <div className="h-2 w-3/5 rounded bg-[#31584f]/25" />
          <div className="mt-2 h-1.5 w-2/5 rounded bg-[#31584f]/10" />
          <div className="mt-5">
            <DocumentLines accent />
          </div>
          <div className="mt-4 h-5 w-1/3 rounded-sm bg-[#D67A3B]/15" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#e4eafa] p-3 sm:p-4">
      <div className="flex h-full overflow-hidden rounded-sm bg-[#f9faff]">
        <div className="w-1/4 border-r border-[#dce4f1] bg-[#eef2f8] p-2">
          <div className="h-1.5 w-4/5 rounded bg-[#34485C]/15" />
          <div className="mt-4 space-y-2">
            <div className="h-1.5 w-full rounded bg-[#D67A3B]/25" />
            <div className="h-1.5 w-4/5 rounded bg-[#34485C]/10" />
          </div>
        </div>
        <div className="flex-1 p-3 sm:p-4">
          <div className="h-2 w-1/2 rounded bg-[#34485C]/20" />
          <div className="mt-4 rounded-sm border border-[#dce4f1] bg-white p-3">
            <div className="h-1.5 w-2/5 rounded bg-[#D67A3B]/35" />
            <div className="mt-3"><DocumentLines /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
