import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../../../../../app/store/slices/authSlice";
import {
  login as loginApi,
  register as registerApi,
  sendVerificationCode,
} from "../../../../../entities/auth";

export const useAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity?: "error" | "success";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (
    message: string,
    severity: "error" | "success" = "success"
  ) => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => setSnackbar({ ...snackbar, open: false }), 4000); // авто-скрытие через 4 сек
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await loginApi({ email, password });
      dispatch(
        setUser({
          userId: data.user_id,
          email: data.email,
          name: data.name,
          isVerified: data.is_verified,
          provider: data.provider,
          avatar: data.avatar,
        })
      );
      navigate("/");
    } catch (err: any) {
      console.error(err);
      showSnackbar(
        err?.response?.data?.detail || "Неверный email или пароль",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (
    name: string,
    email: string,
    password: string
  ) => {
    try {
      setIsLoading(true);
      const data = await registerApi({ name, email, password });

      if (!data.is_verified) {
        await sendVerificationCode(email);
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        showSnackbar("Проверьте почту для подтверждения аккаунта", "success");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error(err);
      showSnackbar(
        err?.response?.data?.detail || "Ошибка регистрации",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { handleLogin, handleRegister, isLoading, snackbar, setSnackbar };
};
