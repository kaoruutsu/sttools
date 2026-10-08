const CACHE_NAME = "sttools-v1";
const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./manifest.webmanifest",
    "./favicon-32.png",
    "./apple-touch-icon.png",
    "./icon-192.png",
    "./icon-512.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName.startsWith("sttools-") && cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            )
        )
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const requestUrl = new URL(request.url);
    const scopeUrl = new URL(self.registration.scope);

    if (request.method !== "GET" || requestUrl.origin !== scopeUrl.origin || !requestUrl.href.startsWith(scopeUrl.href)) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    return caches.open(CACHE_NAME)
                        .then((cache) => cache.put(request, response.clone()))
                        .then(() => response, (error) => {
                            console.error("Failed to cache response:", error);
                            return response;
                        });
                }
                return response;
            })
            .catch(async (networkError) => {
                const cachedResponse = await caches.match(request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                if (request.mode === "navigate") {
                    const appShell = await caches.match("./index.html");
                    if (appShell) {
                        return appShell;
                    }
                }
                throw networkError;
            })
    );
});
