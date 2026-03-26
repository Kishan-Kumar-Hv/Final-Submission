import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import express from "express";
import { CROPS_DATA, findMatchingCrop, guessHarvestTypeForCrop } from "../src/data/constants.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dbPath = path.resolve(rootDir, process.env.DB_PATH || "./data/raitha-reach.sqlite");
const port = Number(process.env.PORT || 8787);
const validStores = new Set(["users", "crops", "jobs"]);
const aiConfig = {
  apiKey: process.env.OPENAI_API_KEY || "",
  visionModel: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
  fallbackModel: process.env.OPENAI_VISION_FALLBACK_MODEL || "gpt-4o-mini",
  minConfidence: Math.max(0, Math.min(1, Number(process.env.OPENAI_VISION_MIN_CONFIDENCE || 0.45))),
};
const smsConfig = {
  enabled: process.env.SMS_ENABLED === "true",
  provider: (process.env.SMS_PROVIDER || "msg91").toLowerCase(),
  apiUrl: process.env.SMS_API_URL || "",
  apiKey: process.env.SMS_API_KEY || "",
  apiKeyHeader: process.env.SMS_API_KEY_HEADER || "x-api-key",
  senderId: process.env.SMS_SENDER_ID || "RAITHA",
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || process.env.SMS_API_KEY || "",
    senderId: process.env.MSG91_SENDER_ID || process.env.SMS_SENDER_ID || "RAITHA",
    countryCode: String(process.env.MSG91_COUNTRY_CODE || "91").replace(/\D/g, "") || "91",
    smsRoute: process.env.MSG91_SMS_ROUTE || "4",
    smsApiUrl: process.env.MSG91_SMS_API_URL || "https://api.msg91.com/api/v2/sendsms",
    otpApiUrl: process.env.MSG91_OTP_API_URL || "https://control.msg91.com/api/v5/otp",
    otpTemplateId: process.env.MSG91_OTP_TEMPLATE_ID || "",
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || "",
    fromNumber: process.env.TWILIO_FROM_NUMBER || "",
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || "",
    countryCode: String(process.env.TWILIO_COUNTRY_CODE || "91").replace(/\D/g, "") || "91",
  },
};

const CROP_SCAN_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    cropName: {
      type: ["string", "null"],
      enum: [...CROPS_DATA.map(crop => crop.c), null],
      description: "Closest crop match from the allowed catalog, or null if unclear.",
    },
    harvestType: {
      type: ["string", "null"],
      enum: ["regrows", "single_harvest", null],
      description: "Whether the crop typically regrows after harvest or needs full replanting.",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Confidence score between 0 and 1.",
    },
    summary: {
      type: "string",
      description: "One short sentence describing the visible crop clue.",
    },
    visibleFeatures: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
      description: "Short visible clues from the image.",
    },
  },
  required: ["cropName", "harvestType", "confidence", "summary", "visibleFeatures"],
};

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
const otpSessions = new Map();

for (const store of validStores) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${store} (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
}

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));

function ensureStore(store) {
  if (!validStores.has(store)) {
    const error = new Error(`Unknown store "${store}"`);
    error.status = 404;
    throw error;
  }
}

function parseRow(row) {
  return row ? JSON.parse(row.data) : null;
}

function otpSessionKey(phone, purpose) {
  return `${normalizeLocalPhone(phone)}:${purpose || "login"}`;
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function saveOtpSession(phone, purpose, code) {
  const key = otpSessionKey(phone, purpose);
  otpSessions.set(key, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
}

function verifyOtpSession(phone, purpose, otp) {
  const key = otpSessionKey(phone, purpose);
  const session = otpSessions.get(key);

  if (!session) {
    return { ok: false, error: "OTP expired or not found. Please request a new OTP." };
  }

  if (Date.now() > session.expiresAt) {
    otpSessions.delete(key);
    return { ok: false, error: "OTP expired. Please request a new OTP." };
  }

  if (String(otp || "").trim() !== session.code) {
    return { ok: false, error: "Invalid OTP. Please try again." };
  }

  otpSessions.delete(key);
  return { ok: true };
}

function normalizeLocalPhone(value) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

function toInternationalPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `${smsConfig.msg91.countryCode}${digits}`;
  if (digits.startsWith(smsConfig.msg91.countryCode)) return digits;
  return digits;
}

function toTwilioPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+${smsConfig.twilio.countryCode}${digits}`;
  if (digits.startsWith(smsConfig.twilio.countryCode)) return `+${digits}`;
  return `+${digits}`;
}

function isUnicodeMessage(value) {
  return /[^\u0000-\u007f]/.test(String(value || ""));
}

async function readResponseBody(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
}

function twilioAuthHeader() {
  const token = Buffer.from(`${smsConfig.twilio.accountSid}:${smsConfig.twilio.authToken}`).toString("base64");
  return `Basic ${token}`;
}

function extractResponseText(responseBody) {
  return (responseBody?.output || [])
    .flatMap(item => item?.content || [])
    .filter(content => content?.type === "output_text")
    .map(content => content?.text || "")
    .join("\n")
    .trim();
}

function buildCropCatalogPrompt() {
  return CROPS_DATA
    .map(crop => {
      const aliasLine = crop.aliases?.length ? `; aliases: ${crop.aliases.join(", ")}` : "";
      return `- ${crop.c} (${crop.cat})${aliasLine}`;
    })
    .join("\n");
}

function buildCropScanInstruction() {
  return [
    "Identify the crop shown in this farmer-uploaded listing image.",
    "Choose only from the allowed crop catalog below. If the image is unclear or not a crop photo, return cropName as null and keep confidence low.",
    'Recommend harvestType as "regrows" when the plant usually stays and can bear again, or "single_harvest" when it usually needs replanting after harvest.',
    "Allowed crop catalog:",
    buildCropCatalogPrompt(),
  ].join("\n\n");
}

function normalizeCropScanResult(parsed, { model, strategy }) {
  const matchedCrop = parsed?.cropName ? findMatchingCrop(parsed.cropName, CROPS_DATA) : null;

  return {
    cropName: matchedCrop?.c || null,
    category: matchedCrop?.cat || "",
    emoji: matchedCrop?.e || "🌾",
    harvestType: parsed?.harvestType || guessHarvestTypeForCrop(matchedCrop?.c, matchedCrop?.cat),
    confidence: Math.max(0, Math.min(1, Number(parsed?.confidence || 0))),
    summary: String(parsed?.summary || "").trim(),
    visibleFeatures: Array.isArray(parsed?.visibleFeatures)
      ? parsed.visibleFeatures.map(item => String(item || "").trim()).filter(Boolean).slice(0, 4)
      : [],
    model,
    provider: "openai",
    strategy,
  };
}

function shouldRetryCropScan(result) {
  return !result?.cropName || Number(result?.confidence || 0) < aiConfig.minConfidence;
}

function selectBestCropScanResult(results = []) {
  return [...results]
    .filter(Boolean)
    .sort((left, right) => {
      if (Boolean(left.cropName) !== Boolean(right.cropName)) {
        return Number(Boolean(right.cropName)) - Number(Boolean(left.cropName));
      }

      return Number(right.confidence || 0) - Number(left.confidence || 0);
    })[0] || null;
}

async function scanCropPhotoWithResponses(imageDataUrl, model) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiConfig.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_output_tokens: 400,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildCropScanInstruction(),
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "high",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "crop_photo_analysis",
          schema: CROP_SCAN_RESPONSE_SCHEMA,
        },
      },
    }),
  });

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(`OpenAI crop scan failed: ${response.status} ${JSON.stringify(responseBody)}`);
  }

  const rawText = extractResponseText(responseBody);
  if (!rawText) {
    throw new Error("Crop photo scan returned an empty result.");
  }

  return normalizeCropScanResult(JSON.parse(rawText), {
    model,
    strategy: "openai_responses_primary",
  });
}

async function scanCropPhotoWithChatFallback(imageDataUrl, model) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiConfig.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_completion_tokens: 400,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "crop_photo_analysis",
          strict: true,
          schema: CROP_SCAN_RESPONSE_SCHEMA,
        },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildCropScanInstruction(),
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
    }),
  });

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(`OpenAI fallback crop scan failed: ${response.status} ${JSON.stringify(responseBody)}`);
  }

  const rawText = String(responseBody?.choices?.[0]?.message?.content || "").trim();
  if (!rawText) {
    throw new Error("Fallback crop scan returned an empty result.");
  }

  return normalizeCropScanResult(JSON.parse(rawText), {
    model,
    strategy: "openai_chat_fallback",
  });
}

async function analyzeCropPhoto(imageDataUrl) {
  if (!aiConfig.apiKey) {
    const error = new Error("Crop photo scan needs OPENAI_API_KEY in your .env file.");
    error.status = 503;
    throw error;
  }

  const attempts = [];
  let primaryError = null;
  let primaryResult = null;

  try {
    primaryResult = await scanCropPhotoWithResponses(imageDataUrl, aiConfig.visionModel);
    attempts.push(primaryResult.strategy);

    if (!shouldRetryCropScan(primaryResult) || !aiConfig.fallbackModel) {
      return {
        ...primaryResult,
        scanPath: "primary",
        attempts,
      };
    }
  } catch (error) {
    primaryError = error;
  }

  if (!aiConfig.fallbackModel) {
    throw primaryError || new Error("Crop photo scan could not complete.");
  }

  try {
    const fallbackResult = await scanCropPhotoWithChatFallback(imageDataUrl, aiConfig.fallbackModel);
    attempts.push(fallbackResult.strategy);
    const bestResult = selectBestCropScanResult([fallbackResult, primaryResult]) || fallbackResult;

    return {
      ...bestResult,
      scanPath: bestResult.strategy === fallbackResult.strategy ? "fallback" : "primary",
      attempts,
    };
  } catch (fallbackError) {
    if (primaryResult?.cropName) {
      return {
        ...primaryResult,
        scanPath: "primary",
        attempts,
      };
    }

    const error = new Error(
      [
        primaryError?.message,
        fallbackError?.message,
      ].filter(Boolean).join(" | ") || "Crop photo scan failed."
    );
    error.status = primaryError?.status || fallbackError?.status || 502;
    throw error;
  }
}

async function twilioFormRequest(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: twilioAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(`Twilio request failed: ${response.status} ${JSON.stringify(responseBody)}`);
  }

  return responseBody;
}

async function sendSmsViaGeneric({ to, message, event = "general" }) {
  const phone = String(to || "").replace(/\D/g, "").slice(-10);

  if (!phone || !message) {
    return { ok: false, mode: "skipped" };
  }

  if (!smsConfig.apiUrl || !smsConfig.apiKey) {
    console.log(`[sms:mock] ${event} -> ${phone}: ${message}`);
    return { ok: true, mode: "mock", provider: "generic" };
  }

  const response = await fetch(smsConfig.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [smsConfig.apiKeyHeader]: smsConfig.apiKey,
    },
    body: JSON.stringify({
      to: phone,
      message,
      senderId: smsConfig.senderId,
      event,
    }),
  });

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(`SMS request failed: ${response.status} ${JSON.stringify(responseBody)}`);
  }

  return { ok: true, mode: "live", provider: "generic", response: responseBody };
}

async function sendSmsViaMsg91({ to, message, event = "general" }) {
  const phone = normalizeLocalPhone(to);
  if (!phone || !message) {
    return { ok: false, mode: "skipped", provider: "msg91" };
  }

  if (!smsConfig.msg91.authKey) {
    throw new Error("MSG91 auth key is missing. Add MSG91_AUTH_KEY to your env file.");
  }

  const mobile = toInternationalPhone(phone);
  const payload = {
    sender: smsConfig.msg91.senderId,
    route: smsConfig.msg91.smsRoute,
    country: smsConfig.msg91.countryCode,
    sms: [
      {
        message,
        to: [mobile],
      },
    ],
  };

  if (isUnicodeMessage(message)) {
    payload.unicode = 1;
  }

  const response = await fetch(smsConfig.msg91.smsApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: smsConfig.msg91.authKey,
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(`MSG91 SMS failed: ${response.status} ${JSON.stringify(responseBody)}`);
  }

  return { ok: true, mode: "live", provider: "msg91", event, response: responseBody };
}

async function sendOtpViaMsg91({ to, otp, purpose = "login" }) {
  const phone = normalizeLocalPhone(to);
  if (!phone || !otp) {
    return { ok: false, mode: "skipped", provider: "msg91" };
  }

  if (!smsConfig.msg91.authKey) {
    throw new Error("MSG91 auth key is missing. Add MSG91_AUTH_KEY to your env file.");
  }

  if (!smsConfig.msg91.otpTemplateId) {
    throw new Error("MSG91 OTP template is missing. Add MSG91_OTP_TEMPLATE_ID to your env file.");
  }

  const url = new URL(smsConfig.msg91.otpApiUrl);
  url.searchParams.set("authkey", smsConfig.msg91.authKey);
  url.searchParams.set("template_id", smsConfig.msg91.otpTemplateId);
  url.searchParams.set("mobile", toInternationalPhone(phone));
  url.searchParams.set("otp", String(otp));
  url.searchParams.set("sender", smsConfig.msg91.senderId);

  const response = await fetch(url, { method: "POST" });
  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(`MSG91 OTP failed: ${response.status} ${JSON.stringify(responseBody)}`);
  }

  return { ok: true, mode: "live", provider: "msg91", purpose, response: responseBody };
}

async function sendSmsViaTwilio({ to, message, event = "general" }) {
  const phone = normalizeLocalPhone(to);
  if (!phone || !message) {
    return { ok: false, mode: "skipped", provider: "twilio" };
  }

  if (!smsConfig.twilio.accountSid || !smsConfig.twilio.authToken) {
    throw new Error("Twilio credentials are missing. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your env file.");
  }

  if (!smsConfig.twilio.fromNumber && !smsConfig.twilio.messagingServiceSid) {
    throw new Error("Twilio sender is missing. Add TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID to your env file.");
  }

  const body = {
    To: toTwilioPhone(phone),
    Body: message,
  };

  if (smsConfig.twilio.messagingServiceSid) {
    body.MessagingServiceSid = smsConfig.twilio.messagingServiceSid;
  } else {
    body.From = smsConfig.twilio.fromNumber;
  }

  const responseBody = await twilioFormRequest(
    `https://api.twilio.com/2010-04-01/Accounts/${smsConfig.twilio.accountSid}/Messages.json`,
    body
  );

  return { ok: true, mode: "live", provider: "twilio", event, response: responseBody };
}

async function sendOtpViaTwilio({ to, purpose = "login" }) {
  const phone = normalizeLocalPhone(to);
  if (!phone) {
    return { ok: false, mode: "skipped", provider: "twilio" };
  }

  if (!smsConfig.twilio.accountSid || !smsConfig.twilio.authToken) {
    throw new Error("Twilio credentials are missing. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your env file.");
  }

  if (!smsConfig.twilio.verifyServiceSid) {
    throw new Error("Twilio Verify Service SID is missing. Add TWILIO_VERIFY_SERVICE_SID to your env file.");
  }

  const responseBody = await twilioFormRequest(
    `https://verify.twilio.com/v2/Services/${smsConfig.twilio.verifyServiceSid}/Verifications`,
    {
      To: toTwilioPhone(phone),
      Channel: "sms",
    }
  );

  return { ok: true, mode: "live", provider: "twilio", purpose, response: responseBody };
}

async function verifyOtpViaTwilio({ to, otp, purpose = "login" }) {
  const phone = normalizeLocalPhone(to);
  if (!phone || !otp) {
    return { ok: false, error: "OTP expired or not found. Please request a new OTP." };
  }

  if (!smsConfig.twilio.accountSid || !smsConfig.twilio.authToken) {
    throw new Error("Twilio credentials are missing. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your env file.");
  }

  if (!smsConfig.twilio.verifyServiceSid) {
    throw new Error("Twilio Verify Service SID is missing. Add TWILIO_VERIFY_SERVICE_SID to your env file.");
  }

  const responseBody = await twilioFormRequest(
    `https://verify.twilio.com/v2/Services/${smsConfig.twilio.verifyServiceSid}/VerificationCheck`,
    {
      To: toTwilioPhone(phone),
      Code: String(otp),
    }
  );

  if (responseBody?.status !== "approved" && responseBody?.valid !== true) {
    return { ok: false, error: "Invalid OTP. Please try again." };
  }

  return { ok: true, provider: "twilio", purpose, response: responseBody };
}

async function sendSms(payload) {
  const phone = normalizeLocalPhone(payload?.to);
  const message = String(payload?.message || "");
  const event = payload?.event || "general";

  if (!phone || !message) {
    return { ok: false, mode: "skipped" };
  }

  if (!smsConfig.enabled) {
    console.log(`[sms:mock] ${event} -> ${phone}: ${message}`);
    return { ok: true, mode: "mock", provider: smsConfig.provider };
  }

  if (smsConfig.provider === "msg91") {
    return sendSmsViaMsg91({ to: phone, message, event });
  }

  if (smsConfig.provider === "twilio") {
    return sendSmsViaTwilio({ to: phone, message, event });
  }

  return sendSmsViaGeneric({ to: phone, message, event });
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    dbPath,
    stores: [...validStores],
    smsEnabled: smsConfig.enabled,
    smsProvider: smsConfig.provider,
    msg91OtpReady: Boolean(smsConfig.msg91.authKey && smsConfig.msg91.otpTemplateId),
    twilioOtpReady: Boolean(smsConfig.twilio.accountSid && smsConfig.twilio.authToken && smsConfig.twilio.verifyServiceSid),
    cropScanReady: Boolean(aiConfig.apiKey),
    cropScanModel: aiConfig.visionModel,
    cropScanFallbackModel: aiConfig.fallbackModel,
    cropScanMinConfidence: aiConfig.minConfidence,
  });
});

app.post("/api/notify/sms", async (req, res, next) => {
  try {
    const result = await sendSms(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/ai/crop-photo", async (req, res, next) => {
  try {
    const imageDataUrl = String(req.body?.imageDataUrl || "");

    if (!imageDataUrl.startsWith("data:image/")) {
      const error = new Error("Please upload a valid crop image.");
      error.status = 400;
      throw error;
    }

    const result = await analyzeCropPhoto(imageDataUrl);

    if (!result.cropName) {
      res.status(422).json({
        error: "Could not confidently recognize this crop after the primary and fallback scan. Try a clearer photo or enter the crop name manually.",
      });
      return;
    }

    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

app.get("/api/:store", (req, res, next) => {
  try {
    const { store } = req.params;
    ensureStore(store);

    const rows = db
      .prepare(`SELECT data FROM ${store} ORDER BY updated_at DESC`)
      .all();

    res.json(rows.map(parseRow).filter(Boolean));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/:store", (req, res, next) => {
  try {
    const { store } = req.params;
    ensureStore(store);

    db.prepare(`DELETE FROM ${store}`).run();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/request-otp", async (req, res, next) => {
  try {
    const phone = String(req.body?.phone || "");
    const purpose = req.body?.purpose || "login";
    const otp = String(req.body?.otp || generateOtpCode());
    let result;

    if (smsConfig.enabled && smsConfig.provider === "msg91") {
      saveOtpSession(phone, purpose, otp);
      result = await sendOtpViaMsg91({ to: phone, otp, purpose });
    } else if (smsConfig.enabled && smsConfig.provider === "twilio") {
      result = await sendOtpViaTwilio({ to: phone, purpose });
    } else {
      saveOtpSession(phone, purpose, otp);
      result = await sendSms({
        to: phone,
        event: `otp_${purpose}`,
        message: `Raitha Reach OTP: ${otp}. Use this code to continue.`,
      });
    }

    res.json({
      ...result,
      mockCode: result.mode === "mock" ? otp : "",
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/verify-otp", async (req, res, next) => {
  try {
    const phone = String(req.body?.phone || "");
    const otp = String(req.body?.otp || "");
    const purpose = req.body?.purpose || "login";

    const result = smsConfig.enabled && smsConfig.provider === "twilio"
      ? await verifyOtpViaTwilio({ to: phone, otp, purpose })
      : verifyOtpSession(phone, purpose, otp);

    if (!result.ok) {
      res.status(400).json(result);
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/:store/:id", (req, res, next) => {
  try {
    const { store, id } = req.params;
    ensureStore(store);

    const row = db.prepare(`SELECT data FROM ${store} WHERE id = ?`).get(id);
    const item = parseRow(row);

    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

app.put("/api/:store/:id", (req, res, next) => {
  try {
    const { store, id } = req.params;
    ensureStore(store);

    const payload = typeof req.body === "object" && req.body !== null
      ? { ...req.body, id }
      : { id };

    const now = Date.now();
    const existing = db
      .prepare(`SELECT created_at FROM ${store} WHERE id = ?`)
      .get(id);

    db.prepare(`
      INSERT INTO ${store} (id, data, created_at, updated_at)
      VALUES (@id, @data, @createdAt, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at
    `).run({
      id,
      data: JSON.stringify(payload),
      createdAt: existing?.created_at || now,
      updatedAt: now,
    });

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/:store/:id", (req, res, next) => {
  try {
    const { store, id } = req.params;
    ensureStore(store);

    db.prepare(`DELETE FROM ${store} WHERE id = ?`).run(id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).json({
    error: error.message || "Server error",
  });
});

const server = app.listen(port, () => {
  console.log(`Raitha Reach local API running on http://127.0.0.1:${port}`);
  console.log(`SQLite database: ${dbPath}`);
  console.log(`SMS mode: ${smsConfig.enabled ? `live (${smsConfig.provider})` : "mock"}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
