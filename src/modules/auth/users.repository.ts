import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

export const UserRepository = {
    async findByEmail(email: string) {
        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                passwordHash: users.passwordHash,
                role: users.role,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        return user ?? null;
    },

    async findById(id: number) {
        const [user] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        return user ?? null;
    },
};
