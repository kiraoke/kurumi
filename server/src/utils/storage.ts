import { createClient } from "npm:@supabase/supabase-js@2";
import { seed } from "./constants.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadImage(file: File): Promise<string> {
  const path = `pfp/${seed()} ${file.name}`;
  const { error } = await supabase.storage.from("images").upload(
    path,
    file,
  );

  if (error) throw error;

  const fileUrl = `${supabaseUrl}/storage/v1/object/public/images/${path}`;

  return fileUrl;
  // for (let attempt = 0; attempt < 3; attempt++) {
  //   try {
  //   } catch (error) {
  //     console.error("Error uploading image to Cloudinary:", error);
  //     if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 50));
  //   }
  // }
  //
  // throw new Error("Failed to upload image after multiple attempts", {
  //   cause: 500,
  // });
}
