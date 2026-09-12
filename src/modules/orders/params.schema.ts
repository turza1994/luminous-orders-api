import { z } from "zod";

export const userIdParamSchema = z.object({
    id: z.coerce
        .number()
        .int()
        .positive("User ID must be a positive integer."),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;
