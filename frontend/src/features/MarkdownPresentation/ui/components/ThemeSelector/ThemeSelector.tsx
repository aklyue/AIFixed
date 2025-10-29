import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../../app/store";
import { themes } from "../../../../../shared/constants";
import {
  pushHistory,
  setGlobalTheme,
} from "../../../../../app/store/slices/editorSlice";
import PaletteIcon from "@mui/icons-material/PaletteOutlined";

function ThemeSelector() {
  const dispatch = useDispatch<AppDispatch>();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleThemeSelect = (themeId: string) => {
    dispatch(setGlobalTheme(themeId));
    dispatch(pushHistory());
    setAnchorEl(null);
  };

  return (
    <Box>
      <Tooltip title="Сменить тему">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          color="primary"
        >
          <PaletteIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        sx={{ mt: 1 }}
      >
        {themes.map((theme) => (
          <MenuItem key={theme.id} onClick={() => handleThemeSelect(theme.id)}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {[
                  theme.colors.background,
                  theme.colors.heading,
                  theme.colors.paragraph,
                ].map((color, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: color,
                      border: "1px solid #ccc",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography
                  sx={{
                    fontFamily: theme.fonts.heading,
                    fontSize: "0.95rem",
                    lineHeight: 1.2,
                    fontWeight: "bold",
                  }}
                >
                  {theme.name}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: theme.fonts.paragraph,
                    fontSize: "0.8rem",
                    color: "text.secondary",
                    textTransform: "capitalize",
                  }}
                >
                  {theme.id.replace("light-", "").replace("-", " ").trim()}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

export default ThemeSelector;
