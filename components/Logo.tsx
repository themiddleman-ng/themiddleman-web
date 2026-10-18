import Link from "next/link";
import Image from "next/image";

type LogoVariant = "responsive" | "horizontal" | "vertical" | "symbol" | "dark" | "mono";

export function LogoMark({ className = "h-7 w-7", inverted = true }: { className?: string; inverted?: boolean }) {
  return (
    <Image
      src="/brand/middleman-approved-master.png"
      alt="The Middleman"
      width={1254}
      height={1254}
      className={`${className} object-contain ${inverted ? "brightness-0 invert" : ""}`}
    />
  );
}

export default function Logo({
  href = "/",
  className = "",
  markClass = "h-8 w-8",
  textClass = "text-[15px]",
  variant = "responsive",
  inverted = true,
}: {
  href?: string;
  className?: string;
  markClass?: string;
  textClass?: string;
  variant?: LogoVariant;
  inverted?: boolean;
}) {
  const invertClass = inverted ? "brightness-0 invert" : "";
  if (variant === "horizontal") {
    return (
      <Link href={href} aria-label="The Middleman homepage" className={`inline-flex items-center gap-2.5 ${className}`}>
        <Image
          src="/brand/middleman-approved-master.png"
          alt=""
          aria-hidden="true"
          width={1254}
          height={1254}
          priority
          className={`${markClass} shrink-0 object-contain ${invertClass}`}
        />
        <span className={`font-display font-extrabold tracking-[-.045em] ${inverted ? "text-white" : "text-bone"} ${textClass}`}>
          The <span className={inverted ? "text-white" : "text-bone"}>Middleman</span>
        </span>
      </Link>
    );
  }

  return (
    <Link href={href} aria-label="The Middleman homepage" className={`flex items-center ${className}`}>
      <Image
        src="/brand/middleman-approved-master.png"
        alt="The Middleman"
        width={1254}
        height={1254}
        className={`h-auto w-24 object-contain sm:w-28 md:w-32 ${invertClass}`}
      />
    </Link>
  );
}
