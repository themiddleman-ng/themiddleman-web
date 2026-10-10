import Link from "next/link";
import Image from "next/image";

type LogoVariant = "responsive" | "horizontal" | "vertical" | "symbol" | "dark" | "mono";

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
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
}: {
  href?: string;
  className?: string;
  markClass?: string;
  textClass?: string;
  variant?: LogoVariant;
}) {
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
          className={`${markClass} shrink-0 object-contain`}
        />
        <span className={`font-display font-extrabold tracking-[-.045em] text-[#172B45] ${textClass}`}>
          The <span className="text-[#0B3D91]">Middleman</span>
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
        className="h-auto w-24 object-contain sm:w-28 md:w-32"
      />
    </Link>
  );
}
