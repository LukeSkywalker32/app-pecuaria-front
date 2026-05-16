import { createTheme } from "@mui/material/styles";

const theme = createTheme({
   palette: {
      primary: {
         main: "#1B4332",
         light: "#2D6A4F",
         dark: "#133326",
         contrastText: "#ffffff",
      },
      background: {
         default: "#1B4332",
         paper: "#ffffff",
      },
      text: {
         primary: "#1a1a1a",
         secondary: "#6B7280",
      },
   },
   typography: {
      fontFamily: "'Nunito', sans-serif",
      h4: {
         fontFamily: "'Playfair Display', serif",
         fontWeight: 500,
      },
   },
   shape: {
      borderRadius: 12,
   },
   components: {
      MuiButton: {
         styleOverrides: {
            root: {
               textTransform: "none",
               fontWeight: 700,
               fontSize: "15px",
               padding: "13px 0",
            },
         },
      },
      MuiOutlinedInput: {
         styleOverrides: {
            root: {
               borderRadius: 12,
               backgroundColor: "#F9FAFB",
            },
         },
      },
   },
});

export default theme;
