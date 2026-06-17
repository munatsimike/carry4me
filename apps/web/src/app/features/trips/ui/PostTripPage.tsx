import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DefaultContainer from "@/components/ui/DefualtContianer";
import CustomText from "@/components/ui/CustomText";
import { Card } from "@/app/components/card/Card";
import type { FormValues } from "@/types/Ui";
import type { Step } from "@/app/components/forms/formStepper";
import { useTripForm } from "@/app/shared/Authentication/UI/hooks/useTripForm";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { SupabaseTripsRepository } from "../data/SupabaseTripsRepository";
import { MyTripsUseCase } from "../application/MyTripsUseCase";
import { toOriginCityFormFields } from "@/app/shared/locations/cityOptions";
import { CreateTripForm } from "./CreateTripForm";
import TripFormStepSidebar from "./TripFormStepSidebar";
import Spinner from "@/app/components/Spinner";

export default function PostTripPage() {
  const [searchParams] = useSearchParams();
  const { showSupabaseError } = useUniversalModal();
  const tripRepo = useMemo(() => new SupabaseTripsRepository(), []);
  const tripByIdUseCase = useMemo(
    () => new MyTripsUseCase(tripRepo),
    [tripRepo],
  );

  const mode = searchParams.get("mode") === "edit" ? "edit" : "create";
  const id = searchParams.get("id");
  const returnTo = searchParams.get("returnTo");

  const [initialFormValues, setInitialFormValues] = useState<
    FormValues | undefined
  >(undefined);
  const [loadingEdit, setLoadingEdit] = useState(mode === "edit" && !!id);
  const [currentStep, setCurrentStep] = useState<Step>(1);

  const successPath = returnTo ?? (mode === "edit" ? "/my/trips" : "/dashboard");

  useEffect(() => {
    if (mode !== "edit" || !id) {
      setLoadingEdit(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const trips = await tripByIdUseCase.execute(id);
        if (cancelled || trips.length !== 1) return;

        const data = trips[0];
        setInitialFormValues({
          id: data.id,
          originCountry: data.route.originCountry,
          ...toOriginCityFormFields(
            data.route.originCity,
            data.route.originCityIsCustom,
          ),
          destinationCountry: data.route.destinationCountry,
          destinationCity: data.route.destinationCity,
          goodsCategoryIds: data.goodsCategory.map((category) => category.id),
          itemDescriptions: [],
          weight: data.weightKg,
          pricePerKg: data.pricePerKg,
          senderId: data.user.id ?? "",
          departureDate: data.departDate,
        });
      } catch (err) {
        if (!cancelled) showSupabaseError(err);
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, mode, showSupabaseError, tripByIdUseCase]);

  const {
    selectedIds,
    control,
    register,
    isSubmitting,
    setValue,
    trigger,
    watch,
    dirtyFields,
    errors,
    touchedFields,
    onSubmit,
    handleSubmit,
  } = useTripForm({
    initialFormValues,
    mode,
    returnPath: successPath,
  });

  const title = mode === "edit" ? "Edit trip" : "Post trip";
  const subtitle =
    mode === "edit"
      ? "Update your listing so senders see accurate trip details."
      : "Share your route, set your rate, and get matched with senders on your trip.";

  return (
    <DefaultContainer outerClassName="bg-canvas min-h-screen py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="min-w-0">
            <CustomText
              as="h1"
              textVariant="primary"
              textSize="xl"
              className="font-semibold sm:text-2xl"
            >
              {title}
            </CustomText>
            <CustomText
              as="p"
              textSize="sm"
              textVariant="secondary"
              className="mt-1 max-w-2xl leading-relaxed"
            >
              {subtitle}
            </CustomText>
          </div>
        </div>

        {loadingEdit ? (
          <Card
            enableHover={false}
            className="flex min-h-[320px] items-center justify-center"
          >
            <Spinner />
          </Card>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] lg:gap-8 lg:items-start"
          >
            <TripFormStepSidebar
              currentStep={currentStep}
              mode={mode}
              onStepSelect={setCurrentStep}
            />

            <Card
              enableHover={false}
              sizeClass="max-w-none"
              className="min-w-0 w-full p-4 sm:p-6 lg:p-8"
            >
              <CreateTripForm
                mode={mode}
                variant="page"
                step={currentStep}
                selectedIds={selectedIds}
                onStepChange={setCurrentStep}
                formProps={{
                  control,
                  register,
                  isSubmitting,
                  setValue,
                  trigger,
                  watch,
                  dirtyFields,
                  errors,
                  touchedFields,
                }}
              />
            </Card>
          </form>
        )}
      </div>
    </DefaultContainer>
  );
}
