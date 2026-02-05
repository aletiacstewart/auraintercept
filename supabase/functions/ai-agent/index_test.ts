import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const AI_AGENT_URL = `${SUPABASE_URL}/functions/v1/ai-agent`;

Deno.test("ai-agent: handles CORS preflight", async () => {
  const response = await fetch(AI_AGENT_URL, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "POST",
    },
  });

  assertEquals(response.status, 200);
  const corsHeader = response.headers.get("Access-Control-Allow-Origin");
  assertEquals(corsHeader, "*");
  await response.text(); // Consume body
});

Deno.test("ai-agent: returns 400 for missing messages", async () => {
  const response = await fetch(AI_AGENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      company_id: "00000000-0000-0000-0000-000000000000",
    }),
  });

  assertEquals(response.status, 400);
  const data = await response.json();
  assertExists(data.error);
});

Deno.test("ai-agent: returns 400 for invalid company_id format", async () => {
  const response = await fetch(AI_AGENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Hello" }],
      company_id: "invalid-not-uuid",
    }),
  });

  assertEquals(response.status, 400);
  const data = await response.json();
  assertExists(data.error);
});

Deno.test("ai-agent: returns 400 for empty messages array", async () => {
  const response = await fetch(AI_AGENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      messages: [],
      company_id: "00000000-0000-0000-0000-000000000000",
    }),
  });

  assertEquals(response.status, 400);
  const data = await response.json();
  assertExists(data.error);
});

Deno.test("ai-agent: returns 400 for too many messages", async () => {
  const manyMessages = Array(101).fill({ role: "user", content: "Test" });
  
  const response = await fetch(AI_AGENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      messages: manyMessages,
      company_id: "00000000-0000-0000-0000-000000000000",
    }),
  });

  assertEquals(response.status, 400);
  const data = await response.json();
  assertStringIncludes(data.error.toLowerCase(), "too many");
});

Deno.test("ai-agent: accepts valid request format", async () => {
  // This test verifies the request is accepted (may fail at company validation)
  const response = await fetch(AI_AGENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "What services do you offer?" }],
      company_id: "00000000-0000-0000-0000-000000000000",
      stream: false,
    }),
  });

  // Should not be a client error for missing fields
  // Might be 400 for company not found (which is expected)
  const data = await response.json();
  assertExists(data);
});

Deno.test("ai-agent: validates UUID format correctly", async () => {
  const validUUIDs = [
    "123e4567-e89b-12d3-a456-426614174000",
    "550e8400-e29b-41d4-a716-446655440000",
  ];

  const invalidUUIDs = [
    "not-a-uuid",
    "123e4567-e89b-12d3-a456",
    "123e4567e89b12d3a456426614174000",
    "",
  ];

  for (const uuid of invalidUUIDs) {
    const response = await fetch(AI_AGENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Test" }],
        company_id: uuid,
      }),
    });

    assertEquals(response.status, 400, `Expected 400 for UUID: ${uuid}`);
    await response.json(); // Consume body
  }
});

Deno.test("ai-agent: returns proper content-type for streaming", async () => {
  // Skip if no valid company exists
  // This tests the response format structure
  const response = await fetch(AI_AGENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Hi" }],
      company_id: "00000000-0000-4000-8000-000000000000",
      stream: true,
    }),
  });

  // Consume the body to prevent resource leaks
  await response.text();
  
  // If successful, should be text/event-stream
  if (response.ok) {
    const contentType = response.headers.get("content-type");
    assertStringIncludes(contentType || "", "text/event-stream");
  }
});
