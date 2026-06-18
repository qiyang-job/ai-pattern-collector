import cloudbase from "@cloudbase/js-sdk";

const ENV_ID = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID ?? "";
const REGION = process.env.NEXT_PUBLIC_CLOUDBASE_REGION ?? "ap-shanghai";
// Publishable Key（公开安全，可硬编码兜底，保证静态构建一定带上）
const FALLBACK_ACCESS_KEY =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL3BhdHRlcm5jb2xsZWN0b3ItZDZlM28wODgyMWJhM2VlLmFwLXNoYW5naGFpLnRjYi1hcGkudGVuY2VudGNsb3VkYXBpLmNvbSIsInN1YiI6ImFub24iLCJhdWQiOiJwYXR0ZXJuY29sbGVjdG9yLWQ2ZTNvMDg4MjFiYTNlZSIsImV4cCI6NDA4NTMyMDk0MSwiaWF0IjoxNzgxNjM3NzQxLCJub25jZSI6ImlWZm9ZTklBUkphdXkzS19ndlg1T3ciLCJhdF9oYXNoIjoiaVZmb1lOSUFSSmF1eTNLX2d2WDVPdyIsIm5hbWUiOiJBbm9ueW1vdXMiLCJzY29wZSI6ImFub255bW91cyIsInByb2plY3RfaWQiOiJwYXR0ZXJuY29sbGVjdG9yLWQ2ZTNvMDg4MjFiYTNlZSIsIm1ldGEiOnsicGxhdGZvcm0iOiJQdWJsaXNoYWJsZUtleSJ9LCJ1c2VyX3R5cGUiOiIiLCJjbGllbnRfdHlwZSI6ImNsaWVudF91c2VyIiwiaXNfc3lzdGVtX2FkbWluIjpmYWxzZX0.gbczSPxCV6Z1RseHW8GdHCeMkeVMfPyn2NM1Doz_xG9OkBF6DdBsPgNK3qW_6oJ6Hene3JCPL-R8ZLmULgWRMoYuoxoo6Qx5rU48xvMd4b9jBJiDef1CqroNZSEI9dy1qAhHwvStVdDsPm8SBDb1hIvv7z2qCBwtSBgKpAhEW9NhpacH9XRKqpNA1GE5T_fo-joam8n7H00F488t78ZGuwYquh4OZRdhDRDC7r7DX6CN6XOfNNoWZFiFYh-_CWlmE5FXX-1Lkjsp2Or9AN-K2gF9MNpPGgGRnuSt8h2-JkRz3Us0mLQB3yamZnCU3Nb6dGmYRNXggi5UX0NeF1_pWw";
const ACCESS_KEY = process.env.NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY || FALLBACK_ACCESS_KEY;

let _app: ReturnType<typeof cloudbase.init> | null = null;
let _auth: ReturnType<ReturnType<typeof cloudbase.init>["auth"]> | null = null;

/** 获取 CloudBase app 实例（懒加载，仅客户端） */
export function getApp() {
  if (!_app) {
    if (typeof window === "undefined") throw new Error("CloudBase SDK 仅可在浏览器端使用");
    _app = cloudbase.init({
      env: ENV_ID,
      region: REGION,
      accessKey: ACCESS_KEY,
      // 多图 AI 分析常超过默认 15s，需与云函数超时（180s）对齐
      timeout: 200_000,
      // detectSessionInUrl 让 OAuth/邮件回调态可被识别
      auth: { detectSessionInUrl: true },
    });
    _auth = _app.auth({ persistence: "local" });
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
export async function callCloudFunction<T = unknown>(
  name: string,
  data: Record<string, unknown>,
  options?: { timeoutMs?: number },
): Promise<T> {
  const app = getApp();
  const timeoutMs = options?.timeoutMs ?? (name.startsWith("ai-") ? 200_000 : undefined);
  console.log(`[CloudBase] 调用云函数: ${name}`, { dataKeys: Object.keys(data), dataSize: JSON.stringify(data).length });
  
  try {
    const res = await app.callFunction(
      { name, data },
      undefined,
      timeoutMs ? { timeout: timeoutMs } : undefined,
    );
    
    // 打印完整响应结构（不含大数据）
    const rawResult = res?.result;
    const logSafeResult = (() => {
      if (rawResult == null) return null;
      const s = JSON.stringify(rawResult);
      return s.length > 2000 ? s.slice(0, 2000) + `...(total ${s.length} chars)` : s;
    })();
    console.log(`[CloudBase] 云函数 ${name} 原始 res.result:`, logSafeResult);

    /** 从 SDK 响应中解析业务错误（部分版本在 result 为 null 时把 RetMsg 放在其它字段） */
    const parseEmbeddedError = (payload: unknown): string | null => {
      if (payload == null) return null;
      if (typeof payload === "string") {
        try {
          return parseEmbeddedError(JSON.parse(payload));
        } catch {
          return null;
        }
      }
      if (typeof payload !== "object") return null;
      const o = payload as Record<string, unknown>;
      if (typeof o.error === "string" && o.error) return o.error;
      if (o.code !== undefined && o.code !== null && o.code !== 0 && typeof o.error === "string") {
        return o.error;
      }
      return null;
    };

    let result: unknown = rawResult;

    if (rawResult == null || rawResult === undefined) {
      const resAny = res as unknown as Record<string, unknown>;
      const embedded =
        parseEmbeddedError(resAny?.response) ??
        parseEmbeddedError(resAny?.data) ??
        (typeof resAny?.errMsg === "string"
          ? parseEmbeddedError(resAny.errMsg)
          : null);
      if (embedded) {
        throw new Error(embedded);
      }
      throw new Error(
        "云函数返回为空。若刚部署过，请确认云函数已配置 AI_API_KEY（运行 npm run deploy:fn）",
      );
    }

    // 如果结果是字符串（某些情况下 RetMsg 可能未解析），尝试解析
    if (typeof result === "string") {
      try {
        result = JSON.parse(result) as unknown;
      } catch {
        /* keep as-is */
      }
    }

    const resultObj =
      result && typeof result === "object"
        ? (result as Record<string, unknown>)
        : null;

    // 检查 SDK 层 / 业务错误（code !== 0）
    if (
      resultObj &&
      resultObj.code !== undefined &&
      resultObj.code !== null &&
      resultObj.code !== 0
    ) {
      throw new Error(
        typeof resultObj.error === "string"
          ? resultObj.error
          : `云函数错误(code=${String(resultObj.code)})`,
      );
    }
    // 仅有 error 字段
    if (resultObj?.error && !("code" in resultObj)) {
      throw new Error(String(resultObj.error));
    }

    // 移除内部字段，保留业务数据
    const { error: _err, code: _code, requestId: _reqId, ...rest } = resultObj ?? {};
    
    console.log(`[CloudBase] 云函数 ${name} 提取的业务数据 keys:`, Object.keys(rest));
    
    // 如果 rest 为空但有原始数据，可能是字段名不匹配，直接返回全部
    if (Object.keys(rest).length === 0 && resultObj) {
      if (Object.keys(resultObj).length === 0) {
        throw new Error("云函数返回空对象，请减少证据体积后重试");
      }
      console.warn(`[CloudBase] 提取后为空，直接返回原始数据`);
      return resultObj as T;
    }

    return rest as T;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`[CloudBase] 云函数 ${name} 调用失败:`, err.message);
      throw err;
    }
    console.error(`[CloudBase] 云函数 ${name} 未知错误:`, err);
    throw new Error("云函数调用异常");
  }
}

/** 未登录时抛出的标记错误 */
export const NOT_AUTHENTICATED = "NOT_AUTHENTICATED";

/** 当前会话信息 */
export interface AuthState {
  loggedIn: boolean;
  userId: string | null;
  email: string | null;
}

/** 读取当前真实登录态（排除匿名会话） */
export async function getAuthState(): Promise<AuthState> {
  const auth = getAuth();
  const { data } = await auth.getSession();
  const session = data?.session;
  if (!session || session.user?.is_anonymous) {
    return { loggedIn: false, userId: null, email: null };
  }
  return {
    loggedIn: true,
    userId: session.user?.id ?? null,
    email: session.user?.email ?? null,
  };
}

/**
 * 确保已真实登录（被数据库读写调用）。
 * 未登录时抛出 NOT_AUTHENTICATED，由 UI 的登录 gate 拦截引导。
 */
export async function ensureAuth(): Promise<void> {
  const state = await getAuthState();
  if (!state.loggedIn) throw new Error(NOT_AUTHENTICATED);
}

// ── 邮箱验证码登录 ─────────────────────────────────────

type VerifyOtpFn = (args: { token: string }) => Promise<{ data?: unknown; error?: { message: string } | null }>;
let _verifyOtp: VerifyOtpFn | null = null;

/** 发送邮箱验证码（不存在则自动注册） */
export async function sendEmailCode(email: string): Promise<void> {
  const auth = getAuth();
  const { data, error } = await auth.signInWithOtp({ email });
  if (error) throw new Error(error.message || "验证码发送失败");
  _verifyOtp = (data as { verifyOtp?: VerifyOtpFn })?.verifyOtp ?? null;
  if (!_verifyOtp) throw new Error("发送验证码后未获得校验回调，请重试");
}

/** 校验邮箱验证码完成登录 */
export async function verifyEmailCode(token: string): Promise<void> {
  if (!_verifyOtp) throw new Error("请先发送验证码");
  const { error } = await _verifyOtp({ token });
  if (error) throw new Error(error.message || "验证码校验失败");
  _verifyOtp = null;
}

/** 登出 */
export async function signOut(): Promise<void> {
  const auth = getAuth();
  await auth.signOut();
}

/** 监听登录态变化，返回取消订阅函数 */
export function onAuthChange(cb: () => void): () => void {
  const auth = getAuth();
  const sub = auth.onAuthStateChange(() => cb());
  return () => {
    try {
      (sub as { data?: { subscription?: { unsubscribe?: () => void } } })?.data?.subscription?.unsubscribe?.();
    } catch {
      /* ignore */
    }
  };
}
