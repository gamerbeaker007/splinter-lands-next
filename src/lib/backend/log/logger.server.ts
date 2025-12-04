import path from "path";
import { createLogger, format, transports } from "winston";

const isDev = process.env.NODE_ENV !== "production";

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.printf(
      ({ level, message, timestamp }) => `${timestamp} [${level}] ${message}`,
    ),
  ),
  transports: [
    new transports.File({
      filename: path.resolve("logs/app.log"),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
    }),
    ...(isDev
      ? [
          new transports.Console({
            format: format.combine(
              format.colorize(),
              format.printf(
                ({ level, message, timestamp }) =>
                  `${timestamp} [${level}] ${message}`,
              ),
            ),
          }),
        ]
      : []),
  ],
});

export default logger;
