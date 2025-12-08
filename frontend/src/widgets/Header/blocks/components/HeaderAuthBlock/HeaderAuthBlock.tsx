import React, { useState } from "react";
import { Box, Button, Typography, Avatar, Menu, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../../../app/store/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../../app/store";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

const HeaderAuthBlock: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      dispatch(logout());
      navigate("/auth");
    }

    dispatch(logout());
    navigate("/");
  };

  if (auth.isLoggedIn) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          onClick={handleClick}
          sx={{
            textTransform: "none",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Avatar sx={{ width: 35, height: 35 }} src={auth.avatar}>
            {!auth.avatar && auth.name ? auth.name[0].toUpperCase() : null}
          </Avatar>
          <Typography>{auth.name || auth.email}</Typography>
          <ArrowDropDownIcon />
        </Button>

        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem
            onClick={() => {
              navigate("/projects");
              handleClose();
            }}
          >
            Мои презентации
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate("/settings");
              handleClose();
            }}
          >
            Настройки
          </MenuItem>
          <MenuItem
            onClick={handleLogout}
            sx={{
              color: "rgba(255, 0, 0, 1)",
            }}
          >
            Выйти
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Button
        variant="contained"
        sx={{ textTransform: "none" }}
        onClick={() => navigate("/auth", { state: { action: "login" } })}
      >
        {isMobile ? "Вход" : "Войти"}
      </Button>
      {!isMobile && <Typography>или</Typography>}
      <Button
        variant="outlined"
        sx={{ textTransform: "none" }}
        onClick={() => navigate("/auth", { state: { action: "register" } })}
      >
        {isMobile ? "Регистрация" : "Зарегистрироваться"}
      </Button>
    </Box>
  );
};

export default HeaderAuthBlock;
