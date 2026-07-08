// ====================================================
// VERSION CONTROL — do tarike combined
// ====================================================

// 1) MANUAL VERSION — jab bhi khud se force-update chahiye,
//    bas ye number badha dena (1 -> 2 -> 3...)
var MANUAL_VERSION = 17;

// 2) AUTO VERSION — mahina badalte hi khud-ba-khud badal jata hai
var now = new Date();
var AUTO_VERSION = now.getFullYear() + '-' + (now.getMonth() + 1);

// Dono ko milake final cache name banta hai
var CACHE_NAME = 'app-cache-' + AUTO_VERSION + '-v' + MANUAL_VERSION;

// Static files jo precache honi chahiye (apna khud ka code)
var STATIC_FILES = [
  '/deepak3/index.html',
  '/deepak3/admin.html',
  '/deepak3/chapter-order.html',
  '/deepak3/manifest.json',
  '/deepak3/logo2.png'
];

// ====================================================
// INSTALL — naya cache banate waqt static files download karo
// ====================================================
self.addEventListener('install', function (event) {
  self.skipWaiting(); // naya service worker turant activate hone do
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_FILES);
    })
  );
});

// ====================================================
// ACTIVATE — purane (alag naam wale) cache delete karo
// ====================================================
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (name) {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ====================================================
// FETCH — data calls hamesha network se, baaki cache-first
// ====================================================
self.addEventListener('fetch', function (event) {
  var url = event.request.url;

  // Firebase / Worker / questions data — kabhi cache mat karo,
  // hamesha fresh data network se aana chahiye
  if (
    url.indexOf('firebasedatabase.app') !== -1 ||
    url.indexOf('workers.dev') !== -1 ||
    url.indexOf('questions/') !== -1
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Baaki sab (apna code, fonts, mathjax) — cache-first,
  // pehli baar mile to cache me save kar lo
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        return caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
