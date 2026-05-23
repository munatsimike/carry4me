import DefaultContainer from "@/components/ui/DefualtContianer";
import type { InfoItemsProps } from "@/types/Ui";
import SectionTitle from "../SectionTitle";
import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";

export default function TrustAndSafety({ items }: InfoItemsProps) {
  const variant = "primary";

  return (
    <DefaultContainer className="flex flex-col py-8 sm:py-10">
      <SectionTitle title="Trust and Safety" />

      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-10">
        <div className="flex flex-col gap-3">
          <span className="w-fit rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 border border-primary-100">
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

        <div className="grid gap-x-8 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex gap-4 border-t border-slate-200 py-5 first:border-t-0 sm:first:border-t lg:odd:border-r lg:odd:pr-8 lg:even:pl-2"
            >
              <CircleBadge size="lg" bgColor={variant}>
                <SvgIcon size="lg" Icon={item.Icon!} color={variant} />
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
                <CustomText as="p" textSize="sm" className="leading-relaxed">
                  {item.value}
                </CustomText>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DefaultContainer>
  );
}
