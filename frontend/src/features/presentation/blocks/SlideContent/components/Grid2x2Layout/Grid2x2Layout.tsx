import React from "react";
import { Box } from "@mui/material";
import { PlateSlide } from "../../../../../../shared/types";

interface Props {
  slide: PlateSlide;
  children: React.ReactNode;
}

const Grid2x2Layout: React.FC<Props> = ({ children }) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 2,
        p: 4,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {children}
    </Box>
  );
};


export default Grid2x2Layout;
