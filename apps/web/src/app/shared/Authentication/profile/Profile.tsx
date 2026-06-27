import { Card } from "@/app/components/card/Card";
import FloatingInputField from "@/app/components/CustomInputField";
import { useToast } from "@/app/components/Toast";
import { SignUpUseCase } from "@/app/shared/Authentication/application/SignUpUseCase";
import { SupabaseAuthRepository } from "@/app/shared/data/SupabaseAuthRepository";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { Button } from "@/components/ui/Button";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useForm,
  type FieldNamesMarkedBoolean,
  type UseFormRegister,
  type FieldErrors,
  type UseFormWatch,
  Controller,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import LineDivider from "@/app/components/LineDivider";
import type { UserProfile } from "../domain/authTypes";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";
import { toDialCode, toflag } from "@/app/Mapper";
import { Lock, MapPin, Pencil, ShieldHalf, User2 } from "lucide-react";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { UpdateProfileUseCase } from "../application/UpdateProfileUseCase";
import { UpdateAuthDetailsUseCase } from "../application/UpdateAuthDetailsUseCase";
import { DeleteAccountUseCase } from "../application/DeleteAccountUseCase";
import { LogoutUseCase } from "../application/LogoutUseCase";
import { DeleteAvatarUseCase } from "../application/DeleteAvatarUseCase";
import ComboBox from "@/app/components/ComboBox";
import { useUniversalModal } from "../application/DialogBoxModalProvider";
import {
  UserDetailsScema,
  type UserDetailsFields,
} from "../UI/CompleteProfilePage";
import EmailVerificationBadge from "../UI/EmailVerificationBadge";
import { useLocations } from "@/app/hookes/useLocation";
import CustomModal from "@/app/components/CustomModal";
import { z } from "zod";
import { otpCodeSchema } from "@/app/shared/validation/formValidation";
import { toE164PhoneNumber } from "../application/toE164PhoneNumber";
import PhoneNumberWithCountryFields from "../UI/components/PhoneNumberWithCountryFields";
import {
  phoneWithCountrySchema,
  type PhoneWithCountryFields,
} from "../validation/phoneWithCountrySchema";
import {
  useRequestPhoneChangeMutation,
  useVerifyPhoneChangeMutation,
} from "@/app/hooks/mutations/useAuthMutations";
import Spinner from "@/app/components/Spinner";
import {
  enrollPasskey,
  listPasskeys,
  removePasskey,
  type PasskeyCredentialSummary,
} from "../application/passkeyAuth";
import { TravelerPayoutStatusRow } from "../UI/TravelerPayoutStatusRow";
import { useMyTrips } from "@/app/hooks/queries/useTripsQueries";
import {
  getTravelerStripeReturnToast,
  syncTravelerStripeConnectAfterReturn,
} from "@/app/features/carry request/application/travelerStripeVerification";
import { shouldShowTravelerPayoutSetup } from "@/app/features/carry request/application/travelerStripeConnectStatus";

type AvatarProps = {
  onDelete: () => void;
  preview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement, Element>) => void;
};

type ProfileSection = "personal" | "location" | "security";

/** Set true to force Traveler payouts card visible for UI preview. */
const PREVIEW_TRAVELER_PAYOUTS = false;

const verifyPhoneChangeSchema = z.object({
  otpCode: otpCodeSchema,
});

type VerifyPhoneChangeFields = z.infer<typeof verifyPhoneChangeSchema>;

type FormProps = {
  register: UseFormRegister<UserDetailsFields>;
  watch: UseFormWatch<UserDetailsFields>;
  touchedFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  dirtyFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  errors: FieldErrors<UserDetailsFields>;
};
type IconSpecs = {
  className: string;
  strokeWidth: number;
};

function getProfileEmail(
  profile: UserProfile | null,
  userEmail?: string | null,
): string {
  return profile?.email?.trim() || userEmail?.trim() || "";
}

function formatProfileDisplayName(fullName: string): string {
  return fullName.trim();
}

function formatDisplayPhoneNumber(
  phoneNumber: string | null | undefined,
  countryCode: string | null | undefined,
): string {
  if (!phoneNumber?.trim()) return "";
  if (phoneNumber.trim().startsWith("+")) return phoneNumber.trim();

  const digits = phoneNumber.replace(/\D/g, "");
  const dialCode = countryCode ? toDialCode(countryCode) : null;

  if (!digits || !dialCode) return phoneNumber;

  const dialDigits = dialCode.replace(/\D/g, "");
  if (digits.startsWith(dialDigits)) return `+${digits}`;

  return `${dialCode}${digits.replace(/^0+/, "")}`;
}

function getProfileFormValues(
  profile: UserProfile,
  userEmail?: string | null,
): UserDetailsFields {
  const fullName = profile.fullName?.trim() ?? "";
  const parts = fullName.split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    emailAddress: getProfileEmail(profile, userEmail),
    phoneNumber: profile.phoneNumber ?? "",
    country: profile.countryCode ?? "",
    city: profile.city ?? "",
  };
}

export default function ProfilePage() {
  const [editing, setEditing] = useState<ProfileSection | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const localAvatarPreviewUrlRef = useRef<string | null>(null);
  const stripeParamHandledRef = useRef<string | null>(null);
  const [changePhoneOpen, setChangePhoneOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyCredentialSummary[]>([]);
  const [passkeysLoading, setPasskeysLoading] = useState(false);
  const [passkeyActionLoading, setPasskeyActionLoading] = useState(false);
  const [removingPasskeyId, setRemovingPasskeyId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshProfile, profile } = useAuth();
  const { data: myTrips = [] } = useMyTrips(user?.id);
  const showTravelerPayouts = useMemo(
    () =>
      PREVIEW_TRAVELER_PAYOUTS ||
      (profile ? shouldShowTravelerPayoutSetup(profile, myTrips.length) : false),
    [profile, myTrips.length],
  );
  const { toast } = useToast();
  const { showSupabaseError, confirm } = useUniversalModal();

  const {
    control,
    register,
    reset,
    watch,
    trigger,
    getValues,
    setValue,
    formState: { errors, isSubmitting, dirtyFields, touchedFields },
  } = useForm<UserDetailsFields>({
    resolver: zodResolver(UserDetailsScema),
    defaultValues: {
      firstName: "",
      lastName: "",
      emailAddress: "",
      phoneNumber: "",
      country: "",
      city: "",
    },
    mode: "onTouched",
  });

  const originCountry = watch("country");
  const { countryNames, cityOptions, getCountryName, getCountryCode } =
    useLocations(originCountry);

  useEffect(() => {
    if (!user || !profile) return;

    reset(getProfileFormValues(profile, user.email), {
      keepDirty: true,
      keepTouched: true,
    });
  }, [user?.id, user?.email, profile, reset]);

  const openSecurityEdit = () => {
    if (!profile) return;
    setValue("emailAddress", getProfileEmail(profile, user?.email), {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    setEditing("security");
  };

  useEffect(() => {
    if (searchParams.get("edit") !== "security" || !profile) return;

    openSecurityEdit();
    setSearchParams({}, { replace: true });
  }, [profile, searchParams, setSearchParams, setValue, user?.email]);

  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    if (stripeParam !== "return" && stripeParam !== "refresh") return;

    if (stripeParamHandledRef.current === stripeParam) return;
    stripeParamHandledRef.current = stripeParam;

    void (async () => {
      try {
        const origin = window.location.origin;
        const status = await syncTravelerStripeConnectAfterReturn({
          returnUrl: `${origin}/profile?stripe=return`,
          refreshUrl: `${origin}/profile?stripe=refresh`,
        });
        await refreshProfile({ silent: true });
        const { message, variant } = getTravelerStripeReturnToast(status);
        toast(message, { variant });
      } catch (err) {
        showSupabaseError(err);
      } finally {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("stripe");
        const nextSearch = params.toString();
        setSearchParams(nextSearch ? `?${nextSearch}` : "", { replace: true });
      }
    })();
  }, [searchParams, refreshProfile, setSearchParams, showSupabaseError, toast]);

  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);
  const updateAuthDetails = useMemo(
    () => new UpdateAuthDetailsUseCase(authRepo),
    [authRepo],
  );
  const upLoadAvatrUseCase = useMemo(
    () => new SignUpUseCase(authRepo),
    [authRepo],
  );
  const updateProfileUseCase = useMemo(
    () => new UpdateProfileUseCase(authRepo),
    [authRepo],
  );

  const deleteAvatarUseCase = useMemo(
    () => new DeleteAvatarUseCase(authRepo),
    [authRepo],
  );
  const deleteAccountUseCase = useMemo(
    () => new DeleteAccountUseCase(authRepo),
    [authRepo],
  );
  const logoutUseCase = useMemo(
    () => new LogoutUseCase(authRepo),
    [authRepo],
  );

  const refreshPasskeys = useCallback(async () => {
    if (!user) return;
    setPasskeysLoading(true);
    try {
      const rows = await listPasskeys();
      setPasskeys(rows);
    } catch {
      // Fail silently if passkeys are disabled for the project.
      setPasskeys([]);
    } finally {
      setPasskeysLoading(false);
    }
  }, [user]);
  //  Hook must be BEFORE any conditional return
  useEffect(() => {
    // If user picked a file, don't overwrite their local preview
    if (file) return;

    if (localAvatarPreviewUrlRef.current) {
      URL.revokeObjectURL(localAvatarPreviewUrlRef.current);
      localAvatarPreviewUrlRef.current = null;
    }

    const url = profile?.avatarUrl ?? null;
    setPreview(url);
  }, [profile?.avatarUrl, file]);

  useEffect(() => {
    return () => {
      if (localAvatarPreviewUrlRef.current) {
        URL.revokeObjectURL(localAvatarPreviewUrlRef.current);
        localAvatarPreviewUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    void refreshPasskeys();
  }, [refreshPasskeys]);

  if (!user) {
    return (
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
          <Card
            enableHover={false}
            className="w-full max-w-md p-8 text-center"
            paddingClass="p-8"
          >
            <span className="mx-auto mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <Lock className="h-5 w-5" aria-hidden strokeWidth={1.75} />
            </span>
            <CustomText
              as="h2"
              textVariant="primary"
              textSize="lg"
              className="mb-2 font-medium"
            >
              You&apos;re not signed in
            </CustomText>
            <CustomText textVariant="label" textSize="sm" className="mb-6">
              Sign in to view and update your profile.
            </CustomText>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="neutral" size="md" className="w-full sm:w-auto">
                Create account
              </Button>
              <Button variant="primary" size="md" className="w-full sm:w-auto">
                Sign in
              </Button>
            </div>
          </Card>
        </div>
      </DefaultContainer>
    );
  }
  // If profile can be null (row missing), don't blank the whole page:
  if (!profile) {
    return (
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6">
          <Spinner />
          <CustomText textVariant="label" textSize="sm">
            Setting up your profile…
          </CustomText>
        </div>
      </DefaultContainer>
    );
  }

  const updateAvatar = async () => {
    if (!file) return;
    try {
      await upLoadAvatrUseCase.uploadAvatar(user.id, file);
      setFile(null);
      toast("Profile photo updated successfully.", { variant: "success" });
      await refreshProfile();
    } catch (err) {
      showSupabaseError(err);
    }
  };

  const onDeleteAvatar = async () => {
    if (!profile.avatarUrl) return;

    try {
      await deleteAvatarUseCase.execute(user.id, profile.avatarUrl);
      setFile(null);
      setPreview(null);
      await refreshProfile();
      toast("Profile photo removed.", { variant: "success" });
    } catch (err) {
      showSupabaseError(err);
    }
  };

  const onUpdateProfile = async () => {
    if (editing === "security") {
      const values = getValues();
      const wantsEmailChange = !!dirtyFields.emailAddress;

      if (!wantsEmailChange) {
        toast("Make a change before updating your profile.", {
          variant: "warning",
        });
        return;
      }

      if (wantsEmailChange) {
        const ok = await trigger("emailAddress");
        if (!ok) return;
      }

      const email = dirtyFields.emailAddress ? values.emailAddress : undefined;

      try {
        await updateAuthDetails.excute(user.id, email);
        toast("Profile updated successfully.", { variant: "success" });
        reset(getValues());
        await refreshProfile();
      } catch (err) {
        showSupabaseError(err);
      }
    }

    if (editing === "personal" || editing === "location") {
      const personalDetails: Array<keyof UserDetailsFields> = [
        "firstName",
        "lastName",
        "city",
        "country",
      ];

      if (!isPersonalDirty(dirtyFields)) {
        toast("Make a change before updating your profile.", {
          variant: "warning",
        });
        return;
      }
      const ok = await trigger(personalDetails);

      if (!ok) return;
      const values = getValues();

      try {
        await updateProfileUseCase.execute(user?.id, {
          fullName: `${values.firstName} ${values.lastName}`,
          id: null,
          avatarUrl: null,
          countryCode: values.country,
          city: values.city,
          email: values.emailAddress,
          phoneNumber: profile.phoneNumber,
        });
        reset(getValues());
        setFile(null);
        toast("Profile updated successfully.", { variant: "success" });
        await refreshProfile();
      } catch (err) {
        showSupabaseError(err);
      }
    }
  };

  const iconSpecs: IconSpecs = {
    className: "h-5 w-5 text-slate-600",
    strokeWidth: 1.75,
  };

  const handleDeleteAccount = async () => {
    const shouldDelete = await confirm({
      title: "Delete your account?",
      message:
        "This permanently deletes your account, profile, listings, and personal data. Active carry requests must be finished or cancelled first. This cannot be undone.",
      confirmText: "Delete account",
      cancelText: "Cancel",
      destructive: true,
    });

    if (!shouldDelete) return;

    setDeletingAccount(true);
    try {
      await deleteAccountUseCase.execute();
      await logoutUseCase.execute();
      navigate("/", { replace: true });
    } catch (err) {
      showSupabaseError(err);
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleAddPasskey = async () => {
    setPasskeyActionLoading(true);
    try {
      await enrollPasskey();
      toast("Passkey added successfully.", { variant: "success" });
      await refreshPasskeys();
    } catch (err) {
      showSupabaseError(err);
    } finally {
      setPasskeyActionLoading(false);
    }
  };

  const handleRemovePasskey = async (passkeyId: string) => {
    const shouldRemove = await confirm({
      title: "Remove this passkey?",
      message: "You can add it again later from security settings.",
      confirmText: "Remove passkey",
      cancelText: "Keep passkey",
      destructive: true,
    });
    if (!shouldRemove) return;

    setRemovingPasskeyId(passkeyId);
    try {
      await removePasskey(passkeyId);
      toast("Passkey removed.", { variant: "success" });
      await refreshPasskeys();
    } catch (err) {
      showSupabaseError(err);
    } finally {
      setRemovingPasskeyId(null);
    }
  };

  return (
    <DefaultContainer outerClassName="bg-canvas min-h-screen">
      <header className="mb-4 px-1 sm:px-2">
        <CustomText
          textSize="xl"
          textVariant="primary"
          className="font-medium"
        >
          Profile & Security
        </CustomText>
        <CustomText textVariant="label" textSize="sm" className="mt-1">
          Manage your personal details, location, and sign-in settings.
        </CustomText>
      </header>
      <Card
        enableHover={false}
        className="mx-auto w-full sm:max-w-2xl"
        paddingClass="px-4 py-5 sm:px-8 sm:py-6"
      >
        <CardHeaderSection
          avatar={profile.avatarUrl ?? ""}
          file={file}
          preview={preview}
          fullName={profile.fullName ?? ""}
          email={getProfileEmail(profile, user.email)}
          setFile={setFile}
          setPreview={setPreview}
          localPreviewUrlRef={localAvatarPreviewUrlRef}
          updateAvatar={updateAvatar}
          onDelete={onDeleteAvatar}
        />
        <form onSubmit={(e) => e.preventDefault()} autoComplete="off">
          <LineDivider heightClass="my-2 sm:my-4" />
          <motion.div
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col gap-1 sm:gap-2"
          >
            <ProfileSectionShell
              isActive={editing === "personal"}
              isAnotherSectionEditing={!!editing && editing !== "personal"}
            >
              <PersonalDetailsSection
                onClick={onUpdateProfile}
                register={register}
                isSubmitting={isSubmitting}
                iconSpecs={iconSpecs}
                profile={profile}
                editing={editing}
                setEditing={setEditing}
                onCancel={() => setEditing(null)}
                dirtyFields={dirtyFields}
                touchedFields={touchedFields}
                watch={watch}
                showTravelerPayouts={showTravelerPayouts}
                onRefreshPayoutStatus={() => refreshProfile({ silent: true })}
              />
            </ProfileSectionShell>
            <LineDivider heightClass="my-1 sm:my-2" />
            <ProfileSectionShell
              isActive={editing === "security"}
              isAnotherSectionEditing={!!editing && editing !== "security"}
            >
              <SecurityDetailsCard
                profile={profile}
                iconSpecs={iconSpecs}
                editing={editing}
                isSubmitting={isSubmitting}
                passkeys={passkeys}
                passkeysLoading={passkeysLoading}
                passkeyActionLoading={passkeyActionLoading}
                removingPasskeyId={removingPasskeyId}
                setEditing={openSecurityEdit}
                control={control}
                watch={watch}
                error={errors}
                register={register}
                onClick={onUpdateProfile}
                dirtyFields={dirtyFields}
                touchedFields={touchedFields}
                onAddPasskey={() => void handleAddPasskey()}
                onRemovePasskey={(passkeyId) => void handleRemovePasskey(passkeyId)}
                actionBtns={{
                  onClick: () => onUpdateProfile(),
                  onCancel: () => setEditing(null),
                }}
                onChangePhone={() => setChangePhoneOpen(true)}
              />
            </ProfileSectionShell>
            <LineDivider heightClass="my-1 sm:my-2" />
            <ProfileSectionShell
              isActive={editing === "location"}
              isAnotherSectionEditing={!!editing && editing !== "location"}
            >
              <LocationSection
                profile={profile}
                control={control}
                setValue={setValue}
                iconSpecs={iconSpecs}
                editing={editing}
                isSubmitting={isSubmitting}
                cities={cityOptions}
                countryNames={countryNames}
                getCountryName={getCountryName}
                getCountryCode={getCountryCode}
                formProps={{
                  register: register,
                  watch: watch,
                  touchedFields: touchedFields,
                  dirtyFields: dirtyFields,
                  errors: errors,
                }}
                formBtn={{
                  onClick: () => onUpdateProfile(),
                  onCancel: () => setEditing(null),
                }}
                setEditing={() => setEditing("location")}
              />
            </ProfileSectionShell>
          </motion.div>
        </form>
        <AnimatePresence>
          {changePhoneOpen && (
            <ChangePhoneNumberModal
              userId={user.id}
              currentPhoneNumber={profile.phoneNumber}
              profileCountry={profile.countryCode}
              onClose={() => setChangePhoneOpen(false)}
              onVerified={async () => {
                await refreshProfile();
                reset(getValues(), { keepDirty: false, keepTouched: false });
              }}
            />
          )}
        </AnimatePresence>
        <LineDivider heightClass="my-4" />
        <div className="flex flex-col gap-3">
          <CustomText
            as="h3"
            textVariant="primary"
            textSize="md"
            className="font-medium"
          >
            Delete account
          </CustomText>
          <Button
            type="button"
            variant="error"
            size="sm"
            className="group w-full hover:border-error-200 sm:w-auto"
            disabled={deletingAccount || !!editing}
            isBusy={deletingAccount}
            onClick={() => void handleDeleteAccount()}
          >
            <CustomText
              as="span"
              textVariant="primary"
              textSize="sm"
              className="group-hover:text-ink-error"
            >
              Delete account
            </CustomText>
          </Button>
        </div>
      </Card>
    </DefaultContainer>
  );
}
type LocationSectionProps = {
  profile: UserProfile;
  iconSpecs: IconSpecs;
  control: Control<UserDetailsFields>;
  setValue: UseFormSetValue<UserDetailsFields>;
  formProps: FormProps;
  formBtn: ActionButtonProps;
  editing: ProfileSection | null;
  isSubmitting: boolean;
  cities: string[];
  countryNames: string[];
  getCountryName: (countryValue: string | null | undefined) => string;
  getCountryCode: (countryValue: string | null | undefined) => string | null;
  setEditing: (v: ProfileSection | null) => void;
};

function LocationSection({
  profile,
  formProps,
  formBtn,
  control,
  setValue,
  iconSpecs,
  editing,
  isSubmitting,
  cities,
  countryNames,
  getCountryName,
  getCountryCode,
  setEditing,
}: LocationSectionProps) {
  const isEditing = editing === "location";
  const countryCode = formProps.watch("country");
  const countryValue = profile.country ?? countryCode;
  const countryDisplayName = getCountryName(countryValue);
  const countryFlagIcon = toflag(getCountryCode(countryValue) ?? countryValue);

  return (
    <div className={`flex flex-col ${isEditing ? "gap-5" : "gap-3"}`}>
      <SectionHeader
        title="Your location"
        isEditing={isEditing}
        setEditing={() => setEditing("location")}
        icon={
          <MapPin
            className={iconSpecs.className}
            strokeWidth={iconSpecs.strokeWidth}
          />
        }
      />
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="location-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2 pl-1"
          >
            <InfoRow
              label="Country"
              value={countryDisplayName}
              leadingIcon={
                countryFlagIcon ? (
                  <SvgIcon size="sm" Icon={countryFlagIcon} />
                ) : undefined
              }
            />
            <InfoRow label="City" value={formProps.watch("city")} />
          </motion.div>
        ) : (
          <motion.div
            key="location-edit"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
          >
            <LocationEditForm
              control={control}
              setValue={setValue}
              formBtns={formBtn}
              isSubmitting={isSubmitting}
              cities={cities}
              countryNames={countryNames}
              getCountryName={getCountryName}
              getCountryCode={getCountryCode}
              selectedCountry={countryCode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type securityProps = {
  profile: UserProfile;
  editing: ProfileSection | null;
  isSubmitting: boolean;
  passkeys: PasskeyCredentialSummary[];
  passkeysLoading: boolean;
  passkeyActionLoading: boolean;
  removingPasskeyId: string | null;
  setEditing: () => void;
  actionBtns: ActionButtonProps;
  iconSpecs: IconSpecs;
  control: Control<UserDetailsFields>;
  watch: UseFormWatch<UserDetailsFields>;
  error: FieldErrors<UserDetailsFields>;
  dirtyFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  touchedFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  register: UseFormRegister<UserDetailsFields>;
  onClick: () => void;
  onChangePhone: () => void;
  onAddPasskey: () => void;
  onRemovePasskey: (passkeyId: string) => void;
};

function SecurityDetailsCard({
  editing,
  setEditing,
  actionBtns,
  watch,
  control,
  profile,
  iconSpecs,
  isSubmitting,
  passkeys,
  passkeysLoading,
  passkeyActionLoading,
  removingPasskeyId,
  onClick,
  onChangePhone,
  onAddPasskey,
  onRemovePasskey,
}: securityProps) {
  const isEditing = editing === "security";
  const passkeyCount = passkeys.length;
  return (
    <div className={`flex flex-col ${isEditing ? "gap-5" : "gap-3"}`}>
      <SectionHeader
        isEditing={isEditing}
        setEditing={setEditing}
        icon={
          <ShieldHalf
            className={iconSpecs.className}
            strokeWidth={iconSpecs.strokeWidth}
          />
        }
        title="Security"
      />

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="security-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2 pl-1"
          >
            <EmailInfoRow
              email={profile.email ?? watch("emailAddress")}
              emailVerified={profile.emailVerified === true}
            />
            <PhoneInfoRow
              phone={profile.phoneNumber}
              countryCode={profile.countryCode}
            />
            <button
              type="button"
              onClick={onChangePhone}
              className="w-fit text-sm font-medium text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
            >
              Change phone number
            </button>
            <InfoRow
              label="Passkey sign-in"
              value={
                passkeysLoading
                  ? "Loading..."
                  : passkeyCount > 0
                    ? `Enabled (${passkeyCount})`
                    : "Not set up"
              }
            />
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="neutral"
                size="sm"
                className="w-full border border-neutral-300 bg-white font-medium text-ink-primary hover:bg-neutral-100 sm:w-auto"
                onClick={onAddPasskey}
                disabled={passkeysLoading || passkeyActionLoading || !!removingPasskeyId}
                isBusy={passkeyActionLoading}
              >
                {passkeyCount > 0 ? "Add another passkey" : "Set up passkey"}
              </Button>
            </div>
            {passkeyCount > 0 && (
              <div className="flex flex-col gap-2">
                {passkeys.map((passkey) => (
                  <div
                    key={passkey.id}
                    className="flex flex-wrap items-center gap-2 text-xs text-neutral-600"
                  >
                    <span>
                      {passkey.friendlyName?.trim() || `Passkey ${passkey.id.slice(0, 8)}`}
                    </span>
                    <Button
                      type="button"
                      variant="neutral"
                      size="sm"
                      className="h-7 px-2 text-xs hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                      disabled={passkeyActionLoading || removingPasskeyId === passkey.id}
                      isBusy={removingPasskeyId === passkey.id}
                      onClick={() => onRemovePasskey(passkey.id)}
                    >
                      Remove passkey
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="security-edit"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <Controller
              name="emailAddress"
              control={control}
              render={({ field, fieldState }) => (
                <FloatingInputField
                  autoComplete="email"
                  className="w-full sm:max-w-[350px]"
                  label="Email address"
                  type="email"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  hasValue={Boolean(field.value?.trim())}
                  isDirty={fieldState.isDirty}
                  isTouched={fieldState.isTouched}
                  error={fieldState.error?.message}
                  trailingIcon={
                    <EmailVerificationBadge
                      verified={profile.emailVerified === true}
                    />
                  }
                />
              )}
            />
            <FloatingInputField
              className="w-full cursor-not-allowed bg-neutral-50 sm:max-w-[350px]"
              hasValue={!!profile.phoneNumber}
              label="Phone number"
              value={formatDisplayPhoneNumber(
                profile.phoneNumber,
                profile.countryCode,
              )}
              readOnly
              disabled
              trailingIcon={<EmailVerificationBadge verified compact />}
              isDirty={false}
              isTouched={false}
            />
            <button
              type="button"
              onClick={onChangePhone}
              className="w-fit text-sm font-medium text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
            >
              Change phone number
            </button>
            <ActionButton
              onClick={onClick}
              onCancel={actionBtns.onCancel}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonalDetailsSection({
  profile,
  editing,
  setEditing,
  onCancel,
  register,
  dirtyFields,
  touchedFields,
  iconSpecs,
  watch,
  onClick,
  isSubmitting,
  showTravelerPayouts,
  onRefreshPayoutStatus,
}: {
  isSubmitting: boolean;
  dirtyFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  touchedFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  watch: UseFormWatch<UserDetailsFields>;
  profile: UserProfile;
  iconSpecs: IconSpecs;
  editing: ProfileSection | null;
  onCancel: () => void;
  setEditing: (s: ProfileSection | null) => void;
  register: UseFormRegister<UserDetailsFields>;
  onClick: () => void;
  showTravelerPayouts: boolean;
  onRefreshPayoutStatus: () => void | Promise<void>;
}) {
  const isEditing = editing === "personal";
  const nameParts = profile.fullName?.trim().split(/\s+/) ?? [];

  return (
    <div className={`flex flex-col ${isEditing ? "gap-5" : "gap-3"}`}>
      <SectionHeader
        isEditing={isEditing}
        setEditing={() => setEditing("personal")}
        icon={
          <User2
            className={iconSpecs.className}
            strokeWidth={iconSpecs.strokeWidth}
          />
        }
        title="Personal details"
      />

      <AnimatePresence mode="wait">
        {!isEditing && profile ? (
          <motion.div
            key="personal-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2 pl-1"
          >
            <InfoRow
              label="First name"
              value={nameParts[0] ? nameParts[0] : undefined}
            />
            <InfoRow
              label="Last name"
              value={
                nameParts.length > 1
                  ? nameParts.slice(1).join(" ")
                  : undefined
              }
            />
            {showTravelerPayouts ? (
              <TravelerPayoutStatusRow
                profile={profile}
                onStatusRefreshed={onRefreshPayoutStatus}
              />
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="personal-edit"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
          >
            <PersonalEditForm
              register={register}
              onCancel={onCancel}
              touchedFields={touchedFields}
              dirtyFields={dirtyFields}
              onClick={onClick}
              watch={watch}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileSectionShell({
  children,
  isActive,
  isAnotherSectionEditing,
}: {
  children: React.ReactNode;
  isActive: boolean;
  isAnotherSectionEditing: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-2 py-3 transition-all sm:px-3",
        isActive && "bg-primary-50/40 ring-1 ring-primary-100",
        isAnotherSectionEditing && "opacity-45 pointer-events-none",
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  isEditing,
  setEditing,
}: {
  icon: React.ReactNode;
  title: string;
  isEditing: boolean;
  setEditing: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          {icon}
        </span>
        <CustomText as="h3" textVariant="primary" textSize="md" className="font-medium">
          {title}
        </CustomText>
      </span>

      <EditBtn isEditing={isEditing} onEdit={setEditing} />
    </div>
  );
}

function EditBtn({
  isEditing,
  onEdit,
}: {
  isEditing: boolean;
  onEdit: () => void;
}) {
  if (isEditing) {
    return (
      <span className="shrink-0 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
        Editing
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label="Edit section"
      className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <Pencil className="h-3.5 w-3.5" aria-hidden />
      Edit
    </button>
  );
}

type LocationEditFormProps = {
  control: Control<UserDetailsFields>;
  setValue: UseFormSetValue<UserDetailsFields>;
  formBtns: ActionButtonProps;
};

function LocationEditForm({
  control,
  setValue,
  formBtns,
  cities,
  countryNames,
  getCountryName,
  getCountryCode,
  selectedCountry,
  isSubmitting,
}: LocationEditFormProps & {
  cities: string[];
  countryNames: string[];
  getCountryName: (countryValue: string | null | undefined) => string;
  getCountryCode: (countryValue: string | null | undefined) => string | null;
  selectedCountry: string;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:max-w-[320px]">
        <Controller
          name="country"
          control={control}
          render={({ field, fieldState }) => (
            <ComboBox
              wrapperClassName="w-full"
              placeholder="Select country"
              menuItems={countryNames}
              value={getCountryName(field.value)}
              onValueChange={(nextCountryName) => {
                field.onChange(getCountryCode(nextCountryName) ?? nextCountryName);
                setValue("city", "", {
                  shouldDirty: true,
                  shouldValidate: true,
                  shouldTouch: true,
                });
              }}
              error={fieldState.error?.message}
              isDirty={fieldState.isDirty}
              isTouched={fieldState.isTouched}
              searchable
            />
          )}
        />

        <Controller
          name="city"
          control={control}
          render={({ field, fieldState }) => (
            <ComboBox
              wrapperClassName="w-full"
              placeholder="Select city"
              menuItems={cities}
              disabled={!selectedCountry}
              disabledMessage="Select a country first"
              value={field.value}
              onValueChange={field.onChange}
              error={fieldState.error?.message}
              isDirty={fieldState.isDirty}
              isTouched={fieldState.isTouched}
              searchable
            />
          )}
        />
      </div>

      <ActionButton
        onClick={formBtns.onClick}
        onCancel={formBtns.onCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

function PersonalEditForm({
  touchedFields,
  dirtyFields,
  register,
  onCancel,
  onClick,
  watch,
  isSubmitting,
}: {
  register: UseFormRegister<UserDetailsFields>;
  watch: UseFormWatch<UserDetailsFields>;
  touchedFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  dirtyFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  onCancel: () => void;
  onClick: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-5">
        <FloatingInputField
          className="w-full sm:max-w-[200px]"
          hasValue={!!watch("firstName")}
          label="First name"
          isDirty={!!dirtyFields.firstName}
          isTouched={!!touchedFields.firstName}
          {...register("firstName")}
        />
        <FloatingInputField
          className="w-full sm:max-w-[200px]"
          hasValue={!!watch("lastName")}
          label="Last name"
          isDirty={!!dirtyFields.lastName}
          isTouched={!!touchedFields.lastName}
          {...register("lastName")}
        />
      </div>
      <ActionButton
        onClick={onClick}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

type ChangePhoneNumberModalProps = {
  userId: string;
  currentPhoneNumber: string | null;
  profileCountry: string | null;
  onClose: () => void;
  onVerified: () => Promise<void>;
};

function ChangePhoneNumberModal({
  userId,
  currentPhoneNumber,
  profileCountry,
  onClose,
  onVerified,
}: ChangePhoneNumberModalProps) {
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string | null>(
    null,
  );
  const requestPhoneChange = useRequestPhoneChangeMutation();
  const verifyPhoneChange = useVerifyPhoneChangeMutation();
  const { toast } = useToast();
  const { showSupabaseError } = useUniversalModal();

  const {
    register: registerPhone,
    handleSubmit: handlePhoneSubmit,
    watch: watchPhone,
    setValue: setPhoneValue,
    formState: {
      errors: phoneErrors,
      dirtyFields: phoneDirtyFields,
      touchedFields: phoneTouchedFields,
    },
  } = useForm<PhoneWithCountryFields>({
    resolver: zodResolver(phoneWithCountrySchema),
    defaultValues: {
      countryCode: profileCountry ?? "",
      phoneNumber: "",
    },
    mode: "onTouched",
  });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    watch: watchOtp,
    reset: resetOtp,
    formState: {
      errors: otpErrors,
      dirtyFields: otpDirtyFields,
      touchedFields: otpTouchedFields,
    },
  } = useForm<VerifyPhoneChangeFields>({
    resolver: zodResolver(verifyPhoneChangeSchema),
    defaultValues: {
      otpCode: "",
    },
    mode: "onTouched",
  });

  const selectedCountryCode = watchPhone("countryCode");
  const watchedOtpCode = watchOtp("otpCode");
  const isRequesting = requestPhoneChange.isPending;
  const isVerifying = verifyPhoneChange.isPending;

  const requestCode = async (values: PhoneWithCountryFields) => {
    const e164PhoneNumber = toE164PhoneNumber(
      values.countryCode,
      values.phoneNumber,
    );
    if (!e164PhoneNumber) return;

    try {
      await requestPhoneChange.mutateAsync(e164PhoneNumber);
      setPendingPhoneNumber(e164PhoneNumber);
      resetOtp();
      toast("Verification code sent.", { variant: "success" });
    } catch (err) {
      showSupabaseError(err);
    }
  };

  const verifyCode = async (values: VerifyPhoneChangeFields) => {
    if (!pendingPhoneNumber || !selectedCountryCode) return;

    try {
      await verifyPhoneChange.mutateAsync({
        userId,
        phoneNumber: pendingPhoneNumber,
        token: values.otpCode,
        countryCode: selectedCountryCode,
      });
      toast("Phone number updated successfully.", { variant: "success" });
      await onVerified();
      onClose();
    } catch (err) {
      showSupabaseError(err);
    }
  };

  return (
    <CustomModal onClose={onClose} width="xl" scrollable={false}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <CustomText
            textVariant="primary"
            textSize="lg"
            className="font-medium"
          >
            Change phone number
          </CustomText>
          <CustomText textVariant="secondary" textSize="sm">
            Verify your new phone number before it replaces your current one.
          </CustomText>
        </div>

        <LineDivider heightClass="my-0" />

        <form
          onSubmit={handlePhoneSubmit(requestCode)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-3">
            <div className="mx-auto w-full max-w-[360px]">
              <PhoneNumberWithCountryFields
                register={registerPhone}
                setValue={setPhoneValue}
                watch={watchPhone}
                errors={phoneErrors}
                dirtyFields={phoneDirtyFields}
                touchedFields={phoneTouchedFields}
                disabled={isRequesting || isVerifying}
                defaultCountryCode={profileCountry}
                phoneHelperText={
                  pendingPhoneNumber
                    ? `Code sent to ${pendingPhoneNumber}`
                    : undefined
                }
              />
            </div>
            {currentPhoneNumber && (
              <CustomText as="p" textVariant="secondary" textSize="xs">
                Current phone:{" "}
                <CustomText as="span" textVariant="primary" textSize="xs">
                  {currentPhoneNumber}
                </CustomText>
              </CustomText>
            )}
          </div>

          <LineDivider heightClass="my-0" />

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isRequesting || isVerifying}
            className="w-full justify-center"
          >
            {isRequesting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner />
                Sending code...
              </span>
            ) : pendingPhoneNumber ? (
              "Resend code"
            ) : (
              "Send verification code"
            )}
          </Button>
        </form>

        {pendingPhoneNumber && (
          <>
            <LineDivider heightClass="my-0" />
            <form
              onSubmit={handleOtpSubmit(verifyCode)}
              className="flex flex-col gap-3"
            >
              <FloatingInputField
                className="mx-auto w-full max-w-[360px]"
                hasValue={!!watchedOtpCode}
                label="Verification code"
                inputMode="numeric"
                maxLength={6}
                error={otpErrors.otpCode?.message}
                isDirty={!!otpDirtyFields.otpCode}
                isTouched={!!otpTouchedFields.otpCode}
                disabled={isVerifying}
                {...registerOtp("otpCode")}
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="neutral"
                  size="sm"
                  onClick={onClose}
                  disabled={isVerifying}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner />
                      Verifying...
                    </span>
                  ) : (
                    "Verify and update"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </CustomModal>
  );
}

type ActionButtonProps = {
  onClick: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

function ActionButton({ onClick, onCancel, isSubmitting = false }: ActionButtonProps) {
  return (
    <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
      <Button
        type="button"
        variant="neutral"
        onClick={onCancel}
        size="sm"
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        onClick={onClick}
        type="button"
        variant="primary"
        size="sm"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Spinner />
            Saving…
          </span>
        ) : (
          "Save changes"
        )}
      </Button>
    </div>
  );
}
function InfoRow({
  label,
  value,
  leadingIcon,
}: {
  label: string;
  value?: string | null;
  leadingIcon?: React.ReactNode;
}) {
  const display = value?.trim() || "—";
  const isEmpty = display === "—";

  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-4 gap-y-0.5 sm:grid-cols-[9rem_1fr]">
      <CustomText textVariant="label" textSize="sm" className="pt-0.5">
        {label}
      </CustomText>
      <span className="flex min-w-0 items-center gap-2">
        {leadingIcon}
        <CustomText
          textVariant={isEmpty ? "label" : "primary"}
          textSize="sm"
          className={cn(isEmpty && "italic")}
        >
          {display}
        </CustomText>
      </span>
    </div>
  );
}

function EmailInfoRow({
  email,
  emailVerified,
}: {
  email?: string | null;
  emailVerified: boolean;
}) {
  return (
    <div className="grid grid-cols-[130px_auto] sm:grid-cols-[150px_auto] gap-y-1 sm:gap-x-6">
      <CustomText textVariant="label" textSize="sm">
        Email address
      </CustomText>
      <span className="flex min-w-0 flex-wrap items-center gap-2">
        <CustomText textVariant="primary" className="break-all">
          {email ?? "—"}
        </CustomText>
        <EmailVerificationBadge verified={emailVerified} />
      </span>
    </div>
  );
}

function PhoneInfoRow({
  phone,
  countryCode,
}: {
  phone?: string | null;
  countryCode?: string | null;
}) {
  const display = formatDisplayPhoneNumber(phone, countryCode) || "—";

  return (
    <div className="grid grid-cols-[130px_auto] sm:grid-cols-[150px_auto] gap-y-1 sm:gap-x-6">
      <CustomText textVariant="label" textSize="sm">
        Phone
      </CustomText>
      <span className="flex min-w-0 flex-wrap items-center gap-2">
        <CustomText textVariant="primary">{display}</CustomText>
        <EmailVerificationBadge verified compact />
      </span>
    </div>
  );
}
export function AvatarPicker({
  onDelete,
  preview,
  handleFileChange,
}: AvatarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isHovering, setHover] = useState<boolean>(false);
  function openFileDialog() {
    inputRef.current?.click();
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />

      <span
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="relative inline-flex justify-center items-center"
      >
        <img
          src={preview ?? "/user-profile-icon.svg"}
          alt="Preview"
          className={`${preview ? "h-16 w-16" : "h-12 w-12"} border border-neutral-300 rounded-full`}
        />

        <AnimatePresence>
          {isHovering && preview !== null && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              type="button"
              onClick={onDelete}
              aria-label="Remove profile photo"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <span className="inline-flex rounded-full items-center justify-center bg-white p-1">
                <SvgIcon
                  size="sm"
                  Icon={META_ICONS.recycleBin}
                  color="neutral"
                />
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </span>

      <button
        type="button"
        onClick={openFileDialog}
        aria-label="Change profile photo"
        className="absolute -right-3 bottom-2"
      >
        <span className="inline-flex rounded-full items-center justify-center bg-white p-1">
          <SvgIcon
            size={"sm"}
            Icon={META_ICONS.cameraIcon}
            color={"neutral"}
            className="hover:text-neutral-600 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          />
        </span>
      </button>
    </div>
  );
}

function handleFileChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setFile: (s: File | null) => void,
  setPreview: (p: string) => void,
  localPreviewUrlRef: React.MutableRefObject<string | null>,
) {
  const nextFile = e.target.files?.[0];
  if (!nextFile) return;

  if (localPreviewUrlRef.current) {
    URL.revokeObjectURL(localPreviewUrlRef.current);
    localPreviewUrlRef.current = null;
  }

  setFile(nextFile);

  const previewUrl = URL.createObjectURL(nextFile);
  localPreviewUrlRef.current = previewUrl;
  setPreview(previewUrl);
}

type CardHeaderSectionProps = {
  avatar: string | null;
  preview: string | null;
  file: File | null;
  fullName: string;
  email: string;
  setFile: (s: File | null) => void;
  setPreview: (p: string) => void;
  localPreviewUrlRef: React.MutableRefObject<string | null>;
  onDelete: () => void;
  updateAvatar: () => void;
};

function CardHeaderSection({
  onDelete,
  preview,
  file,
  fullName,
  email,
  setFile,
  setPreview,
  localPreviewUrlRef,
  updateAvatar,
}: CardHeaderSectionProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
      <AvatarPicker
        onDelete={onDelete}
        preview={preview}
        handleFileChange={(event) =>
          handleFileChange(
            event,
            setFile,
            setPreview,
            localPreviewUrlRef,
          )
        }
      />

      <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
        <div className="min-w-0">
          <CustomText
            textSize="lg"
            textVariant="primary"
            className="font-medium"
          >
            {formatProfileDisplayName(fullName) || "Your profile"}
          </CustomText>
          <CustomText
            textSize="sm"
            textVariant="secondary"
            className="mt-0.5 break-all"
          >
            {email}
          </CustomText>
        </div>

        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              exit={{ opacity: 0, y: 6 }}
              className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
            >
              <Button
                onClick={() => setFile(null)}
                variant="neutral"
                size="sm"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={updateAvatar}
                type="button"
                variant="primary"
                size="sm"
                className="w-full sm:w-auto"
              >
                Save photo
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function isPersonalDirty(
  dirtyFields: FieldNamesMarkedBoolean<UserDetailsFields>,
): boolean {
  return [
    dirtyFields.firstName,
    dirtyFields.lastName,
    dirtyFields.city,
    dirtyFields.country,
  ].some(Boolean);
}
