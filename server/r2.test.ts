import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const s3SendMock = vi.fn();
vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: vi.fn().mockImplementation(() => ({
      send: s3SendMock,
    })),
    GetObjectCommand: vi.fn().mockImplementation((args) => ({ type: "GetObject", ...args })),
    PutObjectCommand: vi.fn().mockImplementation((args) => ({ type: "PutObject", ...args })),
  };
});

const ENV_KEYS = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_R2_BUCKET",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
] as const;

function withR2Env() {
  process.env.CLOUDFLARE_ACCOUNT_ID = "acct-1";
  process.env.CLOUDFLARE_R2_BUCKET = "bucket-1";
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key-1";
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret-1";
}

function clearR2Env() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe("r2 module (R2 disabled — no env vars)", () => {
  beforeEach(() => {
    vi.resetModules();
    clearR2Env();
    s3SendMock.mockReset();
  });

  it("R2_ENABLED is false", async () => {
    const { R2_ENABLED } = await import("./r2");
    expect(R2_ENABLED).toBe(false);
  });

  it("r2Get returns null and doesn't call S3", async () => {
    const { r2Get } = await import("./r2");
    const result = await r2Get("some-file");
    expect(result).toBeNull();
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("r2Put returns false and doesn't call S3", async () => {
    const { r2Put } = await import("./r2");
    const result = await r2Put("some-file", Buffer.from("data"));
    expect(result).toBe(false);
    expect(s3SendMock).not.toHaveBeenCalled();
  });
});

describe("r2 module (R2 enabled — env vars set)", () => {
  beforeEach(() => {
    vi.resetModules();
    withR2Env();
    s3SendMock.mockReset();
  });

  afterEach(() => {
    clearR2Env();
  });

  it("R2_ENABLED is true", async () => {
    const { R2_ENABLED } = await import("./r2");
    expect(R2_ENABLED).toBe(true);
  });

  it("r2Get returns file content buffer on successful fetch", async () => {
    const mockBytes = new Uint8Array([1, 2, 3, 4]);
    s3SendMock.mockResolvedValueOnce({
      Body: {
        transformToByteArray: async () => mockBytes,
      },
    });

    const { r2Get } = await import("./r2");
    const result = await r2Get("some-file");
    expect(result).toEqual(Buffer.from([1, 2, 3, 4]));
    expect(s3SendMock).toHaveBeenCalledTimes(1);
  });

  it("r2Get returns null on NoSuchKey error", async () => {
    const err = new Error("Not Found");
    err.name = "NoSuchKey";
    s3SendMock.mockRejectedValueOnce(err);

    const { r2Get } = await import("./r2");
    const result = await r2Get("missing-file");
    expect(result).toBeNull();
  });

  it("r2Get returns null on general error", async () => {
    s3SendMock.mockRejectedValueOnce(new Error("Network Error"));

    const { r2Get } = await import("./r2");
    const result = await r2Get("error-file");
    expect(result).toBeNull();
  });

  it("r2Put uploads buffer successfully", async () => {
    s3SendMock.mockResolvedValueOnce({});

    const { r2Put } = await import("./r2");
    const result = await r2Put("upload-file", Buffer.from("hello"));
    expect(result).toBe(true);
    expect(s3SendMock).toHaveBeenCalledTimes(1);
  });

  it("r2Put returns false on upload error", async () => {
    s3SendMock.mockRejectedValueOnce(new Error("Upload failed"));

    const { r2Put } = await import("./r2");
    const result = await r2Put("upload-file", Buffer.from("hello"));
    expect(result).toBe(false);
  });
});
