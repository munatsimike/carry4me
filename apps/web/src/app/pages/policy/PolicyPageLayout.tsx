import { cn } from "@/app/lib/cn";
import CustomText from "@/components/ui/CustomText";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { PolicyPageContent } from "./types";

type PolicyPageLayoutProps = PolicyPageContent;

function SectionBody({
  paragraphs,
  bullets,
}: {
  paragraphs?: string[];
  bullets?: string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {paragraphs?.map((paragraph) => (
        <CustomText
          key={paragraph}
          as="p"
          textSize="sm"
          textVariant="secondary"
          className="leading-relaxed"
        >
          {paragraph}
        </CustomText>
      ))}
      {bullets && bullets.length > 0 ? (
        <ul className="list-disc space-y-2 pl-5">
          {bullets.map((item) => (
            <li key={item}>
              <CustomText
                as="span"
                textSize="sm"
                textVariant="secondary"
                className="leading-relaxed"
              >
                {item}
              </CustomText>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MobileSectionAccordion({
  sections,
}: {
  sections: PolicyPageContent["sections"];
}) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {sections.map((section) => {
        const isOpen = openId === section.id;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => setOpenId(isOpen ? null : section.id)}
            aria-expanded={isOpen}
            className={cn(
              "rounded-2xl border bg-white p-4 text-left shadow-sm transition-all",
              isOpen
                ? "border-primary-200 shadow-md"
                : "border-slate-200 hover:border-primary-200",
            )}
          >
            <span className="flex items-start justify-between gap-3">
              <CustomText
                as="h2"
                textVariant="primary"
                textSize="md"
                className="font-medium"
              >
                {section.title}
              </CustomText>
              <ChevronDown
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0 text-slate-500 transition-transform",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
            </span>
            <div
              className={cn(
                "grid transition-all duration-300",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="pt-3">
                  <SectionBody
                    paragraphs={section.paragraphs}
                    bullets={section.bullets}
                  />
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DesktopSections({
  sections,
}: {
  sections: PolicyPageContent["sections"];
}) {
  return (
    <div className="hidden flex-col gap-10 md:flex">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <CustomText
            as="h2"
            textVariant="primary"
            textSize="lg"
            className="mb-3 font-semibold"
          >
            {section.title}
          </CustomText>
          <SectionBody paragraphs={section.paragraphs} bullets={section.bullets} />
        </section>
      ))}
    </div>
  );
}

export default function PolicyPageLayout({
  title,
  description,
  lastUpdated,
  sections,
}: PolicyPageLayoutProps) {
  return (
    <DefaultContainer outerClassName="py-6 sm:py-10">
      <article className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-col gap-3 border-b border-neutral-200 pb-6">
          <CustomText as="h1" textVariant="primary" textSize="xxl" className="font-semibold">
            {title}
          </CustomText>
          <CustomText as="p" textSize="md" textVariant="secondary" className="leading-relaxed">
            {description}
          </CustomText>
          <CustomText as="p" textSize="xs" textVariant="label">
            Last updated: {lastUpdated}
          </CustomText>
        </header>

        <MobileSectionAccordion sections={sections} />
        <DesktopSections sections={sections} />
      </article>
    </DefaultContainer>
  );
}
