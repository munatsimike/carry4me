import DefaultContainer from "@/components/ui/DefualtContianer";
import { useMemo, useRef, useState } from "react";
import { SupabaseAuthRepository } from "../../data/SupabaseAuthRepository";
import { SignUpUseCase } from "../application/SignUpUseCase";
import type { AppUser } from "../domain/authTypes";
import { namedCall } from "../application/NamedCall";
import { useToast } from "@/app/components/Toast";
import { useAuth } from "../../supabase/AuthProvider";

export default function SignUpPage() {
  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);
  const signupUseCase = useMemo(() => new SignUpUseCase(authRepo), [authRepo]);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { user, refreshProfile } = useAuth();

  const upLoadAvatrUseCase = useMemo(
    () => new SignUpUseCase(authRepo),
    [authRepo],
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  }

  const { toast } = useToast();
  const newUser: AppUser = {
    auth: {
      id: null,
      email: "munatsimike@gmail.com",
      password: "Password123",
    },
    profile: {
      id: null,
      fullName: "Mike Munatsi",
      avatarUrl: null,
      countryCode: "NL",
      city: "Asterdam",
      phoneNumber: "064002364",
    },
  };

  const uploadAvatar = async () => {
    if (!user?.id || !file) return;
    const { result } = await namedCall(
      "avatar",
      upLoadAvatrUseCase.uploadAvatar(user.id, file),
    );

    if (!result.success) {
      console.log(result.error);
      return;
    }
    await refreshProfile();
  };

  const onSignUp = async (appuse: AppUser) => {
    const { result } = await namedCall(
      "signup",
      signupUseCase.execute(appuse, file),
    );
    if (!result.success) {
      if (typeof result.error === "string")
        toast(result.error, { variant: "error" });
    }

    if (result.success) {
      toast("singup success", { variant: "success" });
    }
  };

  return (
    <DefaultContainer>
      <div className="flex flex-col gap-5 justify-center items-center">
        <AvatarPicker preview={preview} handleFileChange={handleFileChange} />
        <button onClick={() => onSignUp(newUser)}>singup</button>
        <button onClick={uploadAvatar}>UpLoadAvatar</button>
      </div>
    </DefaultContainer>
  );
}

type AvatarProps = {
  preview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement, Element>) => void;
};

export function AvatarPicker({ preview, handleFileChange }: AvatarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function openFileDialog() {
    inputRef.current?.click();
  }
  return (
    <div>
      <button type="button" onClick={openFileDialog}>
        Choose Avatar
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />

      {preview && (
        <img
          src={preview}
          alt="Preview"
          style={{ width: 50, height: 50, borderRadius: "50%" }}
        />
      )}
    </div>
  );
}
