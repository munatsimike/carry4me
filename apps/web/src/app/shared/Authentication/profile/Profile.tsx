import { useToast } from "@/app/components/Toast";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { SignUpUseCase } from "@/app/shared/Authentication/application/SignUpUseCase";
import { SupabaseAuthRepository } from "@/app/shared/data/SupabaseAuthRepository";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useMemo, useRef, useState } from "react";

type AvatarProps = {
  preview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement, Element>) => void;
};

export default function ProfilePage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { user, refreshProfile } = useAuth();
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  }
  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);
  const upLoadAvatrUseCase = useMemo(
    () => new SignUpUseCase(authRepo),
    [authRepo],
  );

  const { toast } = useToast();

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
 return <div className="flex flex-col gap-5 justify-center items-center">
    <AvatarPicker preview={preview} handleFileChange={handleFileChange} />

    <button onClick={uploadAvatar}>UpLoadAvatar</button>
  </div>;
}

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
