import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { UniversityEmailVerification } from "@/types";

let emailProof: UniversityEmailVerification = {
  status: "under_review",
  email: "ada@student.yeni.edu.tr",
};
let VerificationForm: React.ComponentType | null = null;
let submitError: unknown = null;
const submitVerification = mock.fn(async (_payload: FormData) => {
  if (submitError) throw submitError;
  return null;
});

before(async () => {
  mock.module("@/lib/dashboardApi", {
    namedExports: {
      fetchVerification: async () => null,
      fetchUniversityEmailVerification: async () => emailProof,
      requestUniversityEmailCode: async () => emailProof,
      confirmUniversityEmailCode: async () => emailProof,
      submitVerification,
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

afterEach(() => {
  cleanup();
  mock.restoreAll();
  submitVerification.mock.resetCalls();
  submitError = null;
});

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
    assert.equal(
      screen.getByRole("link", { name: "Hoca Doğrulama Aydınlatma Metni" })
        .getAttribute("href"),
      "/kvkk/hoca-dogrulama"
    );
  });
});

async function submitDocuments(error: unknown) {
  emailProof = { status: "verified", email: "ada@itu.edu.tr" };
  submitError = error;
  // JSDOM does not serialize the FileList supplied by fireEvent.change.
  // Preserve browser FormData behavior for these two real file inputs.
  mock.method(globalThis, "FormData", function (form?: HTMLFormElement) {
    const data = new window.FormData();
    form?.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => {
      for (const file of Array.from(input.files ?? [])) data.append(input.name, file);
    });
    return data;
  });
  renderForm();
  const studentInput = await screen.findByLabelText("Öğrenci Belgesi") as HTMLInputElement;
  const yksInput = screen.getByLabelText("YKS Sonuç Belgesi") as HTMLInputElement;
  const studentFile = new File(["student"], "student.jpeg", { type: "image/jpeg" });
  const yksFile = new File(["result"], "result.pdf", { type: "application/pdf" });
  fireEvent.change(studentInput, { target: { files: [studentFile] } });
  fireEvent.change(yksInput, { target: { files: [yksFile] } });
  fireEvent.submit(studentInput.closest("form")!);
  await waitFor(() => assert.equal(submitVerification.mock.callCount(), 1));
  return { studentInput, yksInput, studentFile, yksFile };
}

describe("VerificationForm document submission errors", () => {
  it("shows the Turkish wait time and retains files without retrying the upload", async () => {
    const { studentInput, yksInput, studentFile, yksFile } = await submitDocuments({
      response: { status: 429, data: { detail: "Request was throttled.", retry_after: 3300 } },
    });
    assert.ok(await screen.findByText(
      "Belge gönderme deneme sınırına ulaştın. Yaklaşık 55 dakika sonra tekrar deneyebilirsin."
    ));
    assert.equal(studentInput.files?.[0], studentFile);
    assert.equal(yksInput.files?.[0], yksFile);
    assert.ok(screen.getByText("student.jpeg"));
    assert.ok(screen.getByText("result.pdf"));
    assert.equal(submitVerification.mock.callCount(), 1);
  });

  it("rounds a partial minute up", async () => {
    await submitDocuments({ response: { status: 429, data: { retry_after: 61 } } });
    assert.ok(await screen.findByText(/Yaklaşık 2 dakika sonra/));
  });

  for (const retryAfter of [undefined, null, 0, -1, "3300", Infinity]) {
    it(`uses Turkish fallback copy for an unusable wait time: ${retryAfter}`, async () => {
      await submitDocuments({
        response: { status: 429, data: { detail: "Request was throttled.", retry_after: retryAfter } },
      });
      assert.ok(await screen.findByText(
        "Belge gönderme deneme sınırına ulaştın. Lütfen daha sonra tekrar dene."
      ));
    });
  }

  it("preserves document validation errors", async () => {
    await submitDocuments({
      response: { status: 400, data: { yks_result_document: ["ÖSYM'den indirdiğin orijinal sonuç PDF'ini yükle."] } },
    });
    assert.ok(await screen.findByText("ÖSYM'den indirdiğin orijinal sonuç PDF'ini yükle."));
  });

  it("preserves other server detail errors", async () => {
    await submitDocuments({
      response: { status: 503, data: { detail: "Belge tarama hizmeti kullanılamıyor." } },
    });
    assert.ok(await screen.findByText("Belge tarama hizmeti kullanılamıyor."));
  });
});
