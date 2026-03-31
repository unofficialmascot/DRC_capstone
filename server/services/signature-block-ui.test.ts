import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SignatureBlock } from "../../client/src/components/forms/SignatureBlock";

test("SignatureBlock renders signed and pending states", () => {
  const html = renderToStaticMarkup(
    React.createElement(SignatureBlock, {
      signatures: [
        {
          label: "DRC Review",
          signerName: "Dr. Reviewer",
          signerRole: "DRC Member",
          signedAt: "2026-03-28T10:00:00.000Z",
          isPending: false,
        },
        {
          label: "Chairman Decision",
          signerName: "Pending signature",
          signerRole: "DRC Chairman",
          signedAt: null,
          isPending: true,
        },
      ],
    }),
  );

  assert.equal(html.includes("Dr. Reviewer"), true);
  assert.equal(html.includes("Pending signature"), true);
  assert.equal(html.includes("Signed:"), true);
});
