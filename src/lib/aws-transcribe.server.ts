/**
 * Minimal AWS SigV4 signer + AWS Transcribe Medical (batch) client.
 * Worker-safe: uses only fetch + Web Crypto, no AWS SDK.
 */

type Creds = { accessKeyId: string; secretAccessKey: string; region: string; bucket: string };

export function getAwsConfig(): Creds {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_TRANSCRIBE_BUCKET;
  if (!accessKeyId || !secretAccessKey || !region || !bucket) {
    throw new Error(
      "Voice dictation is not configured yet. Missing AWS credentials or bucket on the server.",
    );
  }
  return { accessKeyId, secretAccessKey, region, bucket };
}

const enc = new TextEncoder();

async function sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  const buf = typeof data === "string" ? enc.encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", buf as BufferSource);
  return hex(new Uint8Array(digest));
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(key: ArrayBuffer | Uint8Array, msg: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return new Uint8Array(sig);
}

function amzDate(d = new Date()) {
  const iso = d.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amz: iso, date: iso.slice(0, 8) };
}

/** Signs and executes a request against an AWS service. */
async function signedFetch(opts: {
  creds: Creds;
  service: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: Uint8Array | string;
}): Promise<Response> {
  const { creds, service, method, url } = opts;
  const u = new URL(url);
  const { amz, date } = amzDate();
  const payload = opts.body ?? "";
  const payloadHash = await sha256Hex(payload);

  const headers: Record<string, string> = {
    host: u.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amz,
    ...Object.fromEntries(Object.entries(opts.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])),
  };

  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames.map((k) => `${k}:${headers[k].trim()}\n`).join("");
  const signedHeaders = signedHeaderNames.join(";");

  const canonicalQuery = Array.from(u.searchParams.entries())
    .map(([k, v]) => [encodeURIComponent(k), encodeURIComponent(v)] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const canonicalRequest = [
    method,
    u.pathname.split("/").map((s) => encodeURIComponent(decodeURIComponent(s))).join("/"),
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${date}/${creds.region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amz,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  let key = await hmac(enc.encode(`AWS4${creds.secretAccessKey}`), date);
  key = await hmac(key, creds.region);
  key = await hmac(key, service);
  key = await hmac(key, "aws4_request");
  const signature = hex(await hmac(key, stringToSign));

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(u.toString(), {
    method,
    headers: { ...headers, Authorization: authorization },
    body: method === "GET" || method === "HEAD" ? undefined : (payload as BodyInit),
  });
}

function s3Url(creds: Creds, key: string) {
  return `https://${creds.bucket}.s3.${creds.region}.amazonaws.com/${key}`;
}

export async function uploadAudio(
  creds: Creds, key: string, audio: Uint8Array, contentType: string,
): Promise<string> {
  const res = await signedFetch({
    creds, service: "s3", method: "PUT", url: s3Url(creds, key),
    headers: { "content-type": contentType }, body: audio,
  });
  if (!res.ok) throw new Error(`Audio upload failed (${res.status}): ${await res.text()}`);
  return `s3://${creds.bucket}/${key}`;
}

async function transcribeApi(creds: Creds, target: string, body: unknown) {
  const res = await signedFetch({
    creds,
    service: "transcribe",
    method: "POST",
    url: `https://transcribe.${creds.region}.amazonaws.com/`,
    headers: { "content-type": "application/x-amz-json-1.1", "x-amz-target": `Transcribe.${target}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Transcribe ${target} failed (${res.status}): ${text}`);
  return JSON.parse(text || "{}");
}

/** Uploads audio, runs a Transcribe Medical dictation job, and returns the transcript text. */
export async function transcribeMedicalAudio(
  audio: Uint8Array, mediaFormat: string, contentType: string,
): Promise<string> {
  const creds = getAwsConfig();
  const jobName = `clinsole-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const key = `dictation/${jobName}.${mediaFormat}`;

  const mediaUri = await uploadAudio(creds, key, audio, contentType);

  await transcribeApi(creds, "StartMedicalTranscriptionJob", {
    MedicalTranscriptionJobName: jobName,
    LanguageCode: "en-US",
    MediaFormat: mediaFormat,
    Media: { MediaFileUri: mediaUri },
    OutputBucketName: creds.bucket,
    OutputKey: `transcripts/${jobName}.json`,
    Specialty: "PRIMARYCARE",
    Type: "DICTATION",
  });

  const deadline = Date.now() + 110_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await transcribeApi(creds, "GetMedicalTranscriptionJob", {
      MedicalTranscriptionJobName: jobName,
    });
    const job = res?.MedicalTranscriptionJob ?? {};
    if (job.TranscriptionJobStatus === "COMPLETED") {
      const out = await signedFetch({
        creds, service: "s3", method: "GET",
        url: s3Url(creds, `transcripts/${jobName}.json`),
      });
      if (!out.ok) throw new Error(`Could not read transcript (${out.status})`);
      const json = await out.json();
      return json?.results?.transcripts?.map((t: any) => t.transcript).join(" ").trim() ?? "";
    }
    if (job.TranscriptionJobStatus === "FAILED") {
      throw new Error(job.FailureReason || "Transcription job failed");
    }
  }
  throw new Error("Transcription timed out. Please try a shorter recording or type your notes.");
}

/** AWS Transcribe Medical list price: $0.075 per minute. */
export function estimateCost(durationSeconds: number): number {
  return Math.round((durationSeconds / 60) * 0.075 * 10000) / 10000;
}
