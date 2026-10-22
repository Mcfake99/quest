import { createMiddleware } from "@tanstack/react-start";

/** Thrown for anyone who is not an admin — deliberately indistinguishable from a missing page. */
export class AdminNotFoundError extends Error {
  constructor() {
    super("Not found");
    this.name = "AdminNotFoundError";
  }
}

/**
 * Server-enforced admin gate for every admin server function: the caller must
 * have a verified session whose email is listed in ADMIN_EMAILS. Anything else
 * (signed out, not listed, ADMIN_EMAILS unset) -> "Not found".
 */
export const adminMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const { isAdminEmail } = await import("./access");
    assertSameSiteRequest();
    const user = await getSessionUser(context.bearerToken).catch(() => null);
    if (!user || !isAdminEmail(user.email, process.env.ADMIN_EMAILS)) {
      const { setResponseStatus } = await import("@tanstack/react-start/server");
      setResponseStatus(404);
      throw new AdminNotFoundError();
    }
    return next({ context: { adminUserId: user.id, adminEmail: user.email } });
  });
