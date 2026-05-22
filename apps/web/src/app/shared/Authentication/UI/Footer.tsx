import { META_ICONS } from "@/app/icons/MetaIcon";
import { cn } from "@/app/lib/cn";
import SvgIcon from "@/components/ui/SvgIcon";
import { Link } from "react-router-dom";

type FooterProps = {
  isAuthed: boolean;
};

export default function Footer({ isAuthed }: FooterProps) {
  return (
    <footer className="border-t border-slate-100 bg-[#EAF2FF] text-slate-600">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-9 xl:grid-cols-[1.15fr_0.7fr_0.7fr_0.95fr_0.95fr] xl:items-start xl:gap-x-8">
          <Brand isAuthed={isAuthed} />
          <Product />
          <Company />
          <OurLocation />
          <ContactSection />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>
            © {new Date().getFullYear()} Carry4Me. All rights reserved.
          </span>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href="/privacy"
              className="transition-colors duration-200 hover:text-slate-900"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="transition-colors duration-200 hover:text-slate-900"
            >
              Terms of Service
            </a>
            <a
              href="/safety"
              className="transition-colors duration-200 hover:text-slate-900"
            >
              Safety Guidelines
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Brand({ isAuthed }: { isAuthed: boolean }) {
  return (
    <div className="max-w-sm">
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
    <div className="space-y-3">
      <h4 className="text-sm font-semibold tracking-tight text-slate-900">
        Product
      </h4>

      <ul className="space-y-2 text-sm leading-6">
        <li>
          <a
            href="/browse/trips"
            className="transition-colors duration-200 hover:text-slate-900"
          >
            Find travelers
          </a>
        </li>
        <li>
          <a
            href="/browse/parcels"
            className="transition-colors duration-200 hover:text-slate-900"
          >
            Send a parcel
          </a>
        </li>
        <li>
          <a
            href="/how-it-works"
            className="transition-colors duration-200 hover:text-slate-900"
          >
            How it works
          </a>
        </li>
      </ul>
    </div>
  );
}

function OurLocation() {
  return (
    <div className="space-y-3">
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
            London <span className="text-[12px]">(Head office)</span>
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
        Operating across Europe, the UK, and the USA.
      </p>
    </div>
  );
}

function Company() {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold tracking-tight text-slate-900">
        Company
      </h4>

      <ul className="space-y-2 text-sm leading-6">
        <li>
          <a
            href="/about"
            className="transition-colors duration-200 hover:text-slate-900"
          >
            About us
          </a>
        </li>
        <li>
          <a
            href="/contact"
            className="transition-colors duration-200 hover:text-slate-900"
          >
            Contact
          </a>
        </li>
        <li>
          <a
            href="/faq"
            className="transition-colors duration-200 hover:text-slate-900"
          >
            FAQ
          </a>
        </li>
      </ul>
    </div>
  );
}

function ContactSection() {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold tracking-tight text-slate-900">
        Contact
      </h4>

      <ul className="space-y-2.5 text-sm text-slate-600">
        {/* Email */}
        <li>
          <div>
            <p className="font-semibold text-slate-800">Email</p>
            <a
              href="mailto:support@carry4me.com"
              className="text-slate-600 transition hover:text-slate-900"
            >
              info@carry4me.Uk
            </a>
          </div>
        </li>

        {/* Phone */}
        <li>
          <div>
            <p className="font-semibold text-slate-800">Phone</p>
            <a
              href="tel:+31612345678"
              className="text-slate-600 transition hover:text-slate-900"
            >
              +31 622528250
            </a>
          </div>
        </li>

        {/* WhatsApp */}
        <li>
          <div>
            <p className="font-semibold text-slate-800">WhatsApp</p>
            <a
              href="https://wa.me/31622528250"
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
          href="#"
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
