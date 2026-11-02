import React, { useRef } from "react";
import { RichTextPart, SlideBlock } from "../../../../../shared/types";
import {
  ChartBlockWrapper,
  CodeBlock,
  HeadingBlock,
  ListBlock,
  ParagraphBlock,
  QuoteBlock,
  TableBlockWrapper,
} from "../../../../../features/presentation/renderBlock";
import { Box } from "@mui/material";

interface RenderBlockProps {
  block: SlideBlock;
  id: string;
  slideId: string;
  editingBlock: any;
  editValue: RichTextPart[][];
  setEditValue: (val: RichTextPart[][]) => void;
  setEditingBlock: (val: any) => void;
  isMini?: boolean;
}

const RenderBlock: React.FC<RenderBlockProps> = (props) => {
  const { block } = props;
  const blockRef = useRef<HTMLDivElement>(null);

  const BlockComponent = (() => {
    switch (block.type) {
      case "heading":
        return HeadingBlock;
      case "paragraph":
        return ParagraphBlock;
      case "list":
      case "ordered-list":
        return ListBlock;
      case "quote":
        return QuoteBlock;
      case "code":
        return CodeBlock;
      case "table":
        return TableBlockWrapper;
      case "chart":
        return ChartBlockWrapper;
      default:
        return null;
    }
  })();

  if (!BlockComponent) return null;

  return (
    <Box
      ref={blockRef}
      sx={{
        display:
          block.type !== "table" && block.type !== "chart" ? "flex" : undefined,
        justifyContent: block.justifyContent,
      }}
    >
      <BlockComponent {...props} />
    </Box>
  );
};

export default RenderBlock;
