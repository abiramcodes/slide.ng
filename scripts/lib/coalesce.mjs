// Runs an async job one at a time. A call made while it runs does not start a second run:
// it asks for one more run after the current one ends, however many calls came in between.
export function coalesce(job) {
  let running = false;
  let again = false;
  const run = async () => {
    if (running) {
      again = true;
      return;
    }
    running = true;
    try {
      do {
        again = false;
        await job();
      } while (again);
    } finally {
      running = false;
    }
  };
  return run;
}
