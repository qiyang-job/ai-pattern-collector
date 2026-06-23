const COS = require("cos-nodejs-sdk-v5");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ENV_ID = "patterncollector-d6e3o08821ba3ee";
const BUCKET = "7061-patterncollector-d6e3o08821ba3ee-1313643153";
const REGION = "ap-shanghai";
const ALLOWED_PREFIX = "screenshots/";

function createCos() {
  const secretId = process.env.TENCENTCLOUD_SECRETID;
  const secretKey = process.env.TENCENTCLOUD_SECRETKEY;
  if (!secretId || !secretKey) {
    throw new Error("云函数缺少存储凭证，无法上传录屏");
  }
  return new COS({
    SecretId: secretId,
    SecretKey: secretKey,
    SecurityToken: process.env.TENCENTCLOUD_SESSIONTOKEN,
  });
}

function buildFileID(cloudPath) {
  return `cloud://${ENV_ID}.${BUCKET}/${cloudPath}`;
}

function cloudPathFromFileID(fileID) {
  const prefix = `cloud://${ENV_ID}.${BUCKET}/`;
  if (typeof fileID !== "string" || !fileID.startsWith(prefix)) {
    throw new Error("非法 fileID");
  }
  return fileID.slice(prefix.length);
}

function assertCloudPath(cloudPath) {
  if (typeof cloudPath !== "string" || !cloudPath.startsWith(ALLOWED_PREFIX)) {
    throw new Error("非法上传路径");
  }
  if (!/^screenshots\/[0-9a-zA-Z/!._*\-]+\.[a-z0-9]+$/i.test(cloudPath)) {
    throw new Error("上传路径包含非法字符");
  }
}

function chunkPath(uploadId, index) {
  return path.join(os.tmpdir(), `upload-evidence-${uploadId}-${index}`);
}

function cleanupChunks(uploadId, totalChunks) {
  for (let i = 0; i < totalChunks; i++) {
    try {
      fs.unlinkSync(chunkPath(uploadId, i));
    } catch {
      /* ignore */
    }
  }
}

async function putObject(cloudPath, body, contentType) {
  const cos = createCos();
  await new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: BUCKET,
        Region: REGION,
        Key: cloudPath,
        Body: body,
        ContentType: contentType || "application/octet-stream",
      },
      (err, data) => (err ? reject(err) : resolve(data)),
    );
  });
}

async function getSignedUrl(cloudPath) {
  const cos = createCos();
  return new Promise((resolve, reject) => {
    cos.getObjectUrl(
      {
        Bucket: BUCKET,
        Region: REGION,
        Key: cloudPath,
        Sign: true,
        Expires: 3600,
      },
      (err, data) => (err ? reject(err) : resolve(data.Url)),
    );
  });
}

async function handleChunk(event) {
  const uploadId = String(event.uploadId || "");
  const cloudPath = String(event.cloudPath || "");
  const chunkIndex = Number(event.chunkIndex);
  const totalChunks = Number(event.totalChunks);
  const chunkBase64 = String(event.chunkBase64 || "");
  const contentType = String(event.contentType || "application/octet-stream");

  if (!uploadId || !Number.isInteger(chunkIndex) || !Number.isInteger(totalChunks) || totalChunks < 1) {
    return { error: "缺少上传分片参数" };
  }
  if (chunkIndex < 0 || chunkIndex >= totalChunks) {
    return { error: "分片索引无效" };
  }
  if (!chunkBase64) {
    return { error: "分片内容为空" };
  }

  assertCloudPath(cloudPath);
  const buf = Buffer.from(chunkBase64, "base64");
  fs.writeFileSync(chunkPath(uploadId, chunkIndex), buf);

  if (chunkIndex !== totalChunks - 1) {
    return { ok: true, received: chunkIndex };
  }

  const parts = [];
  for (let i = 0; i < totalChunks; i++) {
    parts.push(fs.readFileSync(chunkPath(uploadId, i)));
  }
  const full = Buffer.concat(parts);
  cleanupChunks(uploadId, totalChunks);

  await putObject(cloudPath, full, contentType);
  const fileID = buildFileID(cloudPath);
  const tempFileURL = await getSignedUrl(cloudPath);
  return { fileID, tempFileURL, size: full.length };
}

async function handleTempUrl(event) {
  const fileID = String(event.fileID || "");
  const cloudPath = cloudPathFromFileID(fileID);
  assertCloudPath(cloudPath);
  const tempFileURL = await getSignedUrl(cloudPath);
  return { tempFileURL };
}

exports.main = async (event) => {
  const action = event && event.action;

  try {
    if (action === "chunk") {
      return await handleChunk(event);
    }
    if (action === "temp-url") {
      return await handleTempUrl(event);
    }
    return { error: "未知 action" };
  } catch (error) {
    if (action === "chunk" && event?.uploadId && event?.totalChunks) {
      cleanupChunks(String(event.uploadId), Number(event.totalChunks));
    }
    return {
      error: error instanceof Error ? error.message : "录屏上传失败",
    };
  }
};
