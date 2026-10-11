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
      <div className="h-full w-full bg-[#E9E5DF] p-3 sm:p-4">
        <div className="flex h-full overflow-hidden rounded-sm bg-[#FBFAF8]">
          <div className="hidden w-1/4 border-r border-[#E7E1D9] bg-[#F3F0EB] p-2 sm:block">
            <div className="h-1.5 w-2/3 rounded bg-[#34485C]/20" />
            <div className="mt-4 space-y-2">
              <div className="h-1 w-full rounded bg-[#34485C]/10" />
              <div className="h-1 w-4/5 rounded bg-[#D67A3B]/35" />
              <div className="h-1 w-5/6 rounded bg-[#34485C]/10" />
            </div>
          </div>
          <div className="flex-1 p-3 sm:p-4">
            <div className="h-2 w-2/5 rounded bg-[#34485C]/25" />
            <div className="mt-4 space-y-2">
              <div className="h-1.5 w-1/3 rounded bg-[#D67A3B]/45" />
              <DocumentLines />
            </div>
            <div className="mt-4 h-7 w-full rounded-sm border border-[#E7E1D9] bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (category === "design") {
    return (
      <div className="h-full w-full bg-[#E9E0D6] p-3 sm:p-4">
        <div className="flex h-full flex-col justify-between bg-[#FAF8F4] p-4 sm:p-5">
          <div>
            <div className="h-1.5 w-1/4 rounded bg-[#34485C]/20" />
            <div className="mt-5 font-display text-3xl font-semibold tracking-tight text-[#23364B] sm:text-4xl">Aa</div>
          </div>
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <div className="h-1.5 w-16 rounded bg-[#34485C]/15" />
              <div className="h-1.5 w-11 rounded bg-[#34485C]/10" />
            </div>
            <div className="flex gap-1.5">
              <span className="h-4 w-4 rounded-full bg-[#D67A3B]" />
              <span className="h-4 w-4 rounded-full bg-[#253A50]" />
              <span className="h-4 w-4 rounded-full bg-[#D8C9B6]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (category === "marketing") {
    return (
      <div className="h-full w-full bg-[#E9E0D6] p-3 sm:p-4">
        <div className="h-full rounded-sm bg-[#FBFAF8] p-3 sm:p-4">
          <div className="flex items-center justify-between border-b border-[#E8E1D8] pb-2">
            <div className="h-2 w-1/3 rounded bg-[#34485C]/20" />
            <div className="h-1.5 w-1/5 rounded bg-[#34485C]/10" />
          </div>
          <div className="mt-3 grid h-[calc(100%-2rem)] grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="rounded-sm border border-[#E8E1D8] bg-[#F7F4EF] p-1.5">
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
      <div className="h-full w-full bg-[#E9E0D6] p-3 sm:p-4">
        <div className="h-full bg-[#FBFAF8] p-4 sm:p-5">
          <div className="h-2 w-3/5 rounded bg-[#34485C]/25" />
          <div className="mt-2 h-1.5 w-2/5 rounded bg-[#34485C]/10" />
          <div className="mt-5">
            <DocumentLines accent />
          </div>
          <div className="mt-4 h-5 w-1/3 rounded-sm bg-[#D67A3B]/15" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#E9E0D6] p-3 sm:p-4">
      <div className="flex h-full overflow-hidden rounded-sm bg-[#FBFAF8]">
        <div className="w-1/4 border-r border-[#E8E1D8] bg-[#F3F0EB] p-2">
          <div className="h-1.5 w-4/5 rounded bg-[#34485C]/15" />
          <div className="mt-4 space-y-2">
            <div className="h-1.5 w-full rounded bg-[#D67A3B]/25" />
            <div className="h-1.5 w-4/5 rounded bg-[#34485C]/10" />
          </div>
        </div>
        <div className="flex-1 p-3 sm:p-4">
          <div className="h-2 w-1/2 rounded bg-[#34485C]/20" />
          <div className="mt-4 rounded-sm border border-[#E8E1D8] bg-white p-3">
            <div className="h-1.5 w-2/5 rounded bg-[#D67A3B]/35" />
            <div className="mt-3"><DocumentLines /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
