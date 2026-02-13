import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("raspiSystem.getMetrics", () => {
  it("returns system metrics with required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.raspiSystem.getMetrics();

    expect(result).toBeDefined();
    expect(typeof result.cpu).toBe("number");
    expect(result.memory).toBeDefined();
    expect(typeof result.memory.total).toBe("number");
    expect(typeof result.memory.used).toBe("number");
    expect(typeof result.memory.usagePercent).toBe("number");
    expect(result.disk).toBeDefined();
    expect(typeof result.uptime).toBe("number");
    expect(typeof result.hostname).toBe("string");
  });
});

describe("raspiSystem.getNetworkInfo", () => {
  it("returns network interfaces", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.raspiSystem.getNetworkInfo();

    expect(result).toBeDefined();
    expect(Array.isArray(result.interfaces)).toBe(true);
    expect(result.wifiStatus).toBeDefined();
  });
});
