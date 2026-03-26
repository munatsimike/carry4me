import { Card } from "@/app/components/card/Card";
import FloatingInputField from "@/app/components/CustomInputField";
import { useToast } from "@/app/components/Toast";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { SignUpUseCase } from "@/app/shared/Authentication/application/SignUpUseCase";
import { SupabaseAuthRepository } from "@/app/shared/data/SupabaseAuthRepository";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { Button } from "@/components/ui/Button";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useForm,
  type FieldNamesMarkedBoolean,
  type UseFormRegister,
  type FieldErrors,
  type UseFormWatch,
  Controller,
  type Control,
} from "react-hook-form";
import { UserDetailsScema, type UserDetailsFields } from "../UI/SignUpPage";
import LineDivider from "@/app/components/LineDivider";
import type { UserProfile } from "../domain/authTypes";
import CustomText from "@/components/ui/CustomText";
import { MapPin, ShieldHalf, User2 } from "lucide-react";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { UpdateProfileUseCase } from "../application/UpdateProfileUseCase";
import { UpdateAuthDetailsUseCase } from "../application/UpdateAuthDetailsUseCase";
import { DeleteAvatarUseCase } from "../application/DeleteAvatarUseCase";
import ComboBox from "@/app/components/ComboBox";
import { useUniversalModal } from "../application/DialogBoxModalProvider";

type AvatarProps = {
  onDelete: () => void;
  preview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement, Element>) => void;
};

type ProfileSection = "personal" | "location" | "security";

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

export default function ProfilePage() {
  const [editing, setEditing] = useState<ProfileSection | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { user, refreshProfile, profile } = useAuth();
  const { toast } = useToast();
  const {showSupabaseError} = useUniversalModal()

  const {
    control,
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
    mode: "onTouched",
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
  //  Hook must be BEFORE any conditional return
  useEffect(() => {
    // If user picked a file, don't overwrite their local preview
    if (file) return;

    const url = profile?.avatarUrl ?? null;
    setPreview(url);
  }, [profile?.avatarUrl, file]);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 text-center border border-gray-100">
          <div className="mb-4 text-4xl">🔐</div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            You’re not signed in
          </h2>

          <p className="text-gray-500 mb-6">
            Please sign in to manage your trips and parcels.
          </p>

          <div className="flex gap-3 justify-center">
            <Button variant={"neutral"} size={"md"}>
              Create account
            </Button>

            <Button variant={"primary"} size={"md"}>
              Sign
            </Button>
          </div>
        </div>
      </div>
    );
  }
  // If profile can be null (row missing), don't blank the whole page:
  if (!profile) return <div className="p-6">Setting up your profile…</div>;

  const updateAvatar = async () => {
    if (!file) return;
    const result = await upLoadAvatrUseCase.uploadAvatar(user.id, file);
    if (!result.success) {
      return;
    }

    toast("Profile pic changed successfully", { variant: "success" });
    await refreshProfile();
  };

  const onDeleteAvatar = async () => {
    if (!profile.avatarUrl) return;

    const {result} = await namedCall(
      "delete avatar",
      deleteAvatarUseCase.execute(user.id, profile.avatarUrl),
    );
    if (!result.success) {
        showSupabaseError(result.error)
    }
    // delete in storage + db...
    setFile(null);
    setPreview(null);
    await refreshProfile();
    toast("profile pic deleted", { variant: "success" });
  };

  const onUpdateProfile = async () => {
    if (editing === "security") {
      const values = getValues();

      const wantsEmailChange = !!dirtyFields.emailAddress;
      const wantsPasswordChange =
        !!dirtyFields.password ||
        !!dirtyFields.confirmPassword ||
        !!values.password?.trim() ||
        !!values.confirmPassword?.trim();

      const isDirty = wantsEmailChange || wantsPasswordChange;

      if (!isDirty) {
        toast("Make changes to update profile", { variant: "warning" });
        return;
      }

      if (wantsEmailChange) {
        const ok = await trigger("emailAddress");
        if (!ok) return;
      }

      if (wantsPasswordChange) {
        const ok = await trigger(["password", "confirmPassword"]);
        if (!ok) return;
      }

      const email = dirtyFields.emailAddress ? values.emailAddress : undefined;
      const password = dirtyFields.password ? values.password : undefined;

      const {result} = await namedCall(
        "security update",
        updateAuthDetails.excute(email, password),
      );

      if (!result.success) {
        showSupabaseError(result.error)
      }
    }

    if (editing === "personal" || editing === "location") {
      const personalDetails: Array<keyof UserDetailsFields> = [
        "firstName",
        "lastName",
        "city",
        "country",
        "phoneNumber",
      ];

      if (!isPersonalDirty(dirtyFields)) {
        toast("Make changes to update profile", { variant: "warning" });
        return;
      }
      const ok = await trigger(personalDetails);

      if (!ok) return;
      const values = getValues();

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
    }
  };

  const iconSpecs: IconSpecs = {
    className: "h-6 w-6 text-neutral-400",
    strokeWidth: 1.5,
  };

  return (
    <DefaultContainer outerClassName="bg-canvas min-h-screen">
      <CustomText
        textSize="xl"
        textVariant="primary"
        className="pl-4 pb-4 font-medium"
      >
        Profile & Security
      </CustomText>
      <Card enableHover={false} className="mx-auto w-full max-w-2xl" paddingClass="p-8 px-10">
        <CardHeaderSection
          avatar={profile.avatarUrl ?? ""}
          file={file}
          preview={preview}
          fullName={profile.fullName ?? ""}
          email={user.email ?? ""}
          setFile={setFile}
          setPreview={setPreview}
          updateAvatar={updateAvatar}
          onDelete={onDeleteAvatar}
        />
        <form onSubmit={(e) => e.preventDefault()} autoComplete="off">
          <LineDivider heightClass="my-4" />
          <motion.div
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col gap-4"
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
            />
            <LineDivider heightClass="my-0" />
            <SecurityDetailsCard
              email={user.email ?? ""}
              iconSpecs={iconSpecs}
              editing={editing}
              setEditing={() => setEditing("security")}
              watch={watch}
              error={errors}
              register={register}
              onClick={onUpdateProfile}
              dirtyFields={dirtyFields}
              touchedFields={dirtyFields}
              actionBtns={{
                onClick: () => onUpdateProfile(),
                onCancel: () => setEditing(null),
              }}
            />
            <LineDivider heightClass="my-0" />
            <LocationSection
              control={control}
              iconSpecs={iconSpecs}
              editing={editing}
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
          </motion.div>
        </form>
      </Card>
    </DefaultContainer>
  );
}
type LocationSectionProps = {
  iconSpecs: IconSpecs;
  control: Control<UserDetailsFields>;
  formProps: FormProps;
  formBtn: ActionButtonProps;
  editing: ProfileSection | null;
  setEditing: (v: ProfileSection | null) => void;
};

function LocationSection({
  formProps,
  formBtn,
  control,
  iconSpecs,
  editing,
  setEditing,
}: LocationSectionProps) {
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
            <InfoRow label="Country" value={formProps.watch("country")} />
            <InfoRow label="City" value={formProps.watch("city")} />
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
          <LocationEditForm control={control} formBtns={formBtn} />
        </motion.div>
      )}
    </div>
  );
}

type securityProps = {
  email: string;
  editing: ProfileSection | null;
  setEditing: () => void;
  actionBtns: ActionButtonProps;
  iconSpecs: IconSpecs;
  watch: UseFormWatch<UserDetailsFields>;
  error: FieldErrors<UserDetailsFields>;
  dirtyFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  touchedFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  register: UseFormRegister<UserDetailsFields>;
  onClick: () => void;
};

function SecurityDetailsCard({
  email,
  editing,
  setEditing,
  actionBtns,
  watch,
  error,
  register,
  iconSpecs,
  onClick,
  dirtyFields,
  touchedFields,
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
          <div className="flex flex-col gap-2">
            <InfoRow label="Email address" value={email} />
            <InfoRow label="Password" value={"**********"} />
          </div>
          <EditBtn isEditing={isEditing} onEdit={setEditing} />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <FloatingInputField
              autoComplete="email"
              className="w-full sm:max-w-[350px]"
              hasValue={!!watch("emailAddress")}
              label="Email address"
              isDirty={!!dirtyFields.emailAddress}
              isTouched={!!touchedFields.emailAddress}
              {...register("emailAddress")}
            />
            <FloatingInputField
              className="w-full sm:max-w-[350px]"
              autoComplete="new-password"
              hasValue={!!watch("password")}
              label="Password"
              type="password"
              error={error.password?.message}
              isDirty={!!dirtyFields.password}
              isTouched={!!touchedFields.password}
              {...register("password")}
            />
            <FloatingInputField
              className="w-full sm:max-w-[350px]"
              hasValue={!!watch("confirmPassword")}
              label="confirm Password"
              type="password"
              error={error.confirmPassword?.message}
              isDirty={!!dirtyFields.password}
              isTouched={!!touchedFields.password}
              {...register("confirmPassword")}
            />
          </div>
          <ActionButton onClick={onClick} onCancel={actionBtns.onCancel} />
        </>
      )}
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
              onCancel={onCancel}
              touchedFields={touchedFields}
              dirtyFields={dirtyFields}
              onClick={onClick}
              watch={watch}
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

type LocationEditFormProps = {
  control: Control<UserDetailsFields>;
  formBtns: ActionButtonProps;
};

function LocationEditForm({ control, formBtns }: LocationEditFormProps) {
  return (
    <span className="flex flex-col gap-5">
      <span className="flex gap-7">
        <Controller
          name="country"
          control={control}
          render={({ field, fieldState }) => (
            <ComboBox
              placeholder={"Select country"}
              menuItems={["UK", "NL"]}
              value={field.value}
              onValueChange={field.onChange}
              error={fieldState.error?.message}
              isDirty={fieldState.isDirty}
              isTouched={fieldState.isTouched}
            />
          )}
        ></Controller>

        <Controller
          name="country"
          control={control}
          render={({ field, fieldState }) => (
            <ComboBox
              placeholder={"Select city"}
              menuItems={["London", "Harare", "Amsterdam"]}
              value={field.value}
              onValueChange={field.onChange}
              error={fieldState.error?.message}
              isDirty={fieldState.isDirty}
              isTouched={fieldState.isTouched}
            />
          )}
        ></Controller>
      </span>

      <ActionButton onClick={formBtns.onClick} onCancel={formBtns.onCancel} />
    </span>
  );
}

function PersonalEditForm({
  touchedFields,
  dirtyFields,
  register,
  onCancel,
  onClick,
  watch,
}: {
  register: UseFormRegister<UserDetailsFields>;
  watch: UseFormWatch<UserDetailsFields>;
  touchedFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  dirtyFields: FieldNamesMarkedBoolean<UserDetailsFields>;
  onCancel: () => void;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <span className="flex gap-6 items-center">
        <FloatingInputField
          hasValue={!!watch("firstName")}
          label="Full name"
          isDirty={!!dirtyFields.firstName}
          isTouched={!!touchedFields.firstName}
          {...register("firstName")}
        />
        <FloatingInputField
          hasValue={!!watch("lastName")}
          label="last name"
          isDirty={!!dirtyFields.lastName}
          isTouched={!!touchedFields.lastName}
          {...register("lastName")}
        />
      </span>

      <FloatingInputField
        className="w-full sm:max-w-[220px]"
        hasValue={!!watch("phoneNumber")}
        label="Phone number"
        isDirty={!!dirtyFields.phoneNumber}
        isTouched={!!touchedFields.phoneNumber}
        {...register("phoneNumber")}
      />
      <ActionButton onClick={onClick} onCancel={onCancel} />
    </div>
  );
}

type ActionButtonProps = {
  onClick: () => void;
  onCancel: () => void;
};

function ActionButton({ onClick, onCancel }: ActionButtonProps) {
  return (
    <div className="mt-4 flex justify-end gap-3">
      <Button type="button" variant="neutral" onClick={onCancel} size={"sm"}>
        Cancel
      </Button>
      <Button onClick={onClick} type="button" variant="primary" size={"sm"}>
        {"Save changes"}
      </Button>
    </div>
  );
}
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[150px_auto] gap-y-1 sm:gap-x-6">
      <CustomText textVariant="label" textSize="sm">
        {label}
      </CustomText>
      <CustomText textVariant="primary">{value ?? "—"}</CustomText>
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
) {
  const nextFile = e.target.files?.[0];
  if (!nextFile) return;

  setFile(nextFile);

  const previewUrl = URL.createObjectURL(nextFile);
  setPreview(previewUrl);

  // Cleanup object URL to prevent memory leaks
  // (cleanup for previous object URL if any)
  return () => URL.revokeObjectURL(previewUrl);
}

type CardHeaderSectionProps = {
  avatar: string | null;
  preview: string | null;
  file: File | null;
  fullName: string;
  email: string;
  setFile: (s: File | null) => void;
  setPreview: (p: string) => void;
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
  updateAvatar,
}: CardHeaderSectionProps) {
  return (
    <span className="flex justify-center">
      <span>
        <AvatarPicker
          onDelete={onDelete}
          preview={preview}
          handleFileChange={(event) =>
            handleFileChange(event, setFile, setPreview)
          }
        />
      </span>

      <span className="flex flex-col gap-4 pl-4">
        <span className="inline-flex flex-col">
          <CustomText
            textSize="lg"
            textVariant="primary"
            className="font-medium"
          >
            {fullName}
          </CustomText>
          <CustomText textSize="xsm" textVariant="secondary">
            {email}
          </CustomText>
        </span>

        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: -7 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              exit={{ opacity: 0, y: 7 }}
              className="flex gap-2"
            >
              <Button
                onClick={() => setFile(null)}
                variant="neutral"
                size="xsm"
              >
                <CustomText textVariant="secondary" textSize="sm">
                  cancel
                </CustomText>
              </Button>
              <Button
                onClick={updateAvatar}
                type="button"
                variant={"primary"}
                size={"xsm"}
              >
                <CustomText textVariant="onDark" textSize="sm">
                  Save image
                </CustomText>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}

function isPersonalDirty(
  dirtyFields: FieldNamesMarkedBoolean<UserDetailsFields>,
): boolean {
  return [
    dirtyFields.firstName,
    dirtyFields.lastName,
    dirtyFields.phoneNumber,
    dirtyFields.city,
    dirtyFields.country,
  ].some(Boolean);
}
