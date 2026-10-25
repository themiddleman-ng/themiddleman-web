import Link from "next/link";
import Image from "next/image";

type LogoVariant = "responsive" | "horizontal" | "vertical" | "symbol" | "dark" | "mono";

function Wordmark({ onPanel = false, textClass = "text-[15px]" }: { onPanel?: boolean; textClass?: string }) {
  if (onPanel) {
    return (
      <span className={`mm-logo-on-orange-text font-display font-extrabold tracking-[-.045em] ${textClass}`}>
        The Middleman
      </span>
    );
  }
  return (
    <span className={`font-display font-extrabold tracking-[-.045em] text-bone ${textClass}`}>
      The <span className="text-logo-blue">Middle</span><span className="text-logo-orange">man</span>
    </span>
  );
}

function PanelMark({ className = "h-8 w-8" }: { className?: string }) {
  return <span aria-hidden="true" className={`mm-logo-on-orange ${className} shrink-0`} />;
}

export function LogoMark({ className = "h-7 w-7" }: { className?: string; inverted?: boolean }) {
  return (
    <Image
      src="/brand/middleman-approved-master.png"
      alt="The Middleman"
      width={1254}
      height={1254}
      className={`${className} object-contain`}
    />
  );
}

export default function Logo({
  href = "/",
  className = "",
  markClass = "h-8 w-8",
  textClass = "text-[15px]",
  variant = "responsive",
  onPanel = false,
}: {
  href?: string;
  className?: string;
  markClass?: string;
  textClass?: string;
  variant?: LogoVariant;
  inverted?: boolean;
  onPanel?: boolean;
}) {
  if (variant === "horizontal") {
    return (
      <Link href={href} aria-label="The Middleman homepage" className={`inline-flex min-h-11 items-center gap-2.5 ${className}`}>
        {onPanel ? (
          <PanelMark className={markClass} />
        ) : (
          <Image
            src="/brand/middleman-approved-master.png"
            alt=""
            aria-hidden="true"
            width={1254}
            height={1254}
            priority
            className={`${markClass} shrink-0 object-contain`}
          />
        )}
        <Wordmark onPanel={onPanel} textClass={textClass} />
      </Link>
    );
  }

  return (
    <Link href={href} aria-label="The Middleman homepage" className={`inline-flex min-h-11 items-center ${className}`}>
      <Image
        src="/brand/middleman-approved-master.png"
        alt=""
        aria-hidden="true"
        width={1254}
        height={1254}
        className={`h-auto w-24 object-contain sm:w-28 md:w-32`}
      />
      <span className="sr-only">The Middleman</span>
    </Link>
  );
}
