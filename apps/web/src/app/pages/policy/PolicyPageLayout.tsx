import { cn } from "@/app/lib/cn";
import CustomText from "@/components/ui/CustomText";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { PolicyPageContent } from "./types";

type PolicyPageLayoutProps = PolicyPageContent;

const DESKTOP_MASK_RIGHT =
  "linear-gradient(to left, black 0%, black 55%, rgba(0, 0, 0, 0.55) 78%, transparent 100%)";

const DESKTOP_MASK_MUTED =
  "linear-gradient(to left, black 0%, black 28%, rgba(0, 0, 0, 0.35) 52%, rgba(0, 0, 0, 0.1) 72%, transparent 88%)";

const MOBILE_MASK =
  "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.35) 10%, black 22%)";

const MOBILE_MASK_MUTED =
  "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.2) 18%, black 40%)";

const WHITE_WASH_DESKTOP_RIGHT =
  "linear-gradient(to left, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.15) 100%)";

const WHITE_WASH_MOBILE =
  "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 100%)";

const WHITE_WASH_DESKTOP_MUTED =
  "linear-gradient(to left, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.7) 55%, rgba(255,255,255,0.92) 78%, rgba(255,255,255,1) 100%)";

const WHITE_WASH_MOBILE_MUTED =
  "linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.75) 55%, rgba(255,255,255,0.9) 100%)";

const dissolveIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: {
    duration: 1.8,
    delay: 0.15,
    ease: [0.22, 1, 0.36, 1] as const,
  },
};

const dissolveBreathe = {
  animate: { opacity: [0.85, 1, 0.85] },
  transition: {
    duration: 7,
    ease: "easeInOut" as const,
    repeat: Infinity,
    repeatType: "mirror" as const,
  },
};

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

function PolicyWatermark({ src }: { src: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 flex items-start justify-center overflow-hidden"
    >
      <img
        src={src}
        alt=""
        className="mt-2 h-[min(110vw,48rem)] w-[min(110vw,48rem)] object-contain opacity-[0.08] grayscale sm:mt-0 sm:h-[56rem] sm:w-[56rem] sm:opacity-[0.07]"
      />
    </div>
  );
}

export default function PolicyPageLayout({
  title,
  description,
  lastUpdated,
  sections,
  imageSrc,
  imageMuted,
  watermarkSrc,
}: PolicyPageLayoutProps) {
  const imageTone = imageMuted
    ? "ml-auto h-[68%] w-[68%] opacity-30 grayscale brightness-[1.08] contrast-[0.82]"
    : "h-full w-full brightness-[0.98] contrast-[0.96] saturate-[0.92]";
  const mobileImageTone = imageMuted
    ? "mx-auto h-auto w-[68%] opacity-30 grayscale brightness-[1.08] contrast-[0.82]"
    : "h-auto w-full brightness-[0.98] contrast-[0.96] saturate-[0.92]";
  const desktopWash = imageMuted ? WHITE_WASH_DESKTOP_MUTED : WHITE_WASH_DESKTOP_RIGHT;
  const mobileWash = imageMuted ? WHITE_WASH_MOBILE_MUTED : WHITE_WASH_MOBILE;
  const desktopMask = imageMuted ? DESKTOP_MASK_MUTED : DESKTOP_MASK_RIGHT;
  const mobileMask = imageMuted ? MOBILE_MASK_MUTED : MOBILE_MASK;

  return (
    <div className="relative overflow-hidden bg-white">
      {imageSrc ? (
        <motion.div
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-0 right-0 hidden h-full min-h-[28rem] w-[48%] overflow-hidden lg:block",
            imageMuted && "flex items-start justify-end",
          )}
          style={{
            WebkitMaskImage: desktopMask,
            maskImage: desktopMask,
          }}
          {...dissolveIn}
        >
          <motion.img
            src={imageSrc}
            alt=""
            className={cn(
              "object-contain object-right-top",
              imageTone,
            )}
            {...dissolveBreathe}
          />
          <div
            className="absolute inset-0"
            style={{ background: desktopWash }}
          />
        </motion.div>
      ) : null}

      <DefaultContainer outerClassName="relative z-10 py-6 sm:py-10">
        <article className="relative mx-auto max-w-3xl">
          {watermarkSrc ? <PolicyWatermark src={watermarkSrc} /> : null}

          <header className="relative z-10 mb-8 flex flex-col gap-3 border-b border-neutral-200 pb-6">
            <CustomText as="h1" textVariant="primary" textSize="xxl" className="font-semibold">
              {title}
            </CustomText>
            <CustomText as="p" textSize="md" textVariant="secondary" className="leading-relaxed">
              {description}
            </CustomText>
            {lastUpdated ? (
              <CustomText as="p" textSize="xs" textVariant="label">
                Last updated: {lastUpdated}
              </CustomText>
            ) : null}

            {imageSrc ? (
              <motion.div
                aria-hidden
                className="relative mt-2 w-full overflow-hidden lg:hidden"
                style={{
                  WebkitMaskImage: mobileMask,
                  maskImage: mobileMask,
                }}
                {...dissolveIn}
              >
                <motion.img
                  src={imageSrc}
                  alt=""
                  className={cn("object-contain object-top", mobileImageTone)}
                  {...dissolveBreathe}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: mobileWash }}
                />
              </motion.div>
            ) : null}
          </header>

          <div className="relative z-10">
            <MobileSectionAccordion sections={sections} />
            <DesktopSections sections={sections} />
          </div>
        </article>
      </DefaultContainer>
    </div>
  );
}
