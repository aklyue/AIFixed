import { Box, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { LandingSectionMarker } from "../../../../../shared/ui";

const StartBlock = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 220,
          borderTop: "1px solid lightgray",
          borderBottom: "1px solid lightgray",
          gap: 1,
        }}
      >
        <LandingSectionMarker
          label="Начните создавать"
          variant="actionVector"
          centered
        />
        <Button
          onClick={() => navigate("/auth", { state: { action: "register" } })}
          sx={{
            borderRadius: "8px",
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.main" },
            textTransform: "none",
            px: 4,
            py: 2,
          }}
        >
          Приступить к работе
        </Button>
      </Box>
    </Container>
  );
};

export default StartBlock;
