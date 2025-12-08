import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  setUser,
  logout,
  setChecked,
} from "../../../app/store/slices/authSlice";
import { me } from "../../../entities/auth";

export const useAuthCheck = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await me();
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
      } catch {
        dispatch(logout());
      } finally {
        dispatch(setChecked({ isChecked: true }));
      }
    };

    checkAuth();
  }, [dispatch]);
};
