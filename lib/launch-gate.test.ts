import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveLaunchRoute } from "./launch-gate";
import { getConsentGiven, getOnboardingComplete } from "@/lib/storage";

vi.mock("@/lib/storage", () => ({
  getConsentGiven: vi.fn(),
  getOnboardingComplete: vi.fn(),
}));

const mockConsent = vi.mocked(getConsentGiven);
const mockOnboarding = vi.mocked(getOnboardingComplete);

describe("resolveLaunchRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
