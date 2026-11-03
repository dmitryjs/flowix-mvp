import { z } from "zod";
import { idSchema } from "./contracts.ts";

const principalSchema = z.strictObject({
  userId: idSchema,
  expiresAt: z.number().int().nonnegative(),
});
const membershipSchema = z.strictObject({
  userId: idSchema,
  workspaceId: idSchema,
  role: z.enum(["owner", "editor", "viewer"]),
  status: z.enum(["active", "revoked"]),
});
const actionSchema = z.enum(["read", "write", "manage_members"]);

/** Authorization policy only. Caller must verify identity and load membership from
 * the database. Never pass membership, role or principal from a request body/JWT user_metadata.
 */
export function canAccessWorkspace(
  principalInput: unknown, membershipInput: unknown,
  workspaceId: unknown, actionInput: unknown, now: number,
): boolean {
  const principal = principalSchema.safeParse(principalInput);
  const member = membershipSchema.safeParse(membershipInput);
  const workspace = idSchema.safeParse(workspaceId);
  const action = actionSchema.safeParse(actionInput);
  if (!principal.success || !member.success || !workspace.success || !action.success
    || !Number.isSafeInteger(now) || now < 0) return false;
  if (principal.data.expiresAt <= now || member.data.status !== "active"
    || member.data.userId !== principal.data.userId
    || member.data.workspaceId !== workspace.data) return false;
  if (action.data === "read") return true;
  if (action.data === "write") return member.data.role !== "viewer";
  return member.data.role === "owner";
}
