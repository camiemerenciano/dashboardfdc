// Next.js instrumentation hook — runs once when the server starts.
// We use it to start a background scheduler that checks every minute
// whether it's time to auto-update Social Blade profiles.

export async function register() {
  // Only run in Node.js runtime (not Edge), and only on the server.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Lazy-import to avoid bundling issues
  const { runScheduledUpdate } = await import("@/lib/scheduler");

  // Check once on startup (in case the server restarted after a missed window)
  runScheduledUpdate();

  // Then check every 60 seconds
  setInterval(runScheduledUpdate, 60_000);
}
