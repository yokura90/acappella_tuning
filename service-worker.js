"use strict";

const CACHE_NAME =
    "acappella-tone-cache-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"
];

self.addEventListener(
    "install",
    event => {
        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(cache =>
                    cache.addAll(APP_FILES)
                )
        );

        self.skipWaiting();
    }
);

self.addEventListener(
    "activate",
    event => {
        event.waitUntil(
            caches
                .keys()
                .then(cacheNames =>
                    Promise.all(
                        cacheNames.map(
                            cacheName => {
                                if (
                                    cacheName !==
                                    CACHE_NAME
                                ) {
                                    return caches.delete(
                                        cacheName
                                    );
                                }

                                return null;
                            }
                        )
                    )
                )
        );

        self.clients.claim();
    }
);

self.addEventListener(
    "fetch",
    event => {
        if (
            event.request.method !== "GET"
        ) {
            return;
        }

        event.respondWith(
            caches
                .match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(event.request)
                        .then(networkResponse => {
                            if (
                                !networkResponse ||
                                networkResponse.status !== 200 ||
                                networkResponse.type === "opaque"
                            ) {
                                return networkResponse;
                            }

                            const responseCopy =
                                networkResponse.clone();

                            caches
                                .open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(
                                        event.request,
                                        responseCopy
                                    );
                                });

                            return networkResponse;
                        });
                })
                .catch(() =>
                    caches.match("./index.html")
                )
        );
    }
);
