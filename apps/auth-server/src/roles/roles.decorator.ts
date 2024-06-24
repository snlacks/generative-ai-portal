import { SetMetadata } from "@nestjs/common";
import { ROLE } from "./roles";
export const ROLES_KEY = "roles";

export const Roles = (...roles: ROLE[]) => SetMetadata(ROLES_KEY, roles);
