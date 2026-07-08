interface UploadEnvelope {
  data: { path: string } | null;
  error: { message: string; code?: string } | null;
}

/**
 * Upload an image to the local upload route and return its public path
 * (e.g. `/uploads/<uuid>.jpg`). Throws on failure so callers can surface an
 * error message.
 */
export const uploadFile = async (file: File): Promise<string> => {
  if (!file) return "";

  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: form,
  });
  const json = (await res.json()) as UploadEnvelope;
  if (!res.ok || json.error || !json.data) {
    throw new Error(json.error?.message ?? "upload_failed");
  }
  return json.data.path;
};
