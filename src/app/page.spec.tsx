import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("Home", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a loading state before the whoami check resolves", () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    render(<Home />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows a sign-in link when whoami reports no session", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(null, false),
    );

    render(<Home />);

    const link = await screen.findByRole("link", { name: "Sign in with Google" });
    expect(link).toHaveAttribute("href", "http://localhost:3001/auth/google");
  });

  it("shows the signed-in user and lets them sign out", async () => {
    const user = { id: "user-1", email: "farmer@example.com", isAdmin: false };
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(jsonResponse(user)) // whoami
      .mockResolvedValueOnce(jsonResponse({ status: "ok" })); // logout

    render(<Home />);

    await screen.findByText("Signed in as farmer@example.com");

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/auth/logout",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Sign in with Google" }),
      ).toBeInTheDocument(),
    );
  });
});
