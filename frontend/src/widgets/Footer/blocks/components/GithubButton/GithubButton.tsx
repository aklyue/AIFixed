import React, { useEffect, useState } from "react";
import { Button, Box, Divider } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import StarIcon from "@mui/icons-material/Star";
import { useGithubStars } from "../../hooks";

export const GithubButton = ({ isMobile }: { isMobile: boolean }) => {
  const { stars } = useGithubStars();

  return (
    <Button
      component="a"
      href="https://github.com/aklyue/AIFixed"
      target="_blank"
      rel="noopener noreferrer"
      variant="outlined"
      fullWidth={isMobile}
      sx={{
        minWidth: 180,
        height: 50,
        textTransform: "none",
        borderRadius: 2,
        px: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          justifyContent: isMobile ? "center" : "flex-start",
          flex: 1,
        }}
      >
        <GitHubIcon />
        GitHub
      </Box>

      {!isMobile && <Divider orientation="vertical" flexItem />}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          position: isMobile ? "absolute" : "static",
          right: isMobile ? 16 : "auto",
        }}
      >
        <StarIcon fontSize="small" />
        {stars !== null ? stars : "..."}
      </Box>
    </Button>
  );
};
