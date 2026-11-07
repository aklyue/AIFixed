import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import { Box, Button, Card, CardContent, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { LandingSectionMarker } from "../../../../../shared/ui";
import { pricingPlans } from "../../lib/constants/pricingPlans";

const PricingPlans = () => {
  const navigate = useNavigate();

  return (
    <Container
      component="section"
      aria-labelledby="pricing-plans-title"
      maxWidth="lg"
      sx={{ py: { xs: 8, md: 12 } }}
    >
      <Box sx={{ mb: 5, textAlign: "center" }}>
        <LandingSectionMarker
          label="Понятные тарифы"
          variant="pricingMatrix"
          centered
        />
        <Typography
          id="pricing-plans-title"
          component="h2"
          variant="h4"
          fontWeight={700}
          sx={{ fontSize: { xs: "1.65rem", sm: "2rem", md: "2.5rem" } }}
        >
          Выберите подходящий план
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ mt: 1.5, maxWidth: 620, mx: "auto", lineHeight: 1.7 }}
        >
          Начните бесплатно и переходите на расширенный план, когда он вам понадобится.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 3,
          alignItems: "stretch",
        }}
      >
        {pricingPlans.map((pricingPlan) => (
          <Card
            key={pricingPlan.name}
            variant="outlined"
            sx={{
              display: "flex",
              borderRadius: 3,
              borderColor: pricingPlan.highlighted ? "primary.main" : "divider",
              borderWidth: pricingPlan.highlighted ? 2 : 1,
              bgcolor: "background.paper",
              boxShadow: pricingPlan.highlighted
                ? "0 16px 48px rgba(51, 78, 104, 0.12)"
                : "none",
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                p: { xs: 3, sm: 3.5 },
                width: "100%",
                "&:last-child": { pb: { xs: 3, sm: 3.5 } },
              }}
            >
              <Typography component="h3" variant="h6" fontWeight={700}>
                {pricingPlan.name}
              </Typography>
              <Typography
                component="p"
                variant="h4"
                fontWeight={700}
                sx={{ mt: 2, fontSize: { xs: "1.8rem", md: "2rem" } }}
              >
                {pricingPlan.price}
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 1, fontWeight: 400 }}
                >
                  / {pricingPlan.period}
                </Typography>
              </Typography>
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{ minHeight: 48, mt: 1, lineHeight: 1.65 }}
              >
                {pricingPlan.description}
              </Typography>

              <Button
                fullWidth
                variant={pricingPlan.highlighted ? "contained" : "outlined"}
                onClick={() =>
                  navigate("/auth", { state: { action: "register" } })
                }
                sx={{ mt: 3, py: 1.25, textTransform: "none", borderRadius: 2 }}
              >
                Приступить к работе
              </Button>

              <Box
                component="ul"
                sx={{
                  display: "grid",
                  gap: 1.5,
                  listStyle: "none",
                  p: 0,
                  mt: 3,
                  mb: 0,
                }}
              >
                {pricingPlan.features.map((pricingFeature) => (
                  <Box
                    component="li"
                    key={pricingFeature}
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                  >
                    <CheckCircleOutline
                      aria-hidden="true"
                      sx={{ fontSize: 19, color: "primary.main", mt: "2px" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {pricingFeature}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
};

export default PricingPlans;
