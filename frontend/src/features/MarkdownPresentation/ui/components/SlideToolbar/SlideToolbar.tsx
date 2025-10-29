import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import TextFieldsIcon from "@mui/icons-material/TextFieldsOutlined";
import CodeIcon from "@mui/icons-material/CodeOutlined";
import FormatQuoteIcon from "@mui/icons-material/FormatQuoteOutlined";
import TableChartIcon from "@mui/icons-material/TableChartOutlined";
import ListIcon from "@mui/icons-material/ListOutlined";
import BarChartIcon from "@mui/icons-material/BarChartOutlined";
import TitleIcon from "@mui/icons-material/TitleOutlined";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeftOutlined";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRightOutlined";
import VerticalAlignTopIcon from "@mui/icons-material/VerticalAlignTopOutlined";
import VerticalAlignCenterIcon from "@mui/icons-material/VerticalAlignCenterOutlined";
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottomOutlined";
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
        my: "auto",
        flexDirection: "column",
        position: "fixed",
        alignItems: "center",
        justifyContent: "center",
        maxHeight: "100vh",
      }}
    >
      <Tooltip title="Добавить заголовок">
        <IconButton onClick={() => addBlock("heading")} color="primary">
          <TitleIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Добавить текст">
        <IconButton onClick={() => addBlock("paragraph")} color="primary">
          <TextFieldsIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Добавить код">
        <IconButton onClick={() => addBlock("code")} color="primary">
          <CodeIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Добавить цитату">
        <IconButton onClick={() => addBlock("quote")} color="primary">
          <FormatQuoteIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Добавить таблицу">
        <IconButton onClick={() => addBlock("table")} color="primary">
          <TableChartIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Добавить список">
        <IconButton onClick={() => addBlock("list")} color="primary">
          <ListIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Добавить график">
        <IconButton onClick={() => addBlock("chart")} color="primary">
          <BarChartIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Выравнивание влево">
        <IconButton
          onClick={() => setJustifyContent("flex-start")}
          color="primary"
        >
          <FormatAlignLeftIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Выравнивание вправо">
        <IconButton
          onClick={() => setJustifyContent("flex-end")}
          color="primary"
        >
          <FormatAlignRightIcon />
        </IconButton>
      </Tooltip>

      <ThemeSelector />

      <Tooltip title="Сверху">
        <IconButton
          onClick={() => setSlideAlignItems("flex-start")}
          color="primary"
        >
          <VerticalAlignTopIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="По центру">
        <IconButton
          onClick={() => setSlideAlignItems("center")}
          color="primary"
        >
          <VerticalAlignCenterIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Снизу">
        <IconButton
          onClick={() => setSlideAlignItems("flex-end")}
          color="primary"
        >
          <VerticalAlignBottomIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default SlideToolbar;
