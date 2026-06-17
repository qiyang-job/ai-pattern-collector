"use client";

import { useEffect, useRef, useState } from "react";
import { Boxes, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";

type Step = "email" | "code";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginGate() {
  const { sendCode, verifyCode } = useAuthStore();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = (sec: number) => {
    setCountdown(sec);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleSend = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("请输入有效的邮箱地址");
      return;
    }
    setSending(true);
    try {
      await sendCode(email);
      setStep("code");
      startCountdown(60);
      toast.success("验证码已发送，请查收邮箱（含垃圾箱）");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "验证码发送失败");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error("请输入验证码");
      return;
    }
    setVerifying(true);
    try {
      await verifyCode(code);
      toast.success("登录成功");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "验证码校验失败");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]">
      <div className="w-full max-w-[380px]">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] bg-[var(--accent-muted)]">
            <Boxes className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} />
          </span>
          <div>
            <div className="display-serif text-[18px] leading-none">Pattern Collector</div>
            <div className="mono mt-1.5 text-[9px] uppercase tracking-[0.18em] text-[var(--text-weak)]">
              Screenshot <span className="text-[var(--accent)]">→</span> Pattern{" "}
              <span className="text-[var(--accent)]">→</span> Insight
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-lg)]">
          <h1 className="text-[15px] font-medium">邮箱验证码登录</h1>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-muted)]">
            {step === "email"
              ? "输入你的邮箱，我们会发送一次性验证码。登录后数据将归属到你的账号，可跨设备访问。"
              : `验证码已发送至 ${email}，请输入收到的 6 位验证码。`}
          </p>

          <div className="mt-5 space-y-3">
            {step === "email" ? (
              <>
                <label className="block">
                  <span className="mono mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[var(--text-weak)]">
                    Email
                  </span>
                  <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--panel-muted)] px-3 focus-within:border-[var(--accent)]">
                    <Mail className="h-4 w-4 shrink-0 text-[var(--text-weak)]" strokeWidth={1.75} />
                    <input
                      type="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="you@gmail.com"
                      className="h-11 w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--text-weak)]"
                    />
                  </div>
                </label>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-[13px] font-medium text-[#1a1206] transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
                >
                  {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {sending ? "发送中…" : "发送验证码"}
                </button>
              </>
            ) : (
              <>
                <label className="block">
                  <span className="mono mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[var(--text-weak)]">
                    验证码
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    placeholder="6 位验证码"
                    className="mono h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--panel-muted)] px-3 text-[15px] tracking-[0.3em] outline-none focus:border-[var(--accent)] placeholder:tracking-normal placeholder:text-[var(--text-weak)]"
                  />
                </label>
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-[13px] font-medium text-[#1a1206] transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
                >
                  {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
                  {verifying ? "登录中…" : "登录"}
                </button>
                <div className="flex items-center justify-between pt-0.5 text-[11px]">
                  <button
                    onClick={() => {
                      setStep("email");
                      setCode("");
                    }}
                    className="text-[var(--text-muted)] transition hover:text-[var(--text)]"
                  >
                    ← 换邮箱
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={countdown > 0 || sending}
                    className="text-[var(--accent)] transition hover:text-[var(--accent-strong)] disabled:text-[var(--text-weak)]"
                  >
                    {countdown > 0 ? `${countdown}s 后重发` : "重新发送"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="mono mt-4 text-center text-[10px] leading-relaxed text-[var(--text-weak)]">
          验证码邮件由腾讯云开发发送，可能进入垃圾箱
        </p>
      </div>
    </div>
  );
}
