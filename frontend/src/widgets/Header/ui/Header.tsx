import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
  Button,
} from "@mui/material";
import { ReactComponent as Logo } from "../../../shared/assets/logo/logo-cut.svg";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SlideNavigationToolbar from "../../../features/presentation/ui/components/SlideNavigationToolbar";
import { useHeader } from "../hooks";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import HeaderAuthBlock from "../blocks/components/HeaderAuthBlock";

const MotionAppBar = motion(AppBar);

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { controls, location } = useHeader();

  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const auth = useSelector((state: RootState) => state.auth);

  return (
    <MotionAppBar
      position="fixed"
      color="transparent"
      animate={controls}
      sx={{
        backgroundColor: "transparent",
        borderBottom: "1px solid transparent",
        boxShadow: "none",
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: isMobile ? 0 : 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
          }}
        >
          <IconButton
            onClick={() => navigate("/")}
            sx={{
              width: 51,
              height: 51,
            }}
          >
            <Logo sx={{ color: "primary.main" }} />
          </IconButton>
          {(!isMobile || location.pathname !== "/editor") && (
            <Typography
              variant={isMobile ? "subtitle2" : "h6"}
              component="div"
              sx={{ color: "text.primary" }}
            >
              AIFixed
            </Typography>
          )}
        </Box>
        {location.pathname === "/editor" && <SlideNavigationToolbar />}

        {location.pathname === "/" && auth.isChecked && (
          <HeaderAuthBlock isMobile={isMobile} />
        )}
      </Toolbar>
    </MotionAppBar>
  );
};
