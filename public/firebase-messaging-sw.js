// FCM service worker. The server sends data-only messages ({ title, body, url }); we render them here,
// so this file needs no Firebase SDK or config.
self.addEventListener("push", (event) => {
  let msg = {};
  try {
    msg = event.data.json();
  } catch {}
  const d = msg.data ?? msg.notification ?? {};
  event.waitUntil(
    self.registration.showNotification(d.title ?? "JanVaani", {
      body: d.body ?? "",
      icon: "/logo.png",
      data: { url: d.url ?? "/citizen" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? "/citizen", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => w.url.startsWith(self.location.origin));
      return open ? open.navigate(url).then((w) => w?.focus()) : self.clients.openWindow(url);
    }),
  );
});
