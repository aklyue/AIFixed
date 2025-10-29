import React from "react";
import { Typography } from "@mui/material";
import EditableWrapper from "../EditableWrapper";
import TextEditor from "../TextEditor";
import { SlideBlock } from "../../../../../../shared/types";
import { useTextBlocksEditor } from "../../hooks";

export interface HeadingBlockProps {
  block: SlideBlock;
  id: string;
  slideId: string;
  editingBlock: SlideBlock;
  editValue: string;
  setEditValue: (val: string) => void;
  setEditingBlock: (val: any) => void;
}

const HeadingBlock: React.FC<HeadingBlockProps> = ({
  block,
  id,
  slideId,
  editingBlock,
  editValue,
  setEditValue,
  setEditingBlock,
}) => {
  const {
    isEditing,
    handleBlur,
    handleDelete,
    handleEdit,
    handleSettingsChange,
    theme,
  } = useTextBlocksEditor({
    editingBlock,
    block,
    editValue,
    setEditingBlock,
    setEditValue,
    id,
    slideId,
  });

  return isEditing ? (
    <TextEditor
      value={editValue}
      onChange={setEditValue}
      onBlur={handleBlur}
      block={block}
    />
  ) : (
    <EditableWrapper
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSettingsChange={handleSettingsChange}
      block={block}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          minHeight: 40,
          display: "flex",
          alignItems: "center",
          minWidth: 105,
          fontFamily:
            block.style?.fontFamily || theme?.fonts.heading || "Arial",
          fontSize: block.style?.fontSize || "2rem",
          color: block.style?.color || theme?.colors.heading || "#000",
          textAlign: block.justifyContent === "flex-end" ? "end" : "start",
        }}
      >
        {block.text}
      </Typography>
    </EditableWrapper>
  );
};

export default HeadingBlock;
