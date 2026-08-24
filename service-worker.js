"use strict";

/*
 * HTMLを更新するたびに，
 * v2，v3，v4のように変更する．
 */
const CACHE_NAME =
    "acappella-tone-cache-v4";

const APP_FILES = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"
];

/*
 * アプリに必要なファイルを保存する．
 */
self.addEventListener(
    "install",
    event => {
        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(cache => {
                    return cache.addAll(
                        APP_FILES
                    );
                })
        );

        /*
         * 新しいService Workerを
         * 待機させずに有効化する．
         */
        self.skipWaiting();
    }
);

/*
 * 古いキャッシュを削除する．
 */
self.addEventListener(
    "activate",
    event => {
        event.waitUntil(
            caches
                .keys()
                .then(cacheNames => {
                    return Promise.all(
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
                    );
                })
        );

        /*
         * 開いているページへ
         * 新しいService Workerを適用する．
         */
        self.clients.claim();
    }
);

/*
 * 通信可能な場合は最新版を取得する．
 * 通信できない場合だけキャッシュを使う．
 */
self.addEventListener(
    "fetch",
    event => {
        if (
            event.request.method !== "GET"
        ) {
            return;
        }

        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    if (
                        !networkResponse ||
                        networkResponse.status !== 200
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
                })
                .catch(() => {
                    return caches.match(
                        event.request
                    );
                })
        );
    }
);