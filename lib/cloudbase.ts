import cloudbase from "@cloudbase/js-sdk";

const ENV_ID = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID ?? "";
const REGION = process.env.NEXT_PUBLIC_CLOUDBASE_REGION ?? "ap-shanghai";
const ACCESS_KEY = process.env.NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY;

let _app: ReturnType<typeof cloudbase.init> | null = null;
let _auth: ReturnType<ReturnType<typeof cloudbase.init>["auth"]> | null = null;

/** 获取 CloudBase app 实例（懒加载，仅客户端） */
export function getApp() {
  if (!_app) {
    if (typeof window === "undefined") throw new Error("CloudBase SDK 仅可在浏览器端使用");
    _app = cloudbase.init({
      env: ENV_ID,
      region: REGION,
      ...(ACCESS_KEY ? { accessKey: ACCESS_KEY } : {}),
      persistence: "local",
    });
    _auth = _app.auth();
  }
  return _app;
}

/** 获取 auth 实例 */
export function getAuth() {
  getApp();
  return _auth!;
}

/** 获取 database 实例 */
export function getDb() {
  return getApp().database();
}

/**
 * 调用云函数（替代原 API Route）
 * @param name 云函数名
 * @param data 传入参数
 * @returns 云函数返回结果
 */
export async function callCloudFunction<T = unknown>(name: string, data: Record<string, unknown>): Promise<T> {
  const app = getApp();
  console.log(`[CloudBase] 调用云函数: ${name}`, { dataKeys: Object.keys(data), dataSize: JSON.stringify(data).length });
  
  try {
    const res = await app.callFunction({ name, data });
    
    // 打印完整响应结构（不含大数据）
    const rawResult = res?.result;
    const logSafeResult = (() => {
      if (!rawResult) return null;
      const s = JSON.stringify(rawResult);
      return s.length > 2000 ? s.slice(0, 2000) + `...(total ${s.length} chars)` : s;
    })();
    console.log(`[CloudBase] 云函数 ${name} 原始 res.result:`, logSafeResult);
    
    // CloudBase Web SDK 的 callFunction 返回格式：
    // 成功时：res.result 直接是云函数 exports.main 的返回值
    // 失败时：res.result 可能包含 { code, error }
    let result: any = rawResult;
    
    // 如果结果是字符串（某些情况下 RetMsg 可能未解析），尝试解析
    if (typeof result === "string") {
      try { result = JSON.parse(result); } catch { /* keep as-is */ }
    }
    
    // 检查 SDK 层错误
    if (result?.code !== undefined && result?.code !== null && result?.code !== 0) {
      throw new Error(result?.error || `云函数错误(code=${result?.code})`);
    }
    // 业务错误
    if (result?.error && !("code" in result)) {
      throw new Error(String(result.error));
    }
    
    // 移除内部字段，保留业务数据
    const { error: _err, code: _code, requestId: _reqId, ...rest } = result || {};
    
    console.log(`[CloudBase] 云函数 ${name} 提取的业务数据 keys:`, Object.keys(rest));
    
    // 如果 rest 为空但有原始数据，可能是字段名不匹配，直接返回全部
    if (Object.keys(rest).length === 0 && result && typeof result === "object") {
      console.warn(`[CloudBase] 提取后为空，直接返回原始数据`);
      return result;
    }
    
    return rest;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`[CloudBase] 云函数 ${name} 调用失败:`, err.message);
      throw err;
    }
    console.error(`[CloudBase] 云函数 ${name} 未知错误:`, err);
    throw new Error("云函数调用异常");
  }
}

let _anonymousPromise: Promise<void> | null = null;

/** 确保已匿名登录（幂等，多次调用安全） */
export async function ensureAuth(): Promise<void> {
  if (_anonymousPromise) return _anonymousPromise;

  _anonymousPromise = (async () => {
    const auth = getAuth();
    const { data } = await auth.getSession();
    if (data?.session) return; // 已登录

    const { error } = await auth.signInAnonymously();
    if (error) {
      _anonymousPromise = null; // 允许重试
      throw new Error(`匿名登录失败: ${error.message}`);
    }
  })();

  return _anonymousPromise;
}
