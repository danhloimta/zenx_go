'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  MessageCircleQuestion,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type {
  OtpChannel,
  SecurityQuestionOption,
  SecurityQuestionCode,
  SensitiveChallengeMethod,
  SensitiveProfileIdentity,
  SensitiveProfileSummary,
} from '@zenx-go/api-client';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type Phase = 'idle' | 'challenge' | 'otp' | 'form' | 'revealed';
type Intent = 'edit' | 'reveal' | 'deleteIdentity' | 'deleteAll';

type FormValues = {
  citizenId: string;
  issuedAt: string;
  issuedPlace: string;
  secretCode: string;
  secretCodeConfirmation: string;
  questionCode: SecurityQuestionCode;
  answer: string;
};

const emptyValues: FormValues = {
  citizenId: '',
  issuedAt: '',
  issuedPlace: '',
  secretCode: '',
  secretCodeConfirmation: '',
  questionCode: 'FIRST_SCHOOL',
  answer: '',
};

export function SensitiveProfileCard() {
  const queryClient = useQueryClient();
  const sensitive = useQuery({
    queryKey: ['account', 'sensitive-profile'],
    queryFn: api.account.sensitiveProfile.summary,
    retry: false,
  });
  const questions = useQuery({
    queryKey: ['account', 'sensitive-profile', 'questions'],
    queryFn: api.account.sensitiveProfile.questions,
    retry: false,
  });
  const [phase, setPhase] = useState<Phase>('idle');
  const [intent, setIntent] = useState<Intent>('edit');
  const [token, setToken] = useState('');
  const [otpChannel, setOtpChannel] = useState<OtpChannel | null>(null);
  const [otpDestination, setOtpDestination] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [challengeMethod, setChallengeMethod] = useState<SensitiveChallengeMethod>('SECRET_CODE');
  const [challengeValue, setChallengeValue] = useState('');
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [securityTouched, setSecurityTouched] = useState(false);
  const [revealedIdentity, setRevealedIdentity] = useState<SensitiveProfileIdentity | null>(null);
  const [error, setError] = useState('');

  const reset = () => {
    setPhase('idle');
    setIntent('edit');
    setToken('');
    setOtpChannel(null);
    setOtpDestination('');
    setOtpCode('');
    setChallengeValue('');
    setValues(emptyValues);
    setSecurityTouched(false);
    setRevealedIdentity(null);
    setError('');
  };

  const otpSend = useMutation({
    mutationFn: api.account.sensitiveProfile.sendOtp,
    onSuccess: (result) => {
      setOtpChannel(result.channel);
      setOtpDestination(result.destination);
      setError('');
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  });

  const otpVerify = useMutation({
    mutationFn: api.account.sensitiveProfile.verifyOtp,
    onSuccess: (result) => {
      setToken(result.accessToken);
      setError('');
      if (intent === 'reveal') {
        reveal.mutate({ accessToken: result.accessToken });
      } else if (intent === 'deleteIdentity' || intent === 'deleteAll') {
        remove.mutate({ accessToken: result.accessToken });
      } else {
        setPhase('form');
      }
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  });

  const challenge = useMutation({
    mutationFn: api.account.sensitiveProfile.challenge,
    onSuccess: (result) => {
      setToken(result.accessToken);
      setError('');
      if (intent === 'reveal') {
        reveal.mutate({ accessToken: result.accessToken });
      } else if (intent === 'deleteIdentity' || intent === 'deleteAll') {
        remove.mutate({ accessToken: result.accessToken });
      } else {
        setPhase('form');
      }
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  });

  const reveal = useMutation({
    mutationFn: api.account.sensitiveProfile.reveal,
    onSuccess: (result) => {
      setRevealedIdentity(result.identity);
      setPhase('revealed');
      setError('');
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  });

  const update = useMutation({
    mutationFn: api.account.sensitiveProfile.update,
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin định danh và bảo mật.');
      void queryClient.invalidateQueries({ queryKey: ['account', 'sensitive-profile'] });
      reset();
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  });

  const remove = useMutation({
    mutationFn: api.account.sensitiveProfile.update,
    onSuccess: () => {
      toast.success('Đã xóa thông tin nhạy cảm.');
      void queryClient.invalidateQueries({ queryKey: ['account', 'sensitive-profile'] });
      reset();
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  });

  if (sensitive.isLoading || questions.isLoading)
    return <Skeleton className="h-[360px] rounded-2xl" />;
  if (sensitive.isError || !sensitive.data || questions.isError || !questions.data) {
    return <Alert>Không thể tải thông tin định danh và bảo mật.</Alert>;
  }

  const summary = sensitive.data;
  const questionOptions: SecurityQuestionOption[] = questions.data;
  const questionLabels = Object.fromEntries(
    questionOptions.map((question) => [question.code, question.label]),
  ) as Partial<Record<SecurityQuestionCode, string>>;
  const questionLabel = (code: SecurityQuestionCode) => questionLabels[code] ?? code;
  const defaultQuestionCode =
    summary.security.questionCode ?? questionOptions[0]?.code ?? 'FIRST_SCHOOL';
  const busy =
    otpSend.isPending ||
    otpVerify.isPending ||
    challenge.isPending ||
    reveal.isPending ||
    update.isPending ||
    remove.isPending;

  const startOtp = (nextIntent: Intent) => {
    setIntent(nextIntent);
    setPhase('otp');
    setOtpCode('');
    setOtpChannel(null);
    setOtpDestination('');
    setError('');
    otpSend.mutate();
  };

  const startChallenge = (nextIntent: Intent) => {
    setIntent(nextIntent);
    setPhase('challenge');
    setChallengeValue('');
    setError('');
  };

  const startEdit = () => {
    setValues({
      ...emptyValues,
      questionCode: summary.security.questionCode ?? defaultQuestionCode,
    });
    setSecurityTouched(false);
    if (summary.security.configured || summary.identity.configured) startChallenge('edit');
    else startOtp('edit');
  };

  const startReveal = () => {
    if (!summary.identity.configured) return;
    startChallenge('reveal');
  };

  const startDelete = (nextIntent: 'deleteIdentity' | 'deleteAll') => {
    const message =
      nextIntent === 'deleteIdentity'
        ? 'Bạn có chắc muốn xóa thông tin CCCD không?'
        : 'Bạn có chắc muốn xóa toàn bộ thông tin CCCD và bảo mật không?';
    if (!window.confirm(message)) return;
    startChallenge(nextIntent);
  };

  const submitOtp = () => {
    if (!otpChannel || !otpCode.trim()) {
      setError('Vui lòng nhập mã OTP.');
      return;
    }
    otpVerify.mutate({ channel: otpChannel, code: otpCode.trim() });
  };

  const submitChallenge = () => {
    if (!challengeValue.trim()) {
      setError(
        challengeMethod === 'SECRET_CODE'
          ? 'Vui lòng nhập mã bí mật.'
          : 'Vui lòng nhập câu trả lời bí mật.',
      );
      return;
    }
    challenge.mutate({ method: challengeMethod, value: challengeValue.trim() });
  };

  const setValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (
      key === 'secretCode' ||
      key === 'secretCodeConfirmation' ||
      key === 'questionCode' ||
      key === 'answer'
    ) {
      setSecurityTouched(true);
    }
    if (error) setError('');
  };

  const submitForm = () => {
    const hasIdentity = Boolean(values.citizenId || values.issuedAt || values.issuedPlace);
    if (
      hasIdentity &&
      (!/^\d{12}$/.test(values.citizenId) || !values.issuedAt || !values.issuedPlace.trim())
    ) {
      setError('Vui lòng nhập CCCD 12 số, ngày cấp và nơi cấp đầy đủ.');
      return;
    }
    if (!securityTouched && !summary.security.configured) {
      setError('Vui lòng thiết lập mã bí mật và câu hỏi/câu trả lời.');
      return;
    }
    if (
      securityTouched &&
      (!/^\d{6}$/.test(values.secretCode) ||
        values.secretCode !== values.secretCodeConfirmation ||
        !values.answer.trim())
    ) {
      setError('Mã bí mật phải có 6 chữ số giống nhau ở hai ô và câu trả lời không được để trống.');
      return;
    }
    if (!token) {
      setError('Phiên xác minh đã hết hạn. Vui lòng xác minh lại.');
      return;
    }

    const input: Parameters<typeof api.account.sensitiveProfile.update>[0] = { accessToken: token };
    if (hasIdentity) {
      input.identity = {
        citizenId: values.citizenId,
        issuedAt: values.issuedAt,
        issuedPlace: values.issuedPlace.trim(),
      };
    }
    if (securityTouched) {
      input.security = {
        secretCode: values.secretCode,
        secretCodeConfirmation: values.secretCodeConfirmation,
        questionCode: values.questionCode,
        answer: values.answer.trim(),
      };
    }
    update.mutate(input);
  };

  const editRevealed = () => {
    if (!revealedIdentity) return;
    setValues({
      ...emptyValues,
      citizenId: revealedIdentity.citizenId,
      issuedAt: revealedIdentity.issuedAt,
      issuedPlace: revealedIdentity.issuedPlace,
      questionCode: summary.security.questionCode ?? defaultQuestionCode,
    });
    setSecurityTouched(false);
    setIntent('edit');
    setPhase('form');
    setError('');
  };

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Fingerprint className="size-5 text-[#00873E]" />
            Định danh &amp; bảo mật
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Thông tin được mã hóa; mã bí mật hoặc câu trả lời dùng để bảo vệ dữ liệu nhạy cảm.
          </p>
        </div>
        {phase === 'idle' ? (
          <Button
            type="button"
            size="sm"
            variant="zenx-outline"
            className="shrink-0 text-xs font-semibold"
            onClick={startEdit}
          >
            {summary.identity.configured || summary.security.configured ? 'Chỉnh sửa' : 'Thiết lập'}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="shrink-0 text-xs"
            onClick={reset}
            disabled={busy}
          >
            Hủy
          </Button>
        )}
      </div>

      {phase === 'idle' && (
        <SummaryView
          summary={summary}
          questionLabel={questionLabel}
          onReveal={startReveal}
          onDeleteIdentity={() => startDelete('deleteIdentity')}
          onDeleteAll={() => startDelete('deleteAll')}
        />
      )}

      {phase === 'challenge' && (
        <div className="mt-5 space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
          <div>
            <p className="text-sm font-bold text-slate-900">Xác minh để tiếp tục</p>
            <p className="mt-1 text-xs text-slate-500">
              Nhập mã bí mật hoặc câu trả lời đã thiết lập.
            </p>
            {challengeMethod === 'SECURITY_ANSWER' && summary.security.questionCode && (
              <p className="mt-2 text-xs font-semibold text-slate-700">
                Câu hỏi: {questionLabel(summary.security.questionCode)}
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant={challengeMethod === 'SECRET_CODE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChallengeMethod('SECRET_CODE')}
            >
              <KeyRound className="size-3.5" /> Mã bí mật
            </Button>
            <Button
              type="button"
              variant={challengeMethod === 'SECURITY_ANSWER' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChallengeMethod('SECURITY_ANSWER')}
            >
              <MessageCircleQuestion className="size-3.5" /> Câu trả lời
            </Button>
          </div>
          <Input
            autoFocus
            type={challengeMethod === 'SECRET_CODE' ? 'password' : 'text'}
            inputMode={challengeMethod === 'SECRET_CODE' ? 'numeric' : undefined}
            maxLength={challengeMethod === 'SECRET_CODE' ? 6 : 120}
            value={challengeValue}
            onChange={(event) => {
              setChallengeValue(event.target.value);
              setError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitChallenge();
            }}
            placeholder={
              challengeMethod === 'SECRET_CODE' ? 'Nhập mã 6 chữ số' : 'Nhập câu trả lời'
            }
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={submitChallenge} disabled={busy}>
              Xác minh
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => startOtp(intent)}
              disabled={busy}
            >
              Quên cả hai?
            </Button>
          </div>
        </div>
      )}

      {phase === 'otp' && (
        <div className="mt-5 space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
          <div>
            <p className="text-sm font-bold text-slate-900">Xác minh bằng OTP</p>
            <p className="mt-1 text-xs text-slate-500">
              {otpDestination
                ? `Mã đã được gửi tới ${otpDestination}.`
                : 'Đang gửi mã tới liên hệ đã xác thực của bạn…'}
            </p>
          </div>
          <Input
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={(event) => {
              setOtpCode(event.target.value.replace(/\D/g, ''));
              setError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitOtp();
            }}
            placeholder="Nhập mã OTP 6 chữ số"
            disabled={!otpChannel || busy}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={submitOtp} disabled={!otpChannel || busy}>
              Xác nhận OTP
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => otpSend.mutate()}
              disabled={busy}
            >
              Gửi lại mã
            </Button>
          </div>
        </div>
      )}

      {phase === 'form' && (
        <div className="mt-5 space-y-5 rounded-xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
          <div>
            <p className="text-sm font-bold text-slate-900">Cập nhật thông tin</p>
            <p className="mt-1 text-xs text-slate-500">
              CCCD có thể bỏ trống. Nếu nhập, cần điền đủ số, ngày cấp và nơi cấp.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Số CCCD" htmlFor="sensitive-citizen-id">
              <Input
                id="sensitive-citizen-id"
                inputMode="numeric"
                maxLength={12}
                value={values.citizenId}
                onChange={(event) => setValue('citizenId', event.target.value.replace(/\D/g, ''))}
                placeholder="12 chữ số"
              />
            </FormField>
            <FormField label="Ngày cấp" htmlFor="sensitive-issued-at">
              <Input
                id="sensitive-issued-at"
                type="date"
                value={values.issuedAt}
                onChange={(event) => setValue('issuedAt', event.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Nơi cấp" htmlFor="sensitive-issued-place">
            <Input
              id="sensitive-issued-place"
              value={values.issuedPlace}
              onChange={(event) => setValue('issuedPlace', event.target.value)}
              placeholder="Cơ quan cấp CCCD"
            />
          </FormField>

          <div className="border-t border-slate-200 pt-5">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <LockKeyhole className="size-4 text-[#00873E]" /> Mã và câu hỏi bí mật
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Nhập đủ các ô bên dưới nếu muốn tạo hoặc thay đổi nhóm bảo mật.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Mã bí mật (6 số)" htmlFor="sensitive-secret-code">
                <Input
                  id="sensitive-secret-code"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={values.secretCode}
                  onChange={(event) =>
                    setValue('secretCode', event.target.value.replace(/\D/g, ''))
                  }
                  placeholder="••••••"
                />
              </FormField>
              <FormField label="Nhập lại mã bí mật" htmlFor="sensitive-secret-code-confirmation">
                <Input
                  id="sensitive-secret-code-confirmation"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={values.secretCodeConfirmation}
                  onChange={(event) =>
                    setValue('secretCodeConfirmation', event.target.value.replace(/\D/g, ''))
                  }
                  placeholder="••••••"
                />
              </FormField>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Câu hỏi bí mật" htmlFor="sensitive-question">
                <select
                  id="sensitive-question"
                  className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10"
                  value={values.questionCode}
                  onChange={(event) =>
                    setValue('questionCode', event.target.value as SecurityQuestionCode)
                  }
                >
                  {questionOptions.map((question) => (
                    <option key={question.code} value={question.code}>
                      {question.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Câu trả lời" htmlFor="sensitive-answer">
                <Input
                  id="sensitive-answer"
                  type="password"
                  maxLength={100}
                  value={values.answer}
                  onChange={(event) => setValue('answer', event.target.value)}
                  placeholder="Không chia sẻ cho người khác"
                />
              </FormField>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600" role="alert">
              <AlertCircle className="size-3.5" />
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={submitForm} disabled={busy}>
              <ShieldCheck className="size-3.5" /> Lưu thông tin
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={busy}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {phase === 'revealed' && (
        <div className="mt-5 space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Eye className="size-4 text-[#00873E]" /> Thông tin CCCD đầy đủ
          </p>
          {revealedIdentity ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">Số CCCD</dt>
                <dd className="mt-1 font-semibold text-slate-900">{revealedIdentity.citizenId}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Ngày cấp</dt>
                <dd className="mt-1 font-semibold text-slate-900">{revealedIdentity.issuedAt}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Nơi cấp</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {revealedIdentity.issuedPlace}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-slate-500">Bạn chưa lưu thông tin CCCD.</p>
          )}
          {error && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600" role="alert">
              <AlertCircle className="size-3.5" />
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={editRevealed} disabled={busy}>
              Chỉnh sửa
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={busy}>
              Đóng
            </Button>
          </div>
        </div>
      )}

      {(phase === 'challenge' || phase === 'otp') && error && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600" role="alert">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}
      {busy && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <RefreshCw className="size-3 animate-spin" /> Đang xử lý…
        </p>
      )}
    </section>
  );
}

function SummaryView({
  summary,
  questionLabel,
  onReveal,
  onDeleteIdentity,
  onDeleteAll,
}: {
  summary: SensitiveProfileSummary;
  questionLabel: (code: SecurityQuestionCode) => string;
  onReveal: () => void;
  onDeleteIdentity: () => void;
  onDeleteAll: () => void;
}) {
  return (
    <div className="mt-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryItem
          icon={<Fingerprint className="size-4 text-[#00873E]" />}
          label="CCCD"
          value={
            summary.identity.configured
              ? `********${summary.identity.last4 ?? ''}`
              : 'Chưa thiết lập'
          }
          configured={summary.identity.configured}
        />
        <SummaryItem
          icon={<KeyRound className="size-4 text-[#00873E]" />}
          label="Mã bí mật"
          value={summary.security.configured ? 'Đã thiết lập' : 'Chưa thiết lập'}
          configured={summary.security.configured}
        />
        <SummaryItem
          icon={<MessageCircleQuestion className="size-4 text-[#00873E]" />}
          label="Câu hỏi bí mật"
          value={
            summary.security.questionCode
              ? questionLabel(summary.security.questionCode)
              : 'Chưa thiết lập'
          }
          configured={summary.security.configured}
        />
      </div>
      {(summary.identity.configured || summary.security.configured) && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {summary.identity.configured && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={onReveal}
            >
              <Eye className="size-3.5" /> Xem CCCD đầy đủ
            </Button>
          )}
          {summary.identity.configured && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-xs text-red-600 hover:text-red-700"
              onClick={onDeleteIdentity}
            >
              <Trash2 className="size-3.5" /> Xóa CCCD
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-xs text-red-600 hover:text-red-700"
            onClick={onDeleteAll}
          >
            <Trash2 className="size-3.5" /> Xóa toàn bộ
          </Button>
        </div>
      )}
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
  configured,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  configured: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200/90 p-3.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F7EC]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-slate-800">{value}</p>
      </div>
      {configured && <CheckCircle2 className="ml-auto size-3.5 shrink-0 text-[#00873E]" />}
    </div>
  );
}
