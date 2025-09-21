import Client from "prom-client";


export const onlineUsersGauge = new Client.Gauge({
  name: "online_users",
  help: "Number of users currently connected via WebSocket",
});

// Initialize with 0
onlineUsersGauge.set(0);

export const setOnlineUsers = (count: number) => {
  onlineUsersGauge.set(count);
};

const requestCount = new Client.Counter({
  name: "request_count",
  help: "Total number of requests received",
  labelNames: ["method", "route", "status_code"],
});

const activeGauge = new Client.Gauge({
  name: "active_requests",
  help: "Number of active HTTP requests",
  labelNames: ["method", "route"],
});

// Track all current requests in memory
let activeRequests = 0;

//@ts-ignore
export const requestCounter = (req, res, next) => {
  res.on("finish", () => {
    requestCount.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode.toString(),
    });
  });
  next();
};

//@ts-ignore
export const getActiveGauge = (req, res, next) => {
  activeRequests++;
  activeGauge.set(
    { method: req.method, route: req.route ? req.route.path : req.path },
    activeRequests
  );

  res.on("finish", () => {
    activeRequests = Math.max(0, activeRequests - 1); // never go below 0
    activeGauge.set(
      { method: req.method, route: req.route ? req.route.path : req.path },
      activeRequests
    );
  });

  next();
};

export const httpDuringMilliSeconds = new Client.Histogram({
  name: "http_duration_milliseconds",
  help: "Duration of HTTP requests in milliseconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 5, 15, 50, 100, 300, 500, 1000, 3000, 5000],
});

//@ts-ignore
export const httpDurationMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const endTime = Date.now();
    httpDuringMilliSeconds.observe(
      {
        method: req.method,
        route: req.route ? req.route.path : req.path,
        status_code: res.statusCode.toString(),
      },
      (endTime - start) // correct: duration = end - start
    );
  });
  next();
};
