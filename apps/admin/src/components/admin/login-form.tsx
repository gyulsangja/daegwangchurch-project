"use client";

import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useActionState } from "react";

import { login, type LoginState } from "../../app/admin/actions";
import { Button } from "@daegwang/web-ui/components/ui/button";

const initialState: LoginState = {};

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="next" value={nextPath ?? ""} />
      <Stack spacing={2.5}>
        <TextField
          id="email"
          name="email"
          type="email"
          label="이메일"
          autoComplete="username"
          required
          fullWidth
          placeholder="admin@example.com"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Mail aria-hidden="true" className="size-5" /></InputAdornment> } }}
        />
        <TextField
          id="password"
          name="password"
          type="password"
          label="비밀번호"
          autoComplete="current-password"
          required
          fullWidth
          placeholder="비밀번호 입력"
          slotProps={{ htmlInput: { minLength: 8 }, input: { startAdornment: <InputAdornment position="start"><LockKeyhole aria-hidden="true" className="size-5" /></InputAdornment> } }}
        />
        {state.message ? <Alert severity="error">{state.message}</Alert> : null}
        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {pending ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : null}
          {pending ? "로그인 중…" : "관리자 로그인"}
        </Button>
      </Stack>
    </form>
  );
}
