const COS = require("cos-nodejs-sdk-v5");

exports.main = async () => {
  const Bucket = "7061-patterncollector-d6e3o08821ba3ee-1313643153";
  const Region = "ap-shanghai";
  const cos = new COS({
    SecretId: process.env.TENCENTCLOUD_SECRETID,
    SecretKey: process.env.TENCENTCLOUD_SECRETKEY,
    SecurityToken: process.env.TENCENTCLOUD_SESSIONTOKEN,
  });

  const getBucket = (Prefix) =>
    new Promise((resolve, reject) => {
      cos.getBucket(
        { Bucket, Region, Prefix, MaxKeys: 1000 },
        (err, data) => (err ? reject(err) : resolve(data)),
      );
    });

  const signUrl = (Key) =>
    new Promise((resolve, reject) => {
      cos.getObjectUrl(
        { Bucket, Region, Key, Sign: true, Expires: 3600 },
        (err, data) => (err ? reject(err) : resolve(data.Url)),
      );
    });

  try {
    const all = await getBucket("");
    const list = (all.Contents || []).filter((c) => Number(c.Size) > 0);
    const files = [];
    for (const c of list) {
      files.push({
        Key: c.Key,
        Size: Number(c.Size),
        LastModified: c.LastModified,
        url: await signUrl(c.Key),
      });
    }
    return { ok: true, totalObjects: files.length, files };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e), code: e && e.code };
  }
};
