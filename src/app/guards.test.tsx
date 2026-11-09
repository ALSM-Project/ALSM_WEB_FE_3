import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute, GuestRoute, AuthCallbackPage } from "./guards";
import { tokenStore } from "@/services/api/tokenStore";

const auth = vi.hoisted(() => ({
  user: { mustChangePassword: true },
  isAuthenticated: true,
  isLoading: false,
}));
vi.mock("./providers", () => ({
  useAuth: () => auth,
  getTargetHandoffUrl: () => null,
  redirectUserToPortal: vi.fn(),
}));
vi.mock("@/features/account/pages/ChangePasswordPage", () => ({
  ChangePasswordPage: () => <h1>Restricted password form</h1>,
}));

describe("restricted password routing", () => {
  it.each(["/dashboard", "/login"])(
    "admits only the password form from %s",
    (path) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<p>Ordinary workspace</p>} />
              <Route
                path="/account/security/password"
                element={<p>Ordinary account layout</p>}
              />
            </Route>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<p>Login</p>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );
      expect(screen.getByText("Restricted password form")).toBeInTheDocument();
      expect(screen.queryByText("Ordinary workspace")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Ordinary account layout"),
      ).not.toBeInTheDocument();
    },
  );
});


describe("AuthCallbackPage token handoff", () => {
  it("accepts tokens from hash fragment, sanitizes URL, and stores session", async () => {
    const acceptSpy = vi.spyOn(tokenStore, "acceptTokens").mockResolvedValue(undefined);
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    const replaceSpy = vi.fn();
    delete (window as any).location;
    (window as any).location = {
      pathname: "/auth/callback",
      search: "",
      hash: "#access_token=test-access&refresh_token=test-refresh",
      replace: replaceSpy,
    };

    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>
    );

    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "/auth/callback");
    expect(acceptSpy).toHaveBeenCalledWith({
      accessToken: "test-access",
      refreshToken: "test-refresh",
    });

    await vi.waitFor(() => {
      expect(replaceSpy).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("redirects to /login when tokens are missing", async () => {
    const replaceSpy = vi.fn();
    delete (window as any).location;
    (window as any).location = {
      pathname: "/auth/callback",
      search: "",
      hash: "",
      replace: replaceSpy,
    };

    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>
    );

    await vi.waitFor(() => {
      expect(replaceSpy).toHaveBeenCalledWith("/login");
    });
  });
});
