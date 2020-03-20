// Workaround for mockfs issue.
// https://github.com/tschaub/mock-fs/issues/234
function format(entry) {
  if (typeof entry === "object") {
    try {
      return JSON.stringify(entry);
    } catch (e) {}
  }

  return entry;
}

function log(...msgs) {
  process.stdout.write(msgs.map(format).join(" ") + "\n");
}

export default {
  log,
  warn: log,
  error: log
};