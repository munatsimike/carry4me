import DefaultContainer from "@/components/ui/DefualtContianer";
import type { InfoItemsProps } from "@/types/Ui";
import SectionTitle from "../SectionTitle";
import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";

const safetyIconColors = [
  "text-primary-600",
  "text-rose-600",
  "text-emerald-600",
  "text-violet-600",
];

export default function TrustAndSafety({ items }: InfoItemsProps) {
  const variant = "primary";

  return (
    <DefaultContainer className="flex flex-col py-8 sm:py-10">
      <SectionTitle title="Trust and Safety" />

      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-10">
        <div className="flex flex-col gap-3">
          <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            Safety first
          </span>
          <CustomText
            as="h3"
            textVariant="primary"
            textSize="xl"
            className="font-medium"
          >
            Simple rules before every handover
          </CustomText>
          <CustomText as="p" textSize="sm" className="max-w-md leading-relaxed">
            Clear expectations help senders and travelers decide what is safe
            before a request moves forward.
          </CustomText>
        </div>

        <div className="flex flex-col">
          <div
            role="separator"
            aria-hidden
            className="mx-1 border-t border-neutral-100"
          />

          <div className="relative grid sm:grid-cols-2">
            <div
              role="separator"
              aria-hidden
              className="pointer-events-none absolute inset-y-3 left-1/2 hidden w-px -translate-x-1/2 bg-neutral-100 sm:block"
            />

            {items.map((item, index) => {
              const isLeftCol = index % 2 === 0;
              const isTopRow = index < 2;

              return (
                <div
                  key={item.label}
                  className={`relative flex gap-4 py-5 ${
                    isLeftCol ? "sm:pr-8" : "sm:pl-8"
                  }`}
                >
                  {index > 0 ? (
                    <div
                      role="separator"
                      aria-hidden
                      className="absolute top-0 right-3 left-3 border-t border-neutral-100 sm:hidden"
                    />
                  ) : null}
                  {!isTopRow ? (
                    <div
                      role="separator"
                      aria-hidden
                      className="absolute top-0 right-3 left-3 hidden border-t border-neutral-100 sm:block"
                    />
                  ) : null}

                  <CircleBadge size="lg" bgColor={variant}>
                    <SvgIcon
                      size="lg"
                      Icon={item.Icon!}
                      className={
                        safetyIconColors[index % safetyIconColors.length]
                      }
                    />
                  </CircleBadge>
                  <div className="flex min-w-0 flex-col gap-1">
                    <CustomText
                      as="h4"
                      textVariant="primary"
                      textSize="lg"
                      className="font-medium"
                    >
                      {item.label}
                    </CustomText>
                    <CustomText
                      as="p"
                      textSize="sm"
                      className="leading-relaxed"
                    >
                      {item.value}
                    </CustomText>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            role="separator"
            aria-hidden
            className="mx-1 border-t border-neutral-100"
          />
        </div>
      </div>
    </DefaultContainer>
  );
}
