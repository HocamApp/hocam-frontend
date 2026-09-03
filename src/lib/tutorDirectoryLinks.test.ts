import assert from "node:assert/strict";
import test from "node:test";
import { readDirectoryFilters, directoryFilterQuery, tutorListHref } from "./tutorDirectoryLinks";
import { getSubjectOptionsForExam } from "./subjects";

test("subject shortcuts round-trip through query state, including browser history", () => {
  for (const exam_type of ["TYT", "AYT", "YKS"]) {
    const url = new URL(tutorListHref({ exam_type, subject: "Matematik" }), "https://hocam.test");
    assert.equal(url.pathname, "/");
    assert.equal(url.hash, "#ys-tutor-list-title");
    assert.deepEqual(readDirectoryFilters(url.searchParams), { subject: "Matematik", exam_type });
  }
  assert.deepEqual(readDirectoryFilters(new URLSearchParams("favorites=1&search=Arda&page=2")), {});
});

test("clearing filters retains search and favorites but removes pagination and stale fields", () => {
  const query = directoryFilterQuery("search=Arda&favorites=1&exam_type=AYT&subject=Matematik&page=2", {});
  assert.equal(query, "search=Arda&favorites=1");
});

test("YKS subject options include TYT and AYT only and deduplicate names", () => {
  const subjects = [
    { id: "1", name: "Matematik", exam_type: "TYT" as const },
    { id: "2", name: "Matematik", exam_type: "AYT" as const },
    { id: "3", name: "Fizik", exam_type: "AYT" as const },
    { id: "4", name: "Vatandaşlık", exam_type: "KPSS" as const },
  ];
  assert.deepEqual(getSubjectOptionsForExam(subjects, "YKS").map(s => s.name), ["Matematik", "Fizik"]);
});
