import { z } from "zod";

const addMenuItemSchema = z.object({
  id: z
    .string({ message: "Id must be string"  })
    .uuid({ message: "Invalid restaurant id" }),
  name: z
    .string()
    .trim()
    .min(2, "Menu item name must be at least 2 characters")
    .max(100, "Menu item cannot exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description too long")
    .nullable()
    .optional(),
  price: z.coerce
    .number()
    .positive({ message: "Price must be greater than 0." })
    .max(50000, { message: "Price seems unreasonably high" })
    .refine((val) => Number.isInteger(val * 100), {
      message: "Price can have at most 2 decimal places.",
    }),
});

export default addMenuItemSchema;
