import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import CodeIcon from "@mui/icons-material/Code";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import TableChartIcon from "@mui/icons-material/TableChart";
import ListIcon from "@mui/icons-material/List";
import BarChartIcon from "@mui/icons-material/BarChart";
import TitleIcon from "@mui/icons-material/Title";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import VerticalAlignTopIcon from "@mui/icons-material/VerticalAlignTop";
import VerticalAlignCenterIcon from "@mui/icons-material/VerticalAlignCenter";
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottom";
import ThemeSelector from "../ThemeSelector";
import { useBlockActions } from "../../hooks";

interface Props {
  slideId: string;
}

const SlideToolbar: React.FC<Props> = ({ slideId }) => {
  const { addBlock, setJustifyContent, setSlideAlignItems } = useBlockActions({
    slideId,
  });

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        mb: 2,
        flexDirection: "column",
        position: "fixed",
      }}
    >
      <Tooltip title="Добавить заголовок">
        <IconButton onClick={() => addBlock("heading")}>
          <TitleIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Добавить текст">
        <IconButton onClick={() => addBlock("paragraph")}>
          <TextFieldsIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Добавить код">
        <IconButton onClick={() => addBlock("code")}>
          <CodeIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Добавить цитату">
        <IconButton onClick={() => addBlock("quote")}>
          <FormatQuoteIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Добавить таблицу">
        <IconButton onClick={() => addBlock("table")}>
          <TableChartIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Добавить список">
        <IconButton onClick={() => addBlock("list")}>
          <ListIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Добавить график">
        <IconButton onClick={() => addBlock("chart")}>
          <BarChartIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Выравнивание влево">
        <IconButton onClick={() => setJustifyContent("flex-start")}>
          <FormatAlignLeftIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Выравнивание вправо">
        <IconButton onClick={() => setJustifyContent("flex-end")}>
          <FormatAlignRightIcon />
        </IconButton>
      </Tooltip>

      <ThemeSelector />

      <Tooltip title="Сверху">
        <IconButton onClick={() => setSlideAlignItems("flex-start")}>
          <VerticalAlignTopIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="По центру">
        <IconButton onClick={() => setSlideAlignItems("center")}>
          <VerticalAlignCenterIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Снизу">
        <IconButton onClick={() => setSlideAlignItems("flex-end")}>
          <VerticalAlignBottomIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default SlideToolbar;
