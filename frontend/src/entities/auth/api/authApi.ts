import { LoginPayload, RegisterPayload, AuthUser } from "../model/types";

const API_URL = process.env.REACT_APP_API_URL;

export const login = async ({
  email,
  password,
}: LoginPayload): Promise<AuthUser> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Ошибка входа");

  return res.json();
};

export const register = async ({
  name,
  email,
  password,
}: RegisterPayload): Promise<AuthUser> => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) throw new Error("Ошибка регистрации");

  return res.json();
};

export const me = async (): Promise<AuthUser> => {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Not logged in");

  return res.json();
};

export const sendVerificationCode = async (email: string) => {
  await fetch(`${API_URL}/auth/email/send_code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
};

export const logoutApi = async () => {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
};
