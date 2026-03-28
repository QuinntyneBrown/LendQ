import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import client, { apiGet } from "./client";
import { ACCESS_TOKEN_KEY } from "@/utils/constants";

describe("api client refresh queue", () => {
  let clientMock: MockAdapter;
  let axiosMock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(ACCESS_TOKEN_KEY, "expired-token");
    clientMock = new MockAdapter(client);
    axiosMock = new MockAdapter(axios);
  });

  afterEach(() => {
    clientMock.restore();
    axiosMock.restore();
    localStorage.clear();
  });

  it("retries concurrent 401 responses behind a single refresh request", async () => {
    let refreshCount = 0;

    axiosMock.onPost("/api/v1/auth/refresh").reply(() => {
      refreshCount += 1;
      return [
        200,
        {
          access_token: "fresh-token",
          expires_in_seconds: 3600,
          csrf_token: "csrf-token",
          user: {
            id: "user-1",
            name: "Quinn Brown",
            email: "creditor@family.com",
            roles: ["Creditor"],
            email_verified: true,
          },
        },
      ];
    });

    clientMock.onGet("/dashboard/summary").replyOnce(401);
    clientMock.onGet("/dashboard/summary").reply(200, { ok: true });
    clientMock.onGet("/dashboard/loans").replyOnce(401);
    clientMock.onGet("/dashboard/loans").reply(200, [{ id: "loan-1" }]);
    clientMock.onGet("/dashboard/activity").replyOnce(401);
    clientMock.onGet("/dashboard/activity").reply(200, [{ id: "activity-1" }]);

    const [summary, loans, activity] = await Promise.all([
      apiGet<{ ok: boolean }>("/dashboard/summary"),
      apiGet<Array<{ id: string }>>("/dashboard/loans"),
      apiGet<Array<{ id: string }>>("/dashboard/activity"),
    ]);

    expect(summary).toEqual({ ok: true });
    expect(loans).toEqual([{ id: "loan-1" }]);
    expect(activity).toEqual([{ id: "activity-1" }]);
    expect(refreshCount).toBe(1);
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("fresh-token");
  });
});
