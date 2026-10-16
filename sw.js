// 감성뮤직 · 서비스 워커
// - 앱 화면: 미리 저장해 두고 바로 띄움 (오프라인에서도 열림)
// - 곡 목록: 저장된 목록을 즉시 쓰고, 뒤에서 새 목록을 받아 다음에 반영
// - 글꼴: 한 번 받으면 저장해 두고 재사용
const VERSION = "v2.2.0";
const SHELL = `shell-${VERSION}`;
const DATA = "data-v2";
const FONTS = "fonts-v1";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL);
      await shell.addAll(SHELL_FILES);
      const data = await caches.open(DATA);
      if (!(await data.match("./data/songs.json"))) {
        try { await data.add("./data/songs.json"); } catch {}
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keep = [SHELL, DATA, FONTS];
      for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 곡 목록: 저장본 즉시 응답 + 뒤에서 갱신
  if (url.origin === location.origin && url.pathname.endsWith("/data/songs.json")) {
    e.respondWith(
      (async () => {
        const cache = await caches.open(DATA);
        const cached = await cache.match(req, { ignoreSearch: true });
        const network = fetch(req, { cache: "no-cache" })
          .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
          .catch(() => null);
        if (cached) { e.waitUntil(network); return cached; }
        return (await network) || new Response('{"tracks":[]}', { status: 503, headers: { "content-type": "application/json" } });
      })()
    );
    return;
  }

  // 글꼴
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      (async () => {
        const cache = await caches.open(FONTS);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok || res.type === "opaque") cache.put(req, res.clone());
          return res;
        } catch { return Response.error(); }
      })()
    );
    return;
  }

  // 앱 화면: 페이지 이동은 네트워크 우선(새 버전 반영), 실패 시 저장본
  if (url.origin === location.origin) {
    if (req.mode === "navigate") {
      e.respondWith(
        fetch(req)
          .then((res) => { caches.open(SHELL).then((c) => c.put("./index.html", res.clone())); return res; })
          .catch(async () => (await caches.match("./index.html")) || (await caches.match("./")))
      );
      return;
    }
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
