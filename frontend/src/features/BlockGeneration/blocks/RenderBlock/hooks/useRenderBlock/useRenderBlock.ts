import { useEffect, useState } from "react";
import { SlideBlock } from "../../../../../../shared/types";

interface useRenderBlockProps {
  block: SlideBlock;
  onEdit: (id: string, textOrItems: string | string[]) => void;
}

export const useRenderBlock = ({ block, onEdit }: useRenderBlockProps) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(block.text || "");

  useEffect(() => {
    if ((block.type === "list" || block.type === "table") && block.items) {
      setValue(block.items.join("\n"));
    } else {
      setValue(block.text || "");
    }
  }, [block]);

  const handleBlur = () => {
    setEditing(false);
    if (block.type === "list" || block.type === "table") {
      onEdit(
        block.id,
        value.split("\n").map((v) => v.trim())
      );
    } else {
      onEdit(block.id, value);
    }
  };

  return {
    editing,
    setEditing,
    handleBlur,
    value,
    setValue,
  };
};
