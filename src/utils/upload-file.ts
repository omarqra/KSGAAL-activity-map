import { Client } from "@/configs/api";

export const uploadFile = async (file: File): Promise<string> => {
  if (!file) return "";

  const res = await Client.admin().upload.uploadImage(
    {
      file,
    },
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  // @ts-expect-error - //!! Should add a type for the response
  return res.data?.path;
};
