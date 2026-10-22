import { test } from "node:test";
import assert from "node:assert/strict";
import { isAdminEmail } from "./access.ts";

test("admin email matching", () => {
  assert.equal(isAdminEmail("Owner@x.com", " owner@x.com , b@y.com"), true);
  assert.equal(isAdminEmail("b@y.com", "owner@x.com,b@y.com"), true);
  assert.equal(isAdminEmail("c@y.com", "owner@x.com"), false);
  assert.equal(isAdminEmail("owner@x.com", undefined), false);
  assert.equal(isAdminEmail("owner@x.com", ""), false);
  assert.equal(isAdminEmail(null, "owner@x.com"), false);
});
