import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CONFIG_PATH = resolve(__dirname, "../../public/staticwebapp.config.json");

function readConfig(): Record<string, unknown> {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

describe("staticwebapp.config.json", () => {
  it("preserves the SPA navigation fallback", () => {
    const config = readConfig() as { navigationFallback?: { rewrite?: string } };
    expect(config.navigationFallback?.rewrite).toBe("/index.html");
  });

  it("sets X-Frame-Options: DENY to block clickjacking (bug 2026-04-17-frontend-missing-clickjacking-headers)", () => {
    const config = readConfig() as {
      globalHeaders?: Record<string, string>;
    };
    expect(config.globalHeaders?.["X-Frame-Options"]).toBe("DENY");
  });

  it("sets Content-Security-Policy: frame-ancestors 'none'", () => {
    const config = readConfig() as {
      globalHeaders?: Record<string, string>;
    };
    const csp = config.globalHeaders?.["Content-Security-Policy"] ?? "";
    expect(csp).toContain("frame-ancestors 'none'");
  });

  describe("full Content-Security-Policy", () => {
    function readCsp(): string {
      const config = readConfig() as {
        globalHeaders?: Record<string, string>;
      };
      return config.globalHeaders?.["Content-Security-Policy"] ?? "";
    }

    it("allows XHR/fetch to the Azure Container Apps API", () => {
      const csp = readCsp();
      // The LendQ API lives on *.azurecontainerapps.io across environments.
      expect(csp).toMatch(/connect-src[^;]*\*\.azurecontainerapps\.io/);
    });

    it("allows Google Fonts stylesheets and font files", () => {
      const csp = readCsp();
      expect(csp).toMatch(/style-src[^;]*fonts\.googleapis\.com/);
      expect(csp).toMatch(/font-src[^;]*fonts\.gstatic\.com/);
    });

    it("defaults to 'self' and blocks objects", () => {
      const csp = readCsp();
      expect(csp).toMatch(/default-src 'self'/);
      expect(csp).toMatch(/object-src 'none'/);
    });

    it("restricts form actions and base URIs", () => {
      const csp = readCsp();
      expect(csp).toMatch(/form-action 'self'/);
      expect(csp).toMatch(/base-uri 'self'/);
    });
  });
});
