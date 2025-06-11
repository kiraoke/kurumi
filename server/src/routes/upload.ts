import { Context, Hono } from "@hono/hono";
import authMiddleware from "../middlewares/authMiddleware.ts";

const uploadRoute = new Hono();
uploadRoute.use("*", authMiddleware);

// uploadRoute.post("/image", async (c: Context) => {
//   try {
//     const formData: FormData = await c.req.formData();
//     const imageFile = formData.get("image") as File;
//
//     if (!imageFile) {
//       throw new Error("Image file is required", { cause: 400 });
//     }
//
//     // Validate file type
//     if (!imageFile.type.startsWith("image/")) {
//       throw new Error("Invalid file type. Only image files are allowed.", {
//         cause: 400,
//       });
//     }
//
//     const url: string = await uploadImage(imageFile);
//
//     return c.json(
//       {
//         message: "Image uploaded successfully",
//         url: url,
//       },
//       200,
//     );
//   } catch (error) {
//     console.error("Error processing image upload:", (error as Error).message);
//     return c.json(
//       {
//         error: "Failed to process image upload",
//         message: (error as Error).message,
//       },
//       (error as Error).cause || 500,
//     );
//   }
// });

export default uploadRoute;
