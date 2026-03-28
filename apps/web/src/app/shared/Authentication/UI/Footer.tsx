import { META_ICONS } from "@/app/icons/MetaIcon";
import SvgIcon from "@/components/ui/SvgIcon";
import { Link } from "react-router-dom";

type FooterProps = {
  isAuthed: boolean;
};

export default function Footer({ isAuthed }: FooterProps) {
  return (
    <footer className="border-t border-slate-100 bg-[#EAF2FF] text-slate-600">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-[1.1fr_0.75fr_0.75fr_0.95fr_0.95fr]">
          <Brand isAuthed={isAuthed} />
          <Product />
          <Company />
          <OurLocation />
          <ContactSection />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>
            © {new Date().getFullYear()} Carry4Me. All rights reserved.
          </span>

          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
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
    <div>
      <Link
        to={isAuthed ? "/dashboard" : "/"}
        className="inline-flex items-center"
      >
        <img src="/logo.svg" alt="Carry4Me" className="h-12 w-auto" />
      </Link>

      <p className="mt-5 max-w-sm text-[15px] leading-8 text-slate-700">
        Send and receive items through trusted travelers. Fast, affordable, and
        community-powered.
      </p>

      <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
        Trusted connections • Smarter delivery • Community powered
      </p>
    </div>
  );
}

function Product() {
  return (
    <div>
      <h4 className="text-sm font-semibold tracking-tight text-slate-900">
        Product
      </h4>

      <ul className="mt-5 space-y-3.5 text-[15px]">
        <li>
          <a
            href="/browse/trips"
            className="transition-colors duration-200 hover:text-slate-900"
          >
            Find Travelers
          </a>
        </li>
        <li>
          <a
            href="/browse/parcels"
            className="transition-colors duration-200 hover:text-slate-900"
          >
            Send a Parcel
          </a>
        </li>
        <li>
          <a
            href="/how-it-works"
            className="transition-colors duration-200 hover:text-slate-900"
          >
            How it Works
          </a>
        </li>
      </ul>
    </div>
  );
}

function OurLocation() {
  return (
    <div>
      <h4 className="text-sm font-semibold tracking-tight text-slate-900">
        Locations
      </h4>

      <ul className="mt-5 space-y-5">
        <li>
          <span className="inline-flex items-center gap-1">
            <SvgIcon size={"md"} Icon={META_ICONS.ukFlag} />
            <p className="text-[15px] font-semibold text-slate-900">
              United Kingdom
            </p>
          </span>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            London <span className="text-[12px]">(Head Office)</span>
          </p>
        </li>

        <li>
          <span className="inline-flex items-center gap-1">
            <SvgIcon size={"md"} Icon={META_ICONS.uSFlagIcon} />
            <p className="text-[15px] font-semibold text-slate-900">
              United States
            </p>
          </span>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            New York / Atlanta
            <br />
            <span className="text-[12px]">Local Representative</span>
          </p>
        </li>
        <li>
          <span className="inline-flex items-center gap-1">
            <SvgIcon size={"md"} Icon={META_ICONS.zimFlag} />
            <p className="text-[15px] font-semibold text-slate-900">Zimbabwe</p>
          </span>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Harare / Bulawayo
            <br />
            <span className="text-[12px]">Local Representative</span>
          </p>
        </li>
      </ul>

      <p className="mt-6 text-xs font-medium text-slate-500">
        Operating across Europe, UK & USA
      </p>
    </div>
  );
}

function Company() {
  return (
    <div>
      <h4 className="text-sm font-semibold tracking-tight text-slate-900">
        Company
      </h4>

      <ul className="mt-5 space-y-3.5 text-[15px]">
        <li>
          <a
            href="/about"
            className="transition-colors duration-200 hover:text-slate-900"
          >
            About Us
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
    <div>
      <h4 className="text-sm font-semibold tracking-tight text-slate-900 pl-3">
        Contact
      </h4>

      <ul className="mt-5 space-y-4 text-[15px] text-slate-600">
        {/* Email */}
        <li className="flex items-start gap-3">
          <span className="mt-0.5">{/* Email Icon */}</span>
          <div>
            <p className="font-medium text-slate-800">Email</p>
            <a
              href="mailto:support@carry4me.com"
              className="text-slate-600 hover:text-slate-900 transition"
            >
              support@carry4me.com
            </a>
          </div>
        </li>

        {/* Phone */}
        <li className="flex items-start gap-3">
          <span className="mt-0.5">{/* Phone Icon */}</span>
          <div>
            <p className="font-medium text-slate-800">Phone</p>
            <a
              href="tel:+31612345678"
              className="text-slate-600 hover:text-slate-900 transition"
            >
              +31 6 1234 5678
            </a>
          </div>
        </li>

        {/* WhatsApp */}
        <li className="flex items-start gap-3">
          <span className="mt-0.5">{/* WhatsApp Icon */}</span>
          <div>
            <p className="font-medium text-slate-800">WhatsApp</p>
            <a
              href="https://wa.me/31612345678"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 transition"
            >
              Chat with us
            </a>
          </div>
        </li>
      </ul>
      <div className="mt-7 flex flex-wrap pl-4 gap-x-5 gap-y-3 text-sm font-medium text-slate-700">
        <a
          href="#"
          className="transition-colors duration-200 hover:text-slate-900"
        >
          <span className="inline-flex items-center gap-1">
            <SvgIcon size={"md"} Icon={META_ICONS.facebookIcon} />
            Facebook
          </span>
        </a>
        <a
          href="#"
          className="transition-colors duration-200 hover:text-slate-900"
        >
          <span className="inline-flex items-center gap-1">
            <SvgIcon size={"md"} Icon={META_ICONS.instagramIcon} />
            Instagram
          </span>
        </a>
        <a
          href="#"
          className="transition-colors duration-200 hover:text-slate-900"
        >
          <span className="inline-flex items-center gap-1">
            <SvgIcon size={"md"} Icon={META_ICONS.twitterIcon} />
            Twitter
          </span>
        </a>
      </div>
    </div>
  );
}
