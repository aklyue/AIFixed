export const handleVerification = async (
  userEmail: string,
  verificationCode: string
) => {
  const res = await fetch(
    `${process.env.REACT_APP_API_URL}/auth/email/verify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        code: verificationCode,
      }),
      credentials: "include",
    }
  );

  if (!res.ok) throw new Error("Ошибка подтверждения");

  return res.json();
};
