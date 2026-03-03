import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only to prevent import errors in test environment
vi.mock("server-only", () => ({}));

// Mock jose
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn(),
  })),
  jwtVerify: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Import after mocks
import { createSession, getSession, deleteSession, verifySession } from "../auth";
import type { SessionPayload } from "../auth";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Get references to the mocked functions
const MockedSignJWT = SignJWT as unknown as ReturnType<typeof vi.fn>;
const mockedJwtVerify = jwtVerify as unknown as ReturnType<typeof vi.fn>;
const mockedCookies = cookies as unknown as ReturnType<typeof vi.fn>;

describe("auth", () => {
  let mockSign: ReturnType<typeof vi.fn>;
  let mockCookieSet: ReturnType<typeof vi.fn>;
  let mockCookieGet: ReturnType<typeof vi.fn>;
  let mockCookieDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset and setup mocks
    mockSign = vi.fn();
    mockCookieSet = vi.fn();
    mockCookieGet = vi.fn();
    mockCookieDelete = vi.fn();

    // Configure SignJWT mock
    MockedSignJWT.mockImplementation(() => ({
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: mockSign,
    }));

    // Configure cookies mock
    mockedCookies.mockResolvedValue({
      set: mockCookieSet,
      get: mockCookieGet,
      delete: mockCookieDelete,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createSession", () => {
    it("creates a session with valid user data", async () => {
      const userId = "user123";
      const email = "test@example.com";
      const mockToken = "mock-jwt-token";

      mockSign.mockResolvedValue(mockToken);

      await createSession(userId, email);

      // Verify JWT was created
      expect(mockSign).toHaveBeenCalledTimes(1);

      // Verify cookie was set with correct parameters
      expect(mockCookieSet).toHaveBeenCalledTimes(1);
      const cookieCall = mockCookieSet.mock.calls[0];

      expect(cookieCall[0]).toBe("auth-token");
      expect(cookieCall[1]).toBe(mockToken);
      expect(cookieCall[2]).toMatchObject({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      expect(cookieCall[2].expires).toBeInstanceOf(Date);
    });

    it("sets secure cookie in production environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      mockSign.mockResolvedValue("mock-token");

      await createSession("user123", "test@example.com");

      const cookieCall = mockCookieSet.mock.calls[0];
      expect(cookieCall[2].secure).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it("does not set secure cookie in development", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      mockSign.mockResolvedValue("mock-token");

      await createSession("user123", "test@example.com");

      const cookieCall = mockCookieSet.mock.calls[0];
      expect(cookieCall[2].secure).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });

    it("sets expiration to 7 days from now", async () => {
      const beforeTime = Date.now();
      mockSign.mockResolvedValue("mock-token");

      await createSession("user123", "test@example.com");

      const afterTime = Date.now();
      const cookieCall = mockCookieSet.mock.calls[0];
      const expiresTime = cookieCall[2].expires.getTime();

      // Expiration should be approximately 7 days from now
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      expect(expiresTime).toBeGreaterThanOrEqual(beforeTime + sevenDays);
      expect(expiresTime).toBeLessThanOrEqual(afterTime + sevenDays + 1000); // +1s tolerance
    });
  });

  describe("getSession", () => {
    it("returns session data when valid token exists", async () => {
      const mockToken = "valid-token";
      const mockPayload: SessionPayload = {
        userId: "user123",
        email: "test@example.com",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      mockCookieGet.mockReturnValue({ value: mockToken });
      mockedJwtVerify.mockResolvedValue({ payload: mockPayload });

      const session = await getSession();

      expect(session).toEqual(mockPayload);
      expect(mockCookieGet).toHaveBeenCalledWith("auth-token");
      expect(mockedJwtVerify).toHaveBeenCalled();
      expect(mockedJwtVerify).toHaveBeenCalledTimes(1);
    });

    it("returns null when no token exists", async () => {
      mockCookieGet.mockReturnValue(undefined);

      const session = await getSession();

      expect(session).toBeNull();
      expect(mockedJwtVerify).not.toHaveBeenCalled();
    });

    it("returns null when token verification fails", async () => {
      const mockToken = "invalid-token";

      mockCookieGet.mockReturnValue({ value: mockToken });
      mockedJwtVerify.mockRejectedValue(new Error("Invalid token"));

      const session = await getSession();

      expect(session).toBeNull();
      expect(mockedJwtVerify).toHaveBeenCalled();
      expect(mockedJwtVerify).toHaveBeenCalledTimes(1);
    });

    it("returns null when token is expired", async () => {
      const mockToken = "expired-token";

      mockCookieGet.mockReturnValue({ value: mockToken });
      mockedJwtVerify.mockRejectedValue(new Error("Token expired"));

      const session = await getSession();

      expect(session).toBeNull();
    });
  });

  describe("deleteSession", () => {
    it("deletes the auth cookie", async () => {
      await deleteSession();

      expect(mockCookieDelete).toHaveBeenCalledWith("auth-token");
      expect(mockCookieDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("verifySession", () => {
    it("returns session data when valid token exists in request", async () => {
      const mockToken = "valid-token";
      const mockPayload: SessionPayload = {
        userId: "user123",
        email: "test@example.com",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: mockToken }),
        },
      } as any;

      mockedJwtVerify.mockResolvedValue({ payload: mockPayload });

      const session = await verifySession(mockRequest);

      expect(session).toEqual(mockPayload);
      expect(mockRequest.cookies.get).toHaveBeenCalledWith("auth-token");
      expect(mockedJwtVerify).toHaveBeenCalled();
      expect(mockedJwtVerify).toHaveBeenCalledTimes(1);
    });

    it("returns null when no token exists in request", async () => {
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue(undefined),
        },
      } as any;

      const session = await verifySession(mockRequest);

      expect(session).toBeNull();
      expect(mockedJwtVerify).not.toHaveBeenCalled();
    });

    it("returns null when token verification fails", async () => {
      const mockToken = "invalid-token";

      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: mockToken }),
        },
      } as any;

      mockedJwtVerify.mockRejectedValue(new Error("Invalid token"));

      const session = await verifySession(mockRequest);

      expect(session).toBeNull();
      expect(mockedJwtVerify).toHaveBeenCalled();
      expect(mockedJwtVerify).toHaveBeenCalledTimes(1);
    });

    it("returns null when token signature is invalid", async () => {
      const mockToken = "tampered-token";

      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: mockToken }),
        },
      } as any;

      mockedJwtVerify.mockRejectedValue(new Error("Signature verification failed"));

      const session = await verifySession(mockRequest);

      expect(session).toBeNull();
    });
  });

  describe("SessionPayload interface", () => {
    it("has the correct structure", () => {
      const payload: SessionPayload = {
        userId: "test-user-id",
        email: "test@example.com",
        expiresAt: new Date(),
      };

      expect(payload).toHaveProperty("userId");
      expect(payload).toHaveProperty("email");
      expect(payload).toHaveProperty("expiresAt");
      expect(payload.expiresAt).toBeInstanceOf(Date);
    });
  });
});
