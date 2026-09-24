import { describe, it, expect } from "vitest";
import { iconForUrl } from "../command-menu";

describe("Menu icons", () => {
  it("gives each of the site's pages its own icon", () => {
    const pages: [string, string, string][] = [
      ["/", "Home", "home"],
      ["/services", "Services", "briefcase"],
      ["/tests", "Tests", "flask"],
      ["/performance", "Performance", "gauge"],
      ["/adventure", "The Deep Drop", "gamepad"],
      ["/site-log", "Site log", "notes"],
      ["/posts", "Posts", "pencil"],
    ];
    for (const [url, title, icon] of pages) expect(iconForUrl(url, title), url).toBe(icon);
    expect(new Set(pages.map(([url, title]) => iconForUrl(url, title))).size).toBe(pages.length);
  });

  it("uses the page title when the address says little", () => {
    expect(iconForUrl("/play", "Text adventure")).toBe("gamepad");
    expect(iconForUrl("/me", "About me")).toBe("user");
  });

  it("falls back to a page icon, and keeps the icons for other sites", () => {
    expect(iconForUrl("/something-new", "Something new")).toBe("page");
    expect(iconForUrl("https://www.linkedin.com/in/x", "LinkedIn")).toBe("linkedin");
    expect(iconForUrl("https://github.com/x", "GitHub")).toBe("github");
    expect(iconForUrl("mailto:me@example.com", "Mail")).toBe("mail");
    expect(iconForUrl("https://example.com/tests", "Tests elsewhere")).toBe("external");
  });
});
