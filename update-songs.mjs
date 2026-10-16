#!/usr/bin/env node
// 주간 곡 목록 자동 갱신 (모두 무료 데이터만 사용)
//
// 키나 가입이 필요 없는 공개 데이터만 사용한다.
// 1) 수집: Apple Music 한국 인기곡 차트 100곡
//          + 세대별 가수 60여 명의 최근 발매곡(iTunes 검색 API)
// 2) 분류: 장르 · 제목 규칙
// 3) 병합: 검수된 기본 곡 목록과 합쳐 songs.json 생성
//
// 사용:  node update-songs.mjs            (온라인 갱신)
//        node update-songs.mjs --offline  (기본 곡 목록만으로 생성)

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SEED } from "./seed.mjs";
import {
  WATCH_ARTISTS, RECENT_MONTHS, PER_ARTIST,
  GENRE_MOODS, TITLE_MOODS,
} from "./sources.mjs";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "songs.json");

export const AGES = ["10", "20", "30", "40", "50", "60"];
export const MOODS = ["happy", "sad", "relaxed", "energetic", "lonely", "angry", "love", "focus"];

const log = (...a) => console.log("•", ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 공통 ────────────────────────────────────────────────
async function getJSON(url, { retries = 2, timeout = 15000 } = {}) {
  for (let i = 0; ; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeout);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i >= retries) throw e;
      await sleep(1500 * (i + 1));
    }
  }
}

export const norm = (s) =>
  String(s).toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/feat\.?.*$/i, "")
    .replace(/[^0-9a-z가-힣]/g, "");

const mainArtist = (a) => String(a).split(/,|&| x |with/i)[0].trim();
const keyOf = (t, a) => norm(t) + "|" + norm(mainArtist(a));
const uniq = (arr) => [...new Set(arr)];
const JUNK = /\b(inst|instrumental|mr|remix|sped ?up|slowed|live|ver\.|version|karaoke)\b|반주/i;

// ── 1. 수집 ─────────────────────────────────────────────
async function fetchChart() {
  const url = "https://rss.applemarketingtools.com/api/v2/kr/music/most-played/100/songs.json";
  const json = await getJSON(url);
  return (json.feed?.results || []).map((r, i) => ({
    t: r.name.trim(),
    a: r.artistName.trim(),
    rank: i + 1,
    release: r.releaseDate || "",
    genres: (r.genres || []).map((g) => g.name),
    src: "chart",
  }));
}

async function fetchWatch() {
  const since = new Date();
  since.setMonth(since.getMonth() - RECENT_MONTHS);
  const out = [];
  for (const w of WATCH_ARTISTS) {
    try {
      // iTunes 검색 API는 분당 약 20회 제한 → 호출 간격 3초
      const s = await getJSON(
        `https://itunes.apple.com/search?term=${encodeURIComponent(w.name)}&country=kr&entity=musicArtist&limit=5`
      );
      await sleep(3100);
      const artist = (s.results || []).find((r) => norm(r.artistName) === norm(w.name));
      if (!artist) { log(`가수 찾기 실패: ${w.name}`); continue; }
      const l = await getJSON(
        `https://itunes.apple.com/lookup?id=${artist.artistId}&entity=song&limit=80&sort=recent&country=kr`
      );
      await sleep(3100);
      const seen = new Set();
      const songs = (l.results || [])
        .filter((r) => r.wrapperType === "track" && r.kind === "song")
        .filter((r) => norm(r.artistName).includes(norm(w.name)))
        .filter((r) => new Date(r.releaseDate) >= since && !JUNK.test(r.trackName))
        .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
        .filter((r) => { const k = norm(r.trackName); if (seen.has(k)) return false; seen.add(k); return true; })
        .slice(0, PER_ARTIST);
      for (const r of songs) {
        out.push({
          t: r.trackName.trim(), a: r.artistName.trim(), rank: 0,
          release: (r.releaseDate || "").slice(0, 10),
          genres: [r.primaryGenreName].filter(Boolean),
          src: "watch", ages: w.ages.split(" "),
        });
      }
    } catch (e) {
      log(`최근곡 수집 실패 (${w.name}): ${e.message}`);
    }
  }
  return out;
}

// ── 2. 분류 ─────────────────────────────────────────────
// 신호 세기: 제목 1.2 · 장르 1
// 장르만으로 정해진 곡은 확신이 낮으므로 기분 1개만 주고 덜 뽑히게 한다.
export function ruleMoods(tr) {
  const score = Object.fromEntries(MOODS.map((m) => [m, 0]));
  let strong = false;
  for (const [re, m] of TITLE_MOODS) if (re.test(tr.t)) { score[m] += 1.2; strong = true; }
  const genres = (tr.genres || []).join(" ");
  for (const [re, ms] of GENRE_MOODS) if (re.test(genres)) { ms.forEach((m, i) => (score[m] += i ? 0.8 : 1)); break; }

  const ranked = MOODS.filter((m) => score[m] > 0).sort((a, b) => score[b] - score[a]);
  if (!ranked.length) return { moods: ["happy"], sure: false };
  const top = score[ranked[0]];
  const moods = strong ? ranked.filter((m) => score[m] >= top * 0.6).slice(0, 2) : ranked.slice(0, 1);
  return { moods, sure: strong };
}

export function ruleAges(tr) {
  if (tr.ages) return tr.ages;
  const g = (tr.genres || []).join(" ");
  if (/트로트|trot/i.test(g)) return ["40", "50", "60"];
  const ages = ["10", "20"];
  if (tr.rank && tr.rank <= 25) ages.push("30");
  if (/발라드|ballad|인디|indie|록|rock|포크|folk/i.test(g)) ages.push("30", "40");
  return uniq(ages);
}

// ── 3. 병합 ─────────────────────────────────────────────
export function build(fresh) {
  const map = new Map();
  for (const [t, a, g, m] of SEED) {
    map.set(keyOf(t, a), { t, a, g: g.split(" "), m: m.split(" "), w: 1, f: 0 });
  }
  for (const tr of fresh) {
    const k = keyOf(tr.t, tr.a);
    let weight = tr.src === "chart" ? 1.5 + 1.5 * (1 - (tr.rank - 1) / 100) : 2;
    const prev = map.get(k);
    if (prev) {
      // 기본 목록에 있던 곡이 지금도 인기 → 검수된 분류는 유지하고 가중치만 올림
      prev.w = Math.max(prev.w, +weight.toFixed(2));
      prev.f = 1;
      continue;
    }
    const { moods, sure } = ruleMoods(tr);
    if (!sure) weight *= 0.6;
    map.set(k, { t: tr.t, a: tr.a, g: ruleAges(tr), m: moods, w: +weight.toFixed(2), f: 1 });
  }
  return [...map.values()].map((x) => ({
    t: x.t, a: x.a, g: x.g.join(" "), m: x.m.join(" "), w: x.w, ...(x.f ? { f: 1 } : {}),
  }));
}

export function coverage(tracks) {
  const rows = [];
  for (const g of AGES) for (const m of MOODS) {
    const list = tracks.filter((t) => t.g.split(" ").includes(g) && t.m.split(" ").includes(m));
    rows.push({ g, m, n: list.length, fresh: list.filter((t) => t.f).length });
  }
  return rows;
}

// ── 실행 ────────────────────────────────────────────────
export async function main(argv = process.argv.slice(2)) {
  const offline = argv.includes("--offline");
  let fresh = [];
  if (!offline) {
    const [chart, watch] = await Promise.allSettled([fetchChart(), fetchWatch()]);
    if (chart.status === "fulfilled") { fresh.push(...chart.value); log(`Apple 차트: ${chart.value.length}곡`); }
    else log(`Apple 차트 수집 실패: ${chart.reason?.message}`);
    if (watch.status === "fulfilled") { fresh.push(...watch.value); log(`세대별 최근곡: ${watch.value.length}곡`); }

    if (!fresh.length) {
      // 외부 데이터를 하나도 못 받았으면 지난주 목록을 그대로 둔다
      try { await readFile(OUT); log("새 데이터 없음 → 기존 목록 유지"); return; } catch {}
    }
  }

  const tracks = build(fresh);
  const weak = coverage(tracks).filter((c) => c.n < 6);
  if (weak.length) throw new Error("곡이 부족한 조합: " + weak.map((c) => `${c.g}/${c.m}`).join(", "));

  const data = {
    v: 2,
    updated: new Date().toISOString(),
    fresh: tracks.filter((t) => t.f).length,
    tracks,
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(data));
  log(`저장 완료: 전체 ${tracks.length}곡 (최신 ${data.fresh}곡) → songs.json`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error("✗", e.message); process.exit(1); });
}
