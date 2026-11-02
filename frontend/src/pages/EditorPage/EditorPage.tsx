import { Container } from "@mui/material";
import { MarkdownPresentation } from "../../widgets/presentation/PresentationEditor";
import { AnimatePresence, motion } from "framer-motion";

const EditorPage = () => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        style={{ height: "100%" }}
      >
        <Container
          sx={{
            maxWidth: "100% !important",
            maxHeight: "100% !important",
            px: "0 !important",
            height: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {/* <AiChat /> */}
          <MarkdownPresentation />
        </Container>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditorPage;
