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
  const res = await app.callFunction({ name, data });
  const result = res.result as { code?: number; error?: string } & T;
  if (result.code && result.code !== 0) throw new Error(result.error || "云函数调用失败");
  if (result.error && !("code" in result)) throw new Error(result.error);
  // 移除内部字段，只返回业务数据
  const { error: _err, code: _code, ...rest } = result as any;
  return rest;
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
