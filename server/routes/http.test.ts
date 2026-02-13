import test from "node:test";
import assert from "node:assert/strict";
import {
  ApiError,
  badRequest,
  forbidden,
  handleRouteError,
  notFound,
  parseIdParam,
  unauthorized,
} from "./http";

test("parseIdParam returns numeric id for valid input", () => {
  const value = parseIdParam("42", "application id");
  assert.equal(value, 42);
});

test("parseIdParam throws ApiError for invalid input", () => {
  assert.throws(
    () => parseIdParam("abc", "application id"),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 400);
      assert.equal(error.message, "Invalid application id");
      return true;
    },
  );
});

test("ApiError helpers set expected status codes", () => {
  assert.equal(badRequest("Bad input").status, 400);
  assert.equal(unauthorized("No auth").status, 401);
  assert.equal(forbidden("No access").status, 403);
  assert.equal(notFound("Missing").status, 404);
});

test("handleRouteError returns structured response for ApiError", () => {
  const result: { status?: number; body?: unknown } = {};
  const responseStub = {
    status(code: number) {
      result.status = code;
      return this;
    },
    json(payload: unknown) {
      result.body = payload;
      return payload;
    },
  };

  const error = badRequest("Invalid input", [{ field: "id" }]);
  handleRouteError(responseStub as any, error);

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, {
    message: "Invalid input",
    errors: [{ field: "id" }],
  });
});
