import { Box, Button, Card, CardActions, CardContent, Grid, Typography } from "@mui/material";
import ShopifyIntegration from "../integrations/ShopifyIntegration";

interface IAllChannelOptions {
  fromChannelList?: boolean;
}
const AllChannelOptions = ({ fromChannelList = false }: IAllChannelOptions) => {
  const connectedPlatforms = [
    {
      name: "Shopify",
      enabled: true,
      component: (
        <ShopifyIntegration fullWidth fromChannelList={fromChannelList} />
      ),
    },
    {
      name: "WooCommerce",
      enabled: false,
    },
    {
      name: "Magento V2",
      enabled: false,
    },
    {
      name: "BigCommerce",
      enabled: false,
    },
    {
      name: "Wix",
      enabled: false,
    },
    // {
    //   name: "Amazon",
    //   logo: "/logos/amazon.svg",
    //   popular: true,
    // },
    // {
    //   name: "Flipkart",
    //   logo: "/logos/flipkart.svg",
    //   popular: true,
    // },
    // {
    //   name: "Myntra",
    //   logo: "/logos/myntra.svg",
    // },
    // {
    //   name: "Meesho",
    //   logo: "/logos/meesho.svg",
    // },
    // {
    //   name: "Snapdeal",
    //   logo: "/logos/snapdeal.svg",
    // },
    // {
    //   name: "Magento",
    //   logo: "/logos/magento.svg",
    // },
    // {
    //   name: "eBay",
    //   logo: "/logos/ebay.svg",
    // },
  ];
  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 3,
        borderColor: "rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Typography fontWeight={500} color="primary.contrastText" mb={2}>
        Start by Connecting Your Store
      </Typography>
      <Grid container spacing={2}>
        {connectedPlatforms.map((platform) => (
          <Grid size={{ md: 3, xs: 12 }} key={platform.name}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                borderRadius: "10px",
                backdropFilter: "blur(12px)",
                transition: "0.3s ease",
                "&:hover": {
                  boxShadow: "0 0 0 2px #6c5989",
                },
              }}
            >
              {platform.enabled ? (
                platform.component
              ) : (
                <Card
                  variant="outlined"
                  sx={{
                    bgcolor: "transparent",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "inherit",
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    opacity: 0.65,
                    cursor: "not-allowed",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                    <Typography fontWeight={600}>{platform.name}</Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button size="small" variant="contained" disabled>
                      Coming Soon
                    </Button>
                  </CardActions>
                </Card>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
};

export default AllChannelOptions;
