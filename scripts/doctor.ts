/* ---------------------------------------------------------------------------
 * Header: Tiera 점검·수리 스크립트 (npm run doctor / npm run doctor:fix). SPEC 23.23.
 *
 * 2026-10-16 점검에서 나온 약점을 한 번에 확인하고, 안전한 것만 고친다.
 *
 *   점검                     | --fix가 하는 일
 *   ------------------------|----------------------------------------------
 *   1. lock 파일 동기화       | npm install --package-lock-only
 *   2. 배포 의존성 취약점     | npm audit fix (--force 없이. 메이저 업그레이드는 안 함)
 *   3. 환경 변수·.env 노출    | 고치지 않음 — 무엇이 빠졌는지만 알려준다
 *   4. 커밋된 파일 속 비밀값  | 고치지 않음 — 위치만 알려준다(값은 출력하지 않는다)
 *   5. "배우는 곳" 링크       | 고치지 않음 — 깨진 링크 목록만
 *   6. 시드·검색 규칙 테스트  | 고치지 않음 — 실패한 테스트 이름만
 *
 * 자동으로 고치지 않는 것은 사람이 판단해야 하는 일이다. 링크를 지우거나 비밀값을
 * 옮기는 걸 스크립트가 대신하면, 왜 바뀌었는지 아무도 모르는 커밋이 생긴다.
 *
 * 옵션:  --fix          안전한 수리 실행
 *        --skip-links   링크 점검 건너뛰기(오프라인일 때)
 *        --skip-tests   테스트 건너뛰기
 * 종료 코드: 실패(FAIL)가 하나라도 있으면 1. CI에 그대로 붙일 수 있다.
 *
 * 프록시 뒤에서 링크 점검이 전부 실패하면 NODE_USE_ENV_PROXY=1 을 붙여 실행한다
 * (Node 22.21+가 HTTPS_PROXY를 따른다).
 * ------------------------------------------------------------------------- */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { LEARN_LINKS } from "@/db/seed-tools-learn";

type Status = "OK" | "WARN" | "FAIL" | "FIXED" | "SKIP";
interface Result {
  name: string;
  status: Status;
  detail: string[];
}

const args = new Set(process.argv.slice(2));
const FIX = args.has("--fix");
const results: Result[] = [];

function run(cmd: string): { ok: boolean; out: string } {
  // shell: true — Windows에서도 npm/npx/git을 PATH에서 찾게 한다.
  const r = spawnSync(cmd, { shell: true, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

function add(name: string, status: Status, detail: string[] = []) {
  results.push({ name, status, detail });
}

// --- 1. lock 파일 -----------------------------------------------------------
function lockMismatches(): string[] {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const root = lock.packages?.[""] ?? {};
  const out: string[] = [];
  for (const field of ["dependencies", "devDependencies"] as const) {
    for (const [name, range] of Object.entries<string>(pkg[field] ?? {})) {
      if (root[field]?.[name] !== range) out.push(`${name}: package.json ${range} / lock ${root[field]?.[name] ?? "없음"}`);
      else if (!lock.packages?.[`node_modules/${name}`]) out.push(`${name}: lock에 설치 항목이 없음`);
    }
  }
  return out;
}

function checkLock() {
  const name = "lock 파일 동기화 (npm ci가 되는가)";
  let bad = lockMismatches();
  if (bad.length === 0) return add(name, "OK");
  if (FIX) {
    const r = run("npm install --package-lock-only --no-audit --no-fund");
    bad = r.ok ? lockMismatches() : bad;
    if (r.ok && bad.length === 0) return add(name, "FIXED", ["package-lock.json을 다시 만들었어요. 커밋하세요."]);
  }
  add(name, "FAIL", [...bad, "→ npm run doctor:fix 로 고칠 수 있어요."]);
}

// --- 2. 취약점 --------------------------------------------------------------
function auditCounts(): Record<string, number> | null {
  const r = run("npm audit --omit=dev --json");
  try {
    return JSON.parse(r.out.slice(r.out.indexOf("{"))).metadata.vulnerabilities;
  } catch {
    return null;
  }
}

function checkAudit() {
  const name = "배포 의존성 취약점 (npm audit --omit=dev)";
  let v = auditCounts();
  if (!v) return add(name, "WARN", ["npm audit을 실행하지 못했어요(네트워크 확인)."]);
  const serious = () => (v!.high ?? 0) + (v!.critical ?? 0);
  if (serious() > 0 && FIX) {
    run("npm audit fix --omit=dev");
    v = auditCounts() ?? v;
    if (serious() === 0) return add(name, "FIXED", ["npm audit fix로 고쳤어요. package-lock.json을 커밋하세요."]);
  }
  const line = `critical ${v.critical ?? 0} · high ${v.high ?? 0} · moderate ${v.moderate ?? 0} · low ${v.low ?? 0}`;
  if (serious() > 0)
    return add(name, "FAIL", [line, "남은 건 메이저 업그레이드가 필요해요. npm audit 으로 내용을 보고 직접 판단하세요."]);
  add(name, (v.moderate ?? 0) > 0 ? "WARN" : "OK", [line]);
}

// --- 3. 환경 변수 -----------------------------------------------------------
function checkEnv() {
  const name = "환경 변수·.env 노출";
  const detail: string[] = [];
  let status: Status = "OK";
  const tracked = run("git ls-files .env .env.local .env.production .env.production.local").out.trim();
  if (tracked) {
    status = "FAIL";
    detail.push(`git이 추적 중인 env 파일: ${tracked.split(/\s+/).join(", ")} → git rm --cached 하고 키를 새로 발급하세요.`);
  }
  const envFile = [".env.local", ".env"].find((f) => existsSync(f));
  if (!envFile) {
    detail.push(".env가 없어요. .env.example을 복사해 채우세요(로컬 개발용).");
    status = status === "FAIL" ? status : "WARN";
  } else {
    const keys = new Set(
      readFileSync(envFile, "utf8")
        .split(/\r?\n/)
        .filter((l) => /^[A-Z0-9_]+=.+/.test(l))
        .map((l) => l.split("=")[0]),
    );
    for (const k of ["DATABASE_URL", "AUTH_SECRET"]) {
      if (!keys.has(k)) {
        detail.push(`${envFile}에 ${k}가 비어 있어요(필수).`);
        status = "FAIL";
      }
    }
    for (const k of ["CRON_SECRET", "ARTIFICIAL_ANALYSIS_API_KEY"]) {
      if (!keys.has(k)) detail.push(`${envFile}에 ${k}가 없어요(선택 — 크론·동기화를 로컬에서 돌릴 때만 필요).`);
    }
  }
  add(name, status, detail);
}

// --- 4. 비밀값 ---------------------------------------------------------------
const SECRET_PATTERNS: [string, RegExp][] = [
  ["OpenAI/Anthropic 형식 키", /\bsk-(?:ant-)?[A-Za-z0-9_-]{24,}/],
  ["AWS 액세스 키", /\bAKIA[0-9A-Z]{16}\b/],
  ["GitHub 토큰", /\bgh[pousr]_[A-Za-z0-9]{30,}/],
  ["개인 키", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  // 로컬 주소가 아닌 DB 접속 문자열에 비밀번호가 박혀 있으면 위험하다.
  ["원격 DB 비밀번호", /postgres(?:ql)?:\/\/[^:\s/]+:[^@\s]+@(?!localhost|127\.0\.0\.1)[^\s"']+/],
];

function checkSecrets() {
  const name = "커밋된 파일 속 비밀값";
  const files = run("git ls-files").out.split(/\r?\n/).filter(Boolean);
  const hits: string[] = [];
  for (const f of files) {
    if (/\.(png|jpe?g|webp|ico|woff2?|ttf|lock)$/.test(f) || f === "package-lock.json" || f.endsWith(".example")) continue;
    let text: string;
    try {
      text = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    text.split(/\r?\n/).forEach((line, i) => {
      for (const [label, re] of SECRET_PATTERNS) {
        // 값은 절대 출력하지 않는다. 위치와 종류만.
        if (re.test(line)) hits.push(`${f}:${i + 1} — ${label}`);
      }
    });
  }
  add(name, hits.length ? "FAIL" : "OK", hits.length ? [...hits, "→ 값을 지우고, 이미 푸시했다면 키를 새로 발급하세요."] : []);
}

// --- 5. 배우는 곳 링크 --------------------------------------------------------
async function checkOne(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    // HEAD를 거부하는 사이트가 많아서 GET으로 본다. 본문은 읽지 않는다.
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": "Mozilla/5.0 (TieraLinkCheck)" },
    });
    res.body?.cancel().catch(() => {});
    // 429(요청 제한)·403(봇 차단)은 링크가 죽었다는 뜻이 아니다.
    if (res.status === 429 || res.status === 403) return null;
    return res.ok ? null : `HTTP ${res.status}`;
  } catch (e) {
    return (e as Error).name === "AbortError" ? "시간 초과" : "연결 실패";
  } finally {
    clearTimeout(t);
  }
}

async function checkLinks() {
  const name = "'배우는 곳' 링크";
  if (args.has("--skip-links")) return add(name, "SKIP");
  const all = Object.entries(LEARN_LINKS).flatMap(([slug, ls]) => ls.map((l) => ({ slug, url: l.url })));
  const unique = [...new Map(all.map((x) => [x.url, x])).values()];
  const broken: string[] = [];
  let i = 0;
  // 동시에 6개씩. 한꺼번에 90개를 쏘면 같은 사이트에 요청 제한이 걸린다.
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (i < unique.length) {
        const item = unique[i++];
        const err = await checkOne(item.url);
        if (err) broken.push(`${item.slug}: ${err} — ${item.url}`);
      }
    }),
  );
  // 절반 넘게 실패하면 링크가 아니라 이쪽 네트워크 문제다(사내망·프록시·오프라인).
  // 그때 90줄을 늘어놓으면 진짜 깨진 링크를 찾을 수 없다.
  if (broken.length > unique.length / 2)
    return add(name, "WARN", [
      `${unique.length}개 중 ${broken.length}개가 실패 — 네트워크·프록시 문제로 보여요.`,
      "다른 네트워크에서 다시 실행하거나, 프록시 뒤라면 NODE_USE_ENV_PROXY=1 을 붙이세요.",
    ]);
  add(name, broken.length ? "WARN" : "OK", [
    `${unique.length}개 중 ${unique.length - broken.length}개 정상`,
    ...broken.sort(),
    ...(broken.length ? ["→ db/seed-tools-learn.ts에서 고치거나 지우세요."] : []),
  ]);
}

// --- 6. 규칙 테스트 -----------------------------------------------------------
function checkTests() {
  const name = "시드·검색 규칙 테스트";
  if (args.has("--skip-tests")) return add(name, "SKIP");
  const r = run("npx vitest run tests/seed-tools.test.ts tests/search.test.ts");
  const failed = [...r.out.matchAll(/(?:×|FAIL)\s+(.+)/g)].map((m) => m[1].trim()).slice(0, 10);
  add(name, r.ok ? "OK" : "FAIL", r.ok ? [] : failed.length ? failed : ["vitest 출력을 직접 확인하세요."]);
}

// --- 실행 --------------------------------------------------------------------
async function main() {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  } catch {
    console.error("Tiera 저장소 폴더 안에서 실행하세요.");
    process.exit(2);
  }
  console.log(`Tiera 점검${FIX ? " + 수리" : ""} 시작…\n`);
  checkLock();
  checkAudit();
  checkEnv();
  checkSecrets();
  await checkLinks();
  checkTests();

  const icon: Record<Status, string> = { OK: "✓", WARN: "!", FAIL: "✗", FIXED: "↻", SKIP: "-" };
  for (const r of results) {
    console.log(`${icon[r.status]} [${r.status}] ${r.name}`);
    for (const d of r.detail) console.log(`    ${d}`);
  }
  const fails = results.filter((r) => r.status === "FAIL").length;
  const fixed = results.filter((r) => r.status === "FIXED").length;
  console.log(`\n실패 ${fails} · 경고 ${results.filter((r) => r.status === "WARN").length} · 고침 ${fixed}`);
  if (!FIX && fails > 0) console.log("안전하게 고칠 수 있는 항목은 npm run doctor:fix 로 고쳐요.");
  process.exit(fails > 0 ? 1 : 0);
}

main();
/* Footer: scripts/doctor.ts */
