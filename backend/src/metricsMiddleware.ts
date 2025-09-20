import { Request, Response, NextFunction } from "express";
import { httpRequestsTotal, httpRequestDurationSeconds } from "./metrics";

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const endTimer = httpRequestDurationSeconds.startTimer();

  res.on("finish", () => {
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path, 
      status: res.statusCode,
    });
    endTimer({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
    });
  });

  next();
}
