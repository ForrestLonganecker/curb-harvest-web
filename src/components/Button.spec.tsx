import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, ButtonLink } from "./Button";

describe("Button", () => {
  it("renders a native button and fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Sign out</Button>);

    const button = screen.getByRole("button", { name: "Sign out" });
    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("defaults to the primary variant's className", () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole("button")).toHaveClass("bg-foreground");
  });

  it("applies the secondary variant's className when requested", () => {
    render(<Button variant="secondary">Click me</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("border-black/[.08]");
    expect(button).not.toHaveClass("bg-foreground");
  });

  it("merges a custom className with the variant's className", () => {
    render(<Button className="w-full">Click me</Button>);

    expect(screen.getByRole("button")).toHaveClass("bg-foreground", "w-full");
  });
});

describe("ButtonLink", () => {
  it("renders an anchor with the given href", () => {
    render(<ButtonLink href="https://example.com/auth/google">Sign in</ButtonLink>);

    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link).toHaveAttribute("href", "https://example.com/auth/google");
  });

  it("applies variant styling the same way Button does", () => {
    render(
      <ButtonLink href="https://example.com" variant="secondary">
        Link
      </ButtonLink>,
    );

    expect(screen.getByRole("link")).toHaveClass("border-black/[.08]");
  });
});
