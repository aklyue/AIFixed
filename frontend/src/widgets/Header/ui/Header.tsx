import React, { useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import SlideNavigationToolbar from "../../../features/presentation/ui/components/SlideNavigationToolbar";
import { useHeader } from "../hooks";

const MotionAppBar = motion(AppBar);

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { controls, location } = useHeader();

  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
          <IconButton onClick={() => navigate("/")}>
            <AutoAwesomeIcon sx={{ color: "primary.main" }} />
          </IconButton>
          <Typography
            variant={isMobile ? "subtitle2" : "h6"}
            component="div"
            sx={{ color: "text.primary" }}
          >
            AIFixed
          </Typography>
        </Box>
        {location.pathname === "/editor" && <SlideNavigationToolbar />}
      </Toolbar>
    </MotionAppBar>
  );
};
