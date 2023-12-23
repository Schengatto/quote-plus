import { Tenant, User, UserRole } from "@prisma/client";

export interface AuthenticatedUser extends User {
    userRole: Partial<UserRole>;
    tenant: Partial<Tenant>;
}
