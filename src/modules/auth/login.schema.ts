import { z } from "zod";

export const loginBodySchema = z.object({
    email: z
        .string()
        .min(1, "Email is required and must be a non-empty string."),
    password: z
        .string()
        .min(1, "Password is required and must be a non-empty string."),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
