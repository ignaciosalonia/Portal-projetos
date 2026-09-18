"use client";

import { useActionState } from "react";
import { signInAction, type AuthActionState } from "./actions";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-8"
      >
        <h1 className="text-xl font-medium">Entrar no painel</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-neutral-600">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-neutral-600">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-neutral-900 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
