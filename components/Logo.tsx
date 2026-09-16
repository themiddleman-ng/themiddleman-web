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
  markClass = "h-6 w-6",
  textClass = "text-lg",
  variant = "responsive",
}: {
  href?: string;
  className?: string;
  markClass?: string;
  textClass?: string;
  variant?: LogoVariant;
}) {
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
