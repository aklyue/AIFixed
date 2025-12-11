import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../../../app/store";
import {
  deleteBlock,
  pushHistory,
  updateBlock,
} from "../../../../../../app/store/slices/editorSlice";
import { InlinePart, SlideBlock } from "../../../../../../shared/types";

interface useTextBlocksEditorProps {
  block: SlideBlock;
  id: string;
  slideId: string;
  editingBlock: SlideBlock;
  editValue: string;
  setEditValue: (val: string) => void;
  setEditingBlock: (val: any) => void;
}

export const useTextBlocksEditor = ({
  editingBlock,
  block,
  editValue,
  setEditingBlock,
  setEditValue,
  id,
  slideId,
}: useTextBlocksEditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const isEditing = editingBlock?.id === id;

  const theme = useSelector((state: RootState) =>
    state.editor.availableThemes.find(
      (t) => t.id === state.editor.globalThemeId
    )
  );

  const handleBlur = () => {
    if (block.type === "list" || block.type === "ordered-list") {
      const newItems = editValue
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const oldRichItems = block.richItems || [];
      const newRichItems = newItems.map((item, idx) => {
        const oldItem = oldRichItems[idx] || [];
        return oldItem.length
          ? oldItem.map((r) => ({ ...r, value: item })) // сохраняем тип и стили
          : [{ type: "text" as const, value: item }];
      });

      dispatch(
        updateBlock({
          id: block.id,
          newBlock: { ...block, items: newItems, richItems: newRichItems },
        })
      );
    } else {
      // Для параграфов и заголовков
      const oldRich = block.richText || [];
      const newRichText: InlinePart[] = editValue
        .split("\n")
        .map((line, idx) => {
          const oldLine = oldRich[idx];
          return {
            text: line,
            bold: oldLine?.bold,
            italic: oldLine?.italic,
            code: oldLine?.code,
          };
        });

      dispatch(
        updateBlock({
          id: block.id,
          newBlock: { ...block, text: editValue, richText: newRichText },
        })
      );
    }

    dispatch(pushHistory());
    setEditingBlock(null);
  };

  const handleEdit = () => {
    setEditingBlock({ type: block.type, id, slideId });
    if (block.type === "list" || block.type === "ordered-list") {
      setEditValue(block.items?.join("\n") || "");
    } else {
      setEditValue(block.text || "");
    }
  };

  const handleDelete = () => {
    dispatch(deleteBlock({ slideId, blockId: block.id }));
  };

  const handleSettingsChange = (settings: {
    fontFamily: string;
    fontSize: number;
  }) => {
    dispatch(
      updateBlock({
        id: block.id,
        newBlock: {
          ...block,
          style: {
            ...block.style,
            ...settings,
          },
        },
      })
    );
  };

  return {
    isEditing,
    handleBlur,
    handleDelete,
    handleEdit,
    handleSettingsChange,
    theme,
  };
};
