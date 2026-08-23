import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { UniversityEmailVerification } from "@/types";

let emailProof: UniversityEmailVerification = {
  status: "under_review",
  email: "ada@student.yeni.edu.tr",
};
let VerificationForm: React.ComponentType | null = null;

before(async () => {
  mock.module("@/lib/dashboardApi", {
    namedExports: {
      fetchVerification: async () => null,
      fetchUniversityEmailVerification: async () => emailProof,
      requestUniversityEmailCode: async () => emailProof,
      confirmUniversityEmailCode: async () => emailProof,
      submitVerification: async () => null,
    },
  });
  mock.module("sonner", {
    namedExports: {
      toast: { success: () => {}, info: () => {}, error: () => {} },
    },
  });
  VerificationForm = (await import("./VerificationForm")).VerificationForm;
});

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const Form = VerificationForm as NonNullable<typeof VerificationForm>;
  return render(
    <QueryClientProvider client={client}>
      <Form />
    </QueryClientProvider>
  );
}

afterEach(() => cleanup());

describe("VerificationForm university email review state", () => {
  it("explains that an unknown academic domain is under admin review, not rejected", async () => {
    emailProof = {
      status: "under_review",
      email: "ada@student.yeni.edu.tr",
    };
    renderForm();

    assert.ok(
      await screen.findByText("E-posta uzantın incelemeye alındı")
    );
    assert.ok(screen.getByText(/Hesabın reddedilmedi/));
    assert.ok(screen.getByText(/ada@student\.yeni\.edu\.tr/));
    assert.equal(screen.queryByLabelText("6 haneli kod"), null);
  });

  it("shows the code field only when the backend confirms that a code was sent", async () => {
    emailProof = {
      status: "code_sent",
      email: "ada@itu.edu.tr",
    };
    renderForm();

    assert.ok(await screen.findByLabelText("6 haneli kod"));
    assert.equal(
      screen.queryByText("E-posta uzantın incelemeye alındı"),
      null
    );
  });
});
