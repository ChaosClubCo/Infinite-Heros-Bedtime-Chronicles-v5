import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveLaunchRoute } from "./launch-gate";
import { getConsentGiven } from "@/lib/consent-record";
import { getOnboardingComplete } from "@/lib/storage";
import { runStorageMigrations } from "@/lib/storage-migration";

vi.mock("@/lib/consent-record", () => ({
  getConsentGiven: vi.fn(),
}));
vi.mock("@/lib/storage", () => ({
  getOnboardingComplete: vi.fn(),
}));
vi.mock("@/lib/storage-migration", () => ({
  runStorageMigrations: vi.fn(),
}));

const mockConsent = vi.mocked(getConsentGiven);
const mockOnboarding = vi.mocked(getOnboardingComplete);
const mockMigrations = vi.mocked(runStorageMigrations);

describe("resolveLaunchRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMigrations.mockResolvedValue(undefined);
  });

  it("runs storage migrations before reading launch state", async () => {
    mockConsent.mockResolvedValue(true);
    mockOnboarding.mockResolvedValue(true);
    await resolveLaunchRoute();
    expect(mockMigrations).toHaveBeenCalledTimes(1);
  });

  it("uses the exact-copy consent verifier rather than the legacy storage helper", async () => {
    mockConsent.mockResolvedValue(false);
    mockOnboarding.mockResolvedValue(true);

    await expect(resolveLaunchRoute()).resolves.toBe("/parental-consent");
    expect(mockConsent).toHaveBeenCalledTimes(1);
  });

  it("fails safe to the consent gate when a migration throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockMigrations.mockRejectedValue(new Error("migration failed"));
    mockConsent.mockResolvedValue(true);
    mockOnboarding.mockResolvedValue(true);
    expect(await resolveLaunchRoute()).toBe("/parental-consent");
    errorSpy.mockRestore();
  });

  it("routes to the consent gate when consent has not been given", async () => {
    mockConsent.mockResolvedValue(false);
    mockOnboarding.mockResolvedValue(false);
    expect(await resolveLaunchRoute()).toBe("/parental-consent");
  });

  it("prioritizes consent over onboarding (COPPA)", async () => {
    mockConsent.mockResolvedValue(false);
    mockOnboarding.mockResolvedValue(true);
    expect(await resolveLaunchRoute()).toBe("/parental-consent");
  });

  it("routes to welcome when consented but not onboarded", async () => {
    mockConsent.mockResolvedValue(true);
    mockOnboarding.mockResolvedValue(false);
    expect(await resolveLaunchRoute()).toBe("/welcome");
  });

  it("routes to the tabs when consented and onboarded", async () => {
    mockConsent.mockResolvedValue(true);
    mockOnboarding.mockResolvedValue(true);
    expect(await resolveLaunchRoute()).toBe("/(tabs)");
  });

  it("fails safe to the consent gate when the consent read throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockConsent.mockRejectedValue(new Error("storage unavailable"));
    mockOnboarding.mockResolvedValue(true);
    expect(await resolveLaunchRoute()).toBe("/parental-consent");
    errorSpy.mockRestore();
  });

  it("fails safe to the consent gate when the onboarding read throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockConsent.mockResolvedValue(true);
    mockOnboarding.mockRejectedValue(new Error("storage unavailable"));
    expect(await resolveLaunchRoute()).toBe("/parental-consent");
    errorSpy.mockRestore();
  });
});
