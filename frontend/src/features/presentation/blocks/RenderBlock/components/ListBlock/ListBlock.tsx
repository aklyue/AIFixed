import React from "react";
import { Box, Typography } from "@mui/material";
import EditableWrapper from "../EditableWrapper";
import TextEditor from "../TextEditor";
import { HeadingBlockProps } from "../HeadingBlock/HeadingBlock";
import { useTextBlocksEditor } from "../../hooks";

const ListBlock: React.FC<HeadingBlockProps> = ({
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
      minRows={block.items?.length || 3}
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
      <Box
        component={block.type === "ordered-list" ? "ol" : "ul"}
        sx={{ pl: 4, m: 0, minHeight: 40, minWidth: 75 }}
      >
        {block.items?.map((item, i) => (
          <Box
            key={i}
            component="li"
            sx={{
              textAlign: block.justifyContent === "flex-end" ? "end" : "start",
              "&::marker": { color: theme?.colors.heading || "#000" },
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontFamily:
                  block.style?.fontFamily || theme?.fonts.paragraph || "Arial",
                fontSize: block.style?.fontSize || 16,
                color: block.style?.color || theme?.colors.paragraph || "#000",
                display: "flex",
                alignItems: "center",
              }}
            >
              {item}
            </Typography>
          </Box>
        ))}
      </Box>
    </EditableWrapper>
  );
};

export default ListBlock;
