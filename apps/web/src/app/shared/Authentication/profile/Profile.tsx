import { Card } from "@/app/components/card/Card";
import FloatingInputField from "@/app/components/CustomInputField";
import DropDownMenu from "@/app/components/DropDownMenu";
import { useToast } from "@/app/components/Toast";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { SignUpUseCase } from "@/app/shared/Authentication/application/SignUpUseCase";
import { SupabaseAuthRepository } from "@/app/shared/data/SupabaseAuthRepository";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { Button } from "@/components/ui/Button";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, warning } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useForm,
  type UseFormRegister,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { UserDetailsScema, type UserDetailsFields } from "../UI/SignUpPage";
import LineDivider from "@/app/components/LineDivider";
import type { UserProfile } from "../domain/authTypes";
import CustomText from "@/components/ui/CustomText";
import { MapPin, ShieldHalf, User2 } from "lucide-react";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { UpdateProfileUseCase } from "../application/UpdateProfileUseCase";

type AvatarProps = {
  preview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement, Element>) => void;
};

type ProfileSection = "personal" | "location" | "security";

type ProfileMode = {
  editing: ProfileSection | null;
};

type Location = {
  value: string;
  error: string;
  isDirty: boolean;
  isTouched: boolean;
  register: UseFormRegisterReturn;
};

type LocationProps = {
  country: Location;
  city: Location;
  formBtns: ActionButtonProps;
};
type IconSpecs = {
  className: string;
  strokeWidth: number;
};

export default function ProfilePage() {
  const [editing, setEditing] = useState<ProfileSection | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { user, refreshProfile, profile } = useAuth();

  const { toast } = useToast();

  const {
    register,
    reset,
    watch,
    trigger,
    getValues,
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
      password: "",
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  useEffect(() => {
    if (!user || !profile) return;

    const fullName = profile.fullName?.trim() ?? "";
    const parts = fullName.split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ");

    reset(
      {
        firstName,
        lastName,
        emailAddress: user.email ?? "",
        phoneNumber: profile.phoneNumber ?? "",
        country: profile.countryCode ?? "",
        city: profile.city ?? "",
        password: "",
        confirmPassword: "",
      },
      {
        keepDirty: true, // don’t wipe user edits if profile updates
        keepTouched: true,
      },
    );
  }, [user?.id, user?.email, profile, reset]);

  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);
  const upLoadAvatrUseCase = useMemo(
    () => new SignUpUseCase(authRepo),
    [authRepo],
  );
  const updateProfileUseCase = useMemo(
    () => new UpdateProfileUseCase(authRepo),
    [authRepo],
  );

  //  Hook must be BEFORE any conditional return
  useEffect(() => {
    // If user picked a file, don't overwrite their local preview
    if (file) return;

    const url = profile?.avatarUrl
      ? profile.avatarUrl
      : "/user-profile-icon.svg";
    setPreview(url);
  }, [profile?.avatarUrl, file]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;

    setFile(nextFile);

    const previewUrl = URL.createObjectURL(nextFile);
    setPreview(previewUrl);

    // Cleanup object URL to prevent memory leaks
    // (cleanup for previous object URL if any)
    return () => URL.revokeObjectURL(previewUrl);
  }

  if (!user) return <div className="p-6">Please sign in.</div>;

  // If profile can be null (row missing), don't blank the whole page:
  if (!profile) return <div className="p-6">Setting up your profile…</div>;

  const onUpdate = async () => {
    const personalDetails: Array<keyof UserDetailsFields> = [
      "firstName",
      "lastName",
      "city",
      "country",
      "phoneNumber",
    ];

    if (editing === "personal") {
      const personalDirty =
        !!dirtyFields.firstName ||
        !!dirtyFields.lastName ||
        !!dirtyFields.phoneNumber ||
        !!dirtyFields.emailAddress;

      if (!personalDirty) {
        toast("Make changes to update profile", { variant: "warning" });
        return;
      }
      const ok = await trigger(personalDetails);
      console.log(ok);
      if (!ok) return;
    }

    if (editing === "security") {
      const ok = await trigger("password");
      console.log(ok);
      if (!ok) return;
    }

    if (editing === "location") {
      const location: Array<keyof UserDetailsFields> = ["city", "country"];
      const ok = await trigger(location);
      console.log(ok);
      if (!ok) return;
    }

    const values = getValues();

    console.log(values);

    const result = await namedCall(
      "profile update",
      updateProfileUseCase.execute(user?.id, {
        fullName: `${values.firstName} ${values.lastName}`,
        id: null,
        avatarUrl: null,
        countryCode: values.country,
        city: values.city,
        phoneNumber: values.phoneNumber,
      }),
    );

    if (result.result) {
      toast("Profile updated successfully", { variant: "success" });
    }

    if (!result.result) {
      toast("Upload failed", { variant: "error" });
      return;
    }

    reset(getValues());
    // optional: clear file after successful upload
    setFile(null);
    toast("Profile updated successfuly", { variant: "success" });
    await refreshProfile();
  };

  const iconSpecs: IconSpecs = {
    className: "h-6 w-6 text-neutral-400",
    strokeWidth: 1.5,
  };

  const isCountryDirty = !!dirtyFields.country;
  const isCountryTouched = !!touchedFields.country;
  const isCityDirty = !!dirtyFields.city;
  const isCityTouched = !!touchedFields.city;
  const location: LocationProps = {
    city: {
      value: watch("city"),
      error: "",
      isDirty: isCityDirty,
      isTouched: isCityTouched,
      register: register("city"),
    },
    country: {
      value: watch("country"),
      error: "",
      isDirty: isCountryDirty,
      isTouched: isCountryTouched,
      register: register("country"),
    },
    formBtns: {
      isSubmitting: false,
      isDirty: false,
      onCancel: () => setEditing(null),
      onClick: function (): void {
        onUpdate();
      },
    },
  };

  return (
    <DefaultContainer>
      <Card className="mx-auto w-full max-w-2xl" paddingClass="p-8 px-10">
        <form onSubmit={(e) => e.preventDefault()}>
          <span className="flex flex-col items-center">
            <span className="relative inline-flex gap-4">
              <AvatarPicker
                preview={preview}
                handleFileChange={handleFileChange}
              />
              <span className="inline-flex flex-col">
                <CustomText textSize="lg" textVariant="primary">
                  {profile.fullName}
                </CustomText>
                <CustomText textSize="xsm" textVariant="secondary">
                  {user.email}
                </CustomText>
              </span>

              {/* <button onClick={uploadAvatar}>Save</button> */}
            </span>
          </span>
          <LineDivider heightClass="my-4" />
          <motion.div
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col gap-4"
          >
            <PersonalDetailsSection
              onClick={onUpdate}
              isDirty={isCityDirty}
              register={register}
              isSubmitting={isSubmitting}
              iconSpecs={iconSpecs}
              profile={profile}
              email={user.email ?? ""}
              editing={editing}
              setEditing={setEditing}
              onCancel={() => setEditing(null)}
            />
            <LineDivider heightClass="my-0" />
            <SecurityDetailsCard
              iconSpecs={iconSpecs}
              editing={editing}
              setEditing={() => setEditing("security")}
              actionBtns={{
                onClick: location.formBtns.onClick,
                isDirty: !!dirtyFields.password,
                isSubmitting: isSubmitting,
                onCancel: () => setEditing(null),
              }}
              hasValue={!!watch("password")}
              error={errors.password?.message}
              isTouched={!!touchedFields.password}
              register={register("password")}
              onClick={location.formBtns.onClick}
            />
            <LineDivider heightClass="my-0" />
            <LocationSection
              iconSpecs={iconSpecs}
              formLocation={location}
              editing={editing}
              setEditing={() => setEditing("location")}
              formBtn={{
                onClick: location.formBtns.onClick,
                isSubmitting: location.formBtns.isSubmitting,
                isDirty: location.city.isDirty || location.country.isDirty,
                onCancel: location.formBtns.onCancel,
              }}
            />
          </motion.div>
        </form>
      </Card>
    </DefaultContainer>
  );
}
type LocationSectionProps = {
  iconSpecs: IconSpecs;
  formLocation: LocationProps;
  formBtn: ActionButtonProps;
  editing: ProfileSection | null;
  setEditing: (v: ProfileSection | null) => void;
};

function LocationSection({
  formLocation,
  formBtn,
  iconSpecs,
  editing,
  setEditing,
}: LocationSectionProps) {
  const { city: formCity, country: formCountry } = formLocation;
  const { onCancel, isSubmitting, isDirty, onClick } = formBtn;
  const isEditing = editing === "location";
  return (
    <div className={`flex flex-col ${isEditing ? "gap-5" : "gap-3"}`}>
      <SectionHeader
        title={"Your location"}
        icon={
          <MapPin
            className={iconSpecs.className}
            strokeWidth={iconSpecs.strokeWidth}
          />
        }
      />
      {!isEditing ? (
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <InfoRow label="Country" value={formCity.value} />
            <InfoRow label="City" value={formCountry.value} />
          </div>
          <EditBtn
            isEditing={isEditing}
            onEdit={() => setEditing("location")}
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duraton: 0.5 }}
        >
          <LocationEditForm
            city={formCity}
            country={formCountry}
            formBtns={{
              onClick: () => onClick(),
              isSubmitting: isSubmitting,
              isDirty: isDirty,
              onCancel: onCancel,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

type securityProps = {
  editing: ProfileSection | null;
  setEditing: () => void;
  actionBtns: ActionButtonProps;
  iconSpecs: IconSpecs;
  hasValue: boolean;
  error: string | undefined;
  isTouched: boolean;
  register: UseFormRegisterReturn;
  onClick: () => void;
};

function SecurityDetailsCard({
  editing,
  setEditing,
  actionBtns,
  hasValue,
  error,
  isTouched,
  register,
  iconSpecs,
  onClick,
}: securityProps) {
  const isEditing = editing === "security";
  return (
    <div className={`flex flex-col ${isEditing ? "gap-5" : "gap-3"}`}>
      <SectionHeader
        title="Security"
        icon={
          <ShieldHalf
            className={iconSpecs.className}
            strokeWidth={iconSpecs.strokeWidth}
          />
        }
      />

      {!isEditing ? (
        <div className="flex items-center justify-between">
          <InfoRow label="Password" value={"**********"} />
          <EditBtn isEditing={isEditing} onEdit={setEditing} />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <FloatingInputField
              className="w-full sm:max-w-[350px]"
              hasValue={hasValue}
              label="Password"
              type="password"
              error={error}
              isDirty={actionBtns.isDirty}
              isTouched={isTouched}
              {...register}
            />
            <FloatingInputField
              className="w-full sm:max-w-[350px]"
              hasValue={hasValue}
              label="confirm Password"
              type="password"
              error={error}
              isDirty={actionBtns.isDirty}
              isTouched={isTouched}
              {...register}
            />
          </div>
          <ActionButton
            onClick={onClick}
            isSubmitting={actionBtns.isSubmitting}
            isDirty={actionBtns.isDirty}
            onCancel={actionBtns.onCancel}
          />
        </>
      )}
    </div>
  );
}

function PersonalDetailsSection({
  profile,
  email,
  editing,
  setEditing,
  onCancel,
  isSubmitting,
  register,
  isDirty,
  iconSpecs,
  onClick,
}: {
  isSubmitting: boolean;
  isDirty: boolean;
  profile: UserProfile;
  email: string;
  iconSpecs: IconSpecs;
  editing: ProfileSection | null;
  onCancel: () => void;
  setEditing: (s: ProfileSection | null) => void;
  register: UseFormRegister<UserDetailsFields>;
  onClick: () => void;
}) {
  const isEditing = editing === "personal";

  return (
    <div className={`flex flex-col ${isEditing ? "gap-5" : "gap-3"}`}>
      <SectionHeader
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
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <InfoRow
                label="Full name"
                value={profile.fullName?.split(" ")[0]}
              />
              <InfoRow
                label="Last name"
                value={profile.fullName?.split(" ")[1]}
              />

              <InfoRow label="Email address" value={email} />
              <InfoRow label="Phone" value={profile.phoneNumber} />
            </div>
            <EditBtn
              isEditing={isEditing}
              onEdit={() => setEditing("personal")}
            />
          </div>
        ) : (
          <motion.div>
            <PersonalEditForm
              register={register}
              isSubmitting={isSubmitting}
              onCancel={onCancel}
              isDirty={isDirty}
              onClick={onClick}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex gap-2 items-center">
        {icon}
        <CustomText as="h3" textVariant="primary" textSize="lg">
          {title}
        </CustomText>
      </span>
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
  return (
    !isEditing && (
      <button
        onClick={onEdit}
        className="text-sm text-primary-600 hover:underline"
      >
        Edit
      </button>
    )
  );
}

function LocationEditForm({ country, city, formBtns }: LocationProps) {
  const { isDirty, isSubmitting, onCancel } = formBtns;
  return (
    <span className="flex flex-col gap-5">
      <span className="flex gap-7">
        <DropDownMenu
          className="rounded-md"
          placeholder={"Select country"}
          menuItems={["UK", "NL"]}
          value={country.value}
          error={country.error}
          isDirty={country.isDirty}
          isTouched={country.isTouched}
          register={country.register}
        />

        <DropDownMenu
          className="rounded-md"
          placeholder={"Select city"}
          menuItems={["London", "Harare", "Amsterdam"]}
          value={city.value}
          error={city.error}
          isDirty={city.isDirty}
          isTouched={city.isTouched}
          register={city.register}
        />
      </span>

      <ActionButton
        onClick={formBtns.onClick}
        isSubmitting={isSubmitting}
        isDirty={isDirty}
        onCancel={onCancel}
      />
    </span>
  );
}

function PersonalEditForm({
  isSubmitting,
  register,
  onCancel,
  isDirty,
  onClick,
}: {
  register: UseFormRegister<UserDetailsFields>;
  isSubmitting: boolean;
  isDirty: boolean;
  onCancel: () => void;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <span className="flex gap-6 items-center">
        <FloatingInputField
          hasValue={false}
          label="Full name"
          isDirty={false}
          isTouched={false}
          {...register("firstName")}
        />
        <FloatingInputField
          hasValue={false}
          label="last name"
          isDirty={false}
          isTouched={false}
          {...register("lastName")}
        />
      </span>
      <FloatingInputField
        className="w-full sm:max-w-[350px]"
        hasValue={false}
        label="Email address"
        isDirty={false}
        isTouched={false}
        {...register("emailAddress")}
      />
      <FloatingInputField
        className="w-full sm:max-w-[220px]"
        hasValue={false}
        label="Phone number"
        isDirty={false}
        isTouched={false}
        {...register("phoneNumber")}
      />
      <ActionButton
        onClick={onClick}
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        onCancel={onCancel}
      />
    </div>
  );
}

type ActionButtonProps = {
  isSubmitting: boolean;
  onClick: () => void;
  isDirty: boolean;
  onCancel: () => void;
};

function ActionButton({
  isSubmitting,
  onClick,
  isDirty,
  onCancel,
}: ActionButtonProps) {
  return (
    <div className="mt-4 flex justify-end gap-3">
      <Button type="button" variant="neutral" onClick={onCancel} size={"sm"}>
        Cancel
      </Button>
      <Button onClick={onClick} type="button" variant="primary" size={"sm"}>
        {isSubmitting ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[150px_auto] gap-y-1 sm:gap-x-6">
      <CustomText textVariant="label" textSize="xsm">
        {label}
      </CustomText>
      <CustomText textVariant="primary">{value ?? "—"}</CustomText>
    </div>
  );
}
export function AvatarPicker({ preview, handleFileChange }: AvatarProps) {
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

      {preview && (
        <span
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="relative inline-flex justify-center items-center"
        >
          <img
            src={preview}
            alt="Preview"
            className="h-16 w-16 border border-neutral-300 rounded-full"
          />

          <AnimatePresence>
            {isHovering && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                type="button"
                onClick={openFileDialog}
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
      )}

      <button
        type="button"
        onClick={openFileDialog}
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
