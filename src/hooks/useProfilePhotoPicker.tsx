"use client";

import { useRef, useState } from "react";

import { ProfilePhotoCropper } from "@/components/profile/ProfilePhotoCropper";
import {
  checkProfilePhotoMinResolution,
  PROFILE_PHOTO_ACCEPT,
  validateProfilePhotoSourceFile,
} from "@/lib/profilePhoto";

/**
 * Pick → source checks → square crop → a small JPEG handed to `onFileReady`.
 *
 * Every photo upload goes through this one pipeline. The tutor onboarding
 * wizard used to send the raw file (up to 5 MB, full camera resolution)
 * while every other path sent a 512×512 crop; the raw path was the one that
 * failed intermittently against storage limits and timeouts.
 */
export function useProfilePhotoPicker(onFileReady: (file: File) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [pendingCrop, setPendingCrop] = useState<{ src: string; maxZoom: number } | null>(
    null
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSourceError(null);

    const typeOrSizeError = validateProfilePhotoSourceFile(file);
    if (typeOrSizeError) {
      setSourceError(typeOrSizeError);
      return;
    }

    const resolutionCheck = await checkProfilePhotoMinResolution(file);
    if (!resolutionCheck.ok) {
      setSourceError(resolutionCheck.error);
      return;
    }

    setPendingCrop({ src: resolutionCheck.objectUrl, maxZoom: resolutionCheck.maxZoom });
  };

  const closeCrop = () => {
    if (pendingCrop) URL.revokeObjectURL(pendingCrop.src);
    setPendingCrop(null);
  };

  const pickerElements = (
    <>
      <input
        type="file"
        accept={PROFILE_PHOTO_ACCEPT}
        hidden
        ref={inputRef}
        onChange={handleFileChange}
      />
      {pendingCrop && (
        <ProfilePhotoCropper
          open
          imageSrc={pendingCrop.src}
          maxZoom={pendingCrop.maxZoom}
          onCancel={closeCrop}
          onCropped={(file) => {
            closeCrop();
            onFileReady(file);
          }}
        />
      )}
    </>
  );

  return {
    openPicker: () => inputRef.current?.click(),
    pickerElements,
    sourceError,
  };
}
