/**
 * Measures how fast Splinterlands works through Hive blocks while it is
 * behind, to calibrate `SPL_CATCHUP_BLOCKS_PER_SECOND`
 * (src/lib/shared/hive/splCatchUp.ts).
 *
 *   npm run spl:catchup                        # 30 samples, 10 s apart
 *   npm run spl:catchup -- --interval 5 --samples 60
 *
 * Every sample reads the Hive head block and SPL's `/last_block` together and
 * logs the lag. Between two samples SPL's speed is (Δ last_block / Δ time).
 * Only intervals that start with SPL clearly behind say anything about its
 * top speed: once caught up it can only follow Hive (1 block / 3 s).
 *
 * `/last_block` is load-balanced: consecutive reads can step back a few
 * blocks (another node). Each sample keeps the highest value seen so far.
 *
 * Samples are appended to `spl-catchup-samples.json` (gitignored), so runs
 * on different days add up; the summary covers this run and all runs.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const HIVE_NODES = [
  "https://api.hive.blog",
  "https://api.deathwing.me",
  "https://api.openhive.network",
];
const SPL_LAST_BLOCK_URL = "https://api.splinterlands.com/last_block";
const HIVE_BLOCK_SECONDS = 3;
/** An interval counts as catch-up when SPL starts at least this far behind. */
const MIN_BEHIND_BLOCKS = 10;
const OUT_FILE = "spl-catchup-samples.json";

interface Sample {
  /** ms since epoch */
  t: number;
  hiveHead: number;
  splLast: number;
}

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  const v = i >= 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

async function hiveHead(): Promise<number> {
  let lastError: unknown;
  for (const node of HIVE_NODES) {
    try {
      const data = (await fetchJson(node, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "condenser_api.get_dynamic_global_properties",
          params: [],
          id: 1,
        }),
      })) as { result?: { head_block_number?: number } };
      const head = data.result?.head_block_number;
      if (Number.isSafeInteger(head)) return head!;
      throw new Error(`${node}: no head_block_number`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

async function splLast(): Promise<number> {
  const data = (await fetchJson(SPL_LAST_BLOCK_URL)) as { last_block?: number };
  if (!Number.isSafeInteger(data.last_block)) throw new Error("bad last_block");
  return data.last_block!;
}

async function takeSample(prev: Sample | undefined): Promise<Sample> {
  const [h, s] = await Promise.all([hiveHead(), splLast()]);
  return {
    t: Date.now(),
    hiveHead: Math.max(h, prev?.hiveHead ?? 0),
    splLast: Math.max(s, prev?.splLast ?? 0),
  };
}

interface Rate {
  blocks: number;
  seconds: number;
}

/** SPL blocks processed / seconds, over consecutive catch-up intervals. */
function catchUpRate(samples: Sample[]): Rate {
  const rate: Rate = { blocks: 0, seconds: 0 };
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    const dt = (b.t - a.t) / 1000;
    // A gap between runs (or a missed sample) is not one interval.
    if (dt <= 0 || dt > 120) continue;
    if (a.hiveHead - a.splLast < MIN_BEHIND_BLOCKS) continue;
    rate.blocks += b.splLast - a.splLast;
    rate.seconds += dt;
  }
  return rate;
}

function describe(label: string, rate: Rate) {
  if (rate.seconds === 0) {
    console.log(
      `${label}: SPL was never ≥ ${MIN_BEHIND_BLOCKS} blocks behind — no catch-up speed measured (only that it keeps up).`
    );
    return;
  }
  const perSecond = rate.blocks / rate.seconds;
  console.log(
    `${label}: ${perSecond.toFixed(2)} blocks/s over ${rate.seconds.toFixed(0)} s of catch-up ` +
      `(Hive adds ${(1 / HIVE_BLOCK_SECONDS).toFixed(2)}/s, so the lag shrinks by ` +
      `${(perSecond - 1 / HIVE_BLOCK_SECONDS).toFixed(2)} blocks/s)`
  );
}

async function main() {
  const intervalS = arg("interval", 10);
  const count = arg("samples", 30);
  const previous: Sample[] = existsSync(OUT_FILE)
    ? JSON.parse(readFileSync(OUT_FILE, "utf8"))
    : [];
  const samples: Sample[] = [];

  console.log(
    `Sampling ${count}× every ${intervalS} s (Ctrl+C stops and keeps what was taken)\n`
  );
  console.log("time      hive head   spl last   behind        spl speed");

  const save = () => {
    writeFileSync(OUT_FILE, JSON.stringify([...previous, ...samples]));
  };
  const summarize = () => {
    save();
    console.log();
    describe("This run", catchUpRate(samples));
    const all = catchUpRate([...previous, ...samples]);
    describe(`All runs (${previous.length + samples.length} samples)`, all);
    const lags = [...previous, ...samples]
      .map((s) => s.hiveHead - s.splLast)
      .sort((a, b) => a - b);
    const median = lags[Math.floor(lags.length / 2)];
    if (median !== undefined) {
      console.log(
        `Median lag: ${median} blocks (${median * HIVE_BLOCK_SECONDS} s)`
      );
    }
    if (all.seconds > 0) {
      console.log(
        `\nSuggested (src/lib/shared/hive/splCatchUp.ts): SPL_CATCHUP_BLOCKS_PER_SECOND = ${(all.blocks / all.seconds).toFixed(1)}`
      );
    }
    console.log(`Samples saved to ${OUT_FILE}`);
  };
  process.on("SIGINT", () => {
    summarize();
    process.exit(0);
  });

  for (let i = 0; i < count; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, intervalS * 1000));
    const prev = samples.at(-1);
    let s: Sample;
    try {
      s = await takeSample(prev);
    } catch (err) {
      console.log(`sample failed: ${err instanceof Error ? err.message : err}`);
      continue;
    }
    samples.push(s);
    const behind = s.hiveHead - s.splLast;
    const speed = prev
      ? `${((s.splLast - prev.splLast) / ((s.t - prev.t) / 1000)).toFixed(2)} blocks/s`
      : "";
    console.log(
      `${new Date(s.t).toTimeString().slice(0, 8)}  ${s.hiveHead}  ${s.splLast}  ` +
        `${String(behind).padStart(4)} (${String(behind * HIVE_BLOCK_SECONDS).padStart(4)} s)  ${speed}`
    );
  }
  summarize();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
