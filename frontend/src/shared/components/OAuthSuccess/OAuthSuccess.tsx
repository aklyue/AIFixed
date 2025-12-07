import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/auth/me", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((user) => {
        console.log("Авторизованный пользователь:", user);
        navigate("/dashboard");
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  return <div>Авторизация успешна. Идёт перенаправление...</div>;
}
