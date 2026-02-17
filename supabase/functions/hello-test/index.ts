Deno.serve(async (req) => {
  return new Response("Hello from test function!", {
    headers: { "Content-Type": "text/plain" },
  });
});
