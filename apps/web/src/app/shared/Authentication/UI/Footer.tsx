import { META_ICONS } from "@/app/icons/MetaIcon";
import { cn } from "@/app/lib/cn";
import SvgIcon from "@/components/ui/SvgIcon";
import { Link, useLocation } from "react-router-dom";
import {
  footerCompanyLinks,
  footerLegalLinks,
  footerProductLinks,
  footerSupportLinks,
} from "./footerLinks";

/** Wider than main content (`max-w-container` 1200px) so all footer columns fit comfortably. */
const footerMaxWidthClass = "max-w-[1440px]";

type FooterProps = {
  isAuthed: boolean;
};

const footerLinkClass =
  "transition-colors duration-200 hover:text-slate-900";

export default function Footer({ isAuthed }: FooterProps) {
  return (
    <footer className="border-t border-slate-100 bg-[#EAF2FF] text-slate-600">
      <div
        className={cn(
          "mx-auto w-full px-5 py-10 sm:px-6 sm:py-12 lg:px-8",
          footerMaxWidthClass,
        )}
      >
        <div
          className={cn(
            "grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-9",
            "xl:grid-cols-[1.15fr_0.7fr_0.7fr_0.7fr_0.7fr_0.95fr_0.95fr] xl:items-start xl:gap-x-8",
          )}
        >
          <Brand isAuthed={isAuthed} />
          <Product />
          <FooterLinkGroup title="Company" links={footerCompanyLinks} />
          <FooterLinkGroup title="Legal" links={footerLegalLinks} />
          <FooterLinkGroup title="Support" links={footerSupportLinks} />
          <OurLocation />
          <ContactSection />
        </div>
      </div>

      <div className="border-t border-white/80">
        <div
          className={cn(
            "mx-auto flex w-full flex-col gap-3 px-5 py-4 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8",
            footerMaxWidthClass,
          )}
        >
          <span>
            © {new Date().getFullYear()} Carry4Me. All rights reserved.
          </span>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {footerLegalLinks.map((link) => (
              <Link key={link.to} to={link.to} className={footerLinkClass}>
                {link.label}
              </Link>
            ))}
            <Link to="/safety" className={footerLinkClass}>
              Safety Center
            </Link>
            <Link to="/help" className={footerLinkClass}>
              Help Center
            </Link>
            <Link to="/pricing" className={footerLinkClass}>
              Pricing
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkGroup({
  title,
  links,
  scrollToTopOnSelect = false,
}: {
  title: string;
  links: readonly { to: string; label: string }[];
  scrollToTopOnSelect?: boolean;
}) {
  const location = useLocation();

  return (
    <div className="min-w-0 space-y-3">
      <h4 className="text-sm font-semibold tracking-tight text-slate-900">
        {title}
      </h4>
      <ul className="space-y-2 text-sm leading-6">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={footerLinkClass}
              onClick={() => {
                if (
                  scrollToTopOnSelect &&
                  (link.to === "/travelers" || link.to === "/parcels") &&
                  location.pathname === link.to
                ) {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Brand({ isAuthed }: { isAuthed: boolean }) {
  return (
    <div className="max-w-sm min-w-0">
      <Link
        to={isAuthed ? "/dashboard" : "/"}
        className="inline-flex items-center"
      >
        <img src="/logo.svg" alt="Carry4Me" className="h-10 w-auto sm:h-11" />
      </Link>

      <p className={cn("mt-3 text-sm leading-6 text-slate-700")}>
        Send and receive items through trusted travelers. Fast, affordable, and
        community-powered.
      </p>

      <p
        className={cn(
          "mt-3 text-[11px] font-medium uppercase leading-5 tracking-[0.16em] text-slate-500",
        )}
      >
        Trusted connections • Smarter delivery • Community-powered
      </p>
    </div>
  );
}

function Product() {
  return (
    <FooterLinkGroup title="Product" links={footerProductLinks} scrollToTopOnSelect />
  );
}

function OurLocation() {
  return (
    <div className="min-w-0 space-y-3">
      <h4 className="text-sm font-semibold tracking-tight text-slate-900">
        Locations
      </h4>

      <ul className="space-y-3.5">
        <li>
          <span className="inline-flex items-center gap-1.5">
            <SvgIcon size={"sm"} Icon={META_ICONS.ukFlag} />
            <p className="text-sm font-semibold text-slate-900">
              United Kingdom
            </p>
          </span>

          <p className="mt-0.5 text-sm leading-5 text-slate-500">
            84 Victoria Road, Surbiton, London
            <br />
            <span className="text-[12px]">(Head office)</span>
          </p>
        </li>

        <li>
          <span className="inline-flex items-center gap-1.5">
            <SvgIcon size={"sm"} Icon={META_ICONS.uSFlagIcon} />
            <p className="text-sm font-semibold text-slate-900">
              United States
            </p>
          </span>

          <p className="mt-0.5 text-sm leading-5 text-slate-500">
            New York / Atlanta
            <br />
            <span className="text-[12px]">Local representative</span>
          </p>
        </li>
        <li>
          <span className="inline-flex items-center gap-1.5">
            <SvgIcon size={"sm"} Icon={META_ICONS.zimFlag} />
            <p className="text-sm font-semibold text-slate-900">Zimbabwe</p>
          </span>
          <p className="mt-0.5 text-sm leading-5 text-slate-500">
            Harare / Bulawayo
            <br />
            <span className="text-[12px]">Local representative</span>
          </p>
        </li>
      </ul>

      <p className="text-xs font-medium leading-5 text-slate-500">
        Operating across Europe, USA and Africa.
      </p>
    </div>
  );
}

function ContactSection() {
  return (
    <div className="min-w-0 space-y-3">
      <h4 className="text-sm font-semibold tracking-tight text-slate-900">
        Contact
      </h4>

      <ul className="space-y-2.5 text-sm text-slate-600">
        <li>
          <div>
            <p className="font-semibold text-slate-800">Email</p>
            <a
              href="mailto:info@carry4me.uk"
              className="text-slate-600 transition hover:text-slate-900"
            >
              info@carry4me.uk
            </a>
          </div>
        </li>

        <li>
          <div>
            <p className="font-semibold text-slate-800">Phone</p>
            <a
              href="tel:+44 7471366706"
              className="text-slate-600 transition hover:text-slate-900"
            >
              +44 7471366706
            </a>
          </div>
        </li>

        <li>
          <div>
            <p className="font-semibold text-slate-800">WhatsApp</p>
            <a
              href="https://wa.me/447471366706"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 transition hover:text-slate-900"
            >
              Chat with us
            </a>
          </div>
        </li>
      </ul>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-slate-700">
        <a
          href="https://www.facebook.com/carry4me"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors duration-200 hover:text-slate-900"
        >
          <span className="inline-flex items-center gap-1.5">
            <SvgIcon size={"sm"} Icon={META_ICONS.facebookIcon} />
            Facebook
          </span>
        </a>
        <a
          href="#"
          className="transition-colors duration-200 hover:text-slate-900"
        >
          <span className="inline-flex items-center gap-1.5">
            <SvgIcon size={"sm"} Icon={META_ICONS.instagramIcon} />
            Instagram
          </span>
        </a>
        <a
          href="#"
          className="transition-colors duration-200 hover:text-slate-900"
        >
          <span className="inline-flex items-center gap-1.5">
            <SvgIcon size={"sm"} Icon={META_ICONS.twitterIcon} />
            Twitter
          </span>
        </a>
      </div>
    </div>
  );
}
