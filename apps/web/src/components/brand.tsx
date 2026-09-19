import Link from "next/link";
import Image from "next/image";
import csuLogo from "../../../../csulogo.png";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`brand ${inverse ? "brand--inverse" : ""}`} href="/">
      <span className="brand__mark">
        <Image className="brand__logo" src={csuLogo} alt="Cagayan State University seal" sizes="48px" />
      </span>
      <span>
        <strong>CBEA</strong>
        <small>Lost &amp; Found</small>
      </span>
    </Link>
  );
}
