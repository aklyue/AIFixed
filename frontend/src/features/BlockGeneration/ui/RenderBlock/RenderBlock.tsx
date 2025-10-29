import React from "react";
import { SlideBlock } from "../../../../shared/types";
import {
  Box,
  Typography,
  List,
  ListItem,
  InputBase,
  darken,
} from "@mui/material";
import { useRenderBlock } from "../../hooks";

interface RenderBlockProps {
  block: SlideBlock;
  onEdit: (id: string, textOrItems: string | string[]) => void;
}

export const RenderBlock: React.FC<RenderBlockProps> = ({ block, onEdit }) => {
  const { editing, setEditing, handleBlur, value, setValue } = useRenderBlock({
    block,
    onEdit,
  });

  if (editing) {
    return (
      <InputBase
        multiline
        autoFocus
        fullWidth
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        sx={{
          border: "1px solid #ccc",
          borderRadius: 1,
          ml: block.type === "list" || block.type === "code" ? 2 : 0,
          width: "100%",
          boxSizing: "border-box",
          fontWeight: block.type === "heading" ? 700 : 400,
          fontSize:
            block.type === "heading"
              ? "1.25rem"
              : block.type === "code"
              ? "0.7rem"
              : "1rem",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      />
    );
  }

  const handleClick = () => setEditing(true);

  switch (block.type) {
    case "heading":
      return (
        <Typography
          variant="h6"
          sx={{ mb: 1, cursor: "pointer", fontWeight: "bold" }}
          onClick={handleClick}
        >
          {block.text}
        </Typography>
      );
    case "paragraph":
      return (
        <Typography
          variant="body1"
          sx={{ mb: 1, cursor: "pointer" }}
          onClick={handleClick}
        >
          {block.text}
        </Typography>
      );
    case "list":
      return (
        <List sx={{ mb: 1, cursor: "pointer" }} onClick={handleClick}>
          {block.items?.map((item, i) => (
            <ListItem key={i} sx={{ pl: 2, py: 0 }}>
              {item}
            </ListItem>
          ))}
        </List>
      );
    case "quote":
      return (
        <Typography
          sx={{
            mb: 1,
            pl: 2,
            borderLeft: "4px solid gray",
            fontStyle: "italic",
            cursor: "pointer",
          }}
          onClick={handleClick}
        >
          {block.text}
        </Typography>
      );
    case "code":
      return (
        <Box
          sx={{
            mb: 1,
            p: 1,
            backgroundColor: darken("#f5f5f5", 0.05),
            fontFamily: "monospace",
            whiteSpace: "pre",
            cursor: "pointer",
          }}
          onClick={handleClick}
        >
          {block.text}
        </Box>
      );
    case "table":
      return (
        <Typography sx={{ mb: 1, fontStyle: "italic" }}>Таблица</Typography>
      );
    case "chart":
      return (
        <Typography sx={{ mb: 1, fontStyle: "italic" }}>График</Typography>
      );
    default:
      return <Typography>{block.text}</Typography>;
  }
};
