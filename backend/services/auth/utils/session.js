import crypto from "node:crypto";
import { redis } from "../../../shared/redis/redis.js";

export const createSession = async (user) => {
  const sessionID = crypto.randomUUID();

  await redis.set(
    `session:${sessionID}`,
    JSON.stringify({
      name: user.name,
      email: user.email,
      _id: user._id,
      avatar: user.avatar || "",
    }),
    "EX",
    7 * 24 * 60 * 60
  );

  return sessionID;
};

export const setSessionCookie = (res, sessionID) => {
  res.cookie("session", sessionID, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};