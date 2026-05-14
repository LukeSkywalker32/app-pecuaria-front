import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
   palette: {
      primary: {
         main: "#2D6A4F", // verde escuro
         light: "#52B788", // verde claro
         dark: "#1b4332", // verde mais escuro
         contrastText: "#FFFFFF", // texto branco
      },
      secondary: {
         main: "#40916c", // verde medio
         light: "#74c69d", // verde mais claro
         dark: "#2d6a4f", // verde escuro
         contrastText: "#FFFFFF",
      },
      background: {
         default: "#f5f5f5", // cinza claro
         paper: "#FFFFFF", // branco
      },
      success: {
         main: "#2d6a4f",
         light: "#52b788",
         dark: "#1b4332",
      },
      error: {
         main: "#d62828",
         light: "#f77f88",
         dark: "#a4161a",
      },
      warning: {
         main: "#fcbf49",
         light: "#fde2e4",
         dark: "#d4a574",
      },
      info: {
         main: "#457b9d",
         light: "#a8dadc",
         dark: "#1d3557",
      },
      text: {
         primary: "#1b4332", // Verde muito escuro para texto
         secondary: "#555555", // Cinza escuro
         disabled: "#bdbdbd", // Cinza claro
      },
   },
   typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
         fontSize: "2.5rem",
         fontWeight: 700,
         color: "#1b4332",
      },
      h2: {
         fontSize: "2rem",
         fontWeight: 700,
         color: "#1b4332",
      },
      h3: {
         fontSize: "1.75rem",
         fontWeight: 600,
         color: "#1b4332",
      },
      h4: {
         fontSize: "1.5rem",
         fontWeight: 600,
         color: "#1b4332",
      },
      h5: {
         fontSize: "1.25rem",
         fontWeight: 600,
         color: "#1b4332",
      },
      h6: {
         fontSize: "1rem",
         fontWeight: 600,
         color: "#1b4332",
      },
      body1: {
         fontSize: "1rem",
         lineHeight: 1.5,
      },
      body2: {
         fontSize: "0.875rem",
         lineHeight: 1.43,
      },
      button: {
         textTransform: "none",
         fontWeight: 600,
      },
   },
   shape: {
      borderRadius: 8,
   },
   components: {
      MuiButton: {
         styleOverrides: {
            root: {
               borderRadius: 8,
               textTransform: "none",
               fontWeight: 600,
               padding: "10px 24px",
               transition: "all 0.3s ease",
               "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(45, 106, 79, 0.3)",
               },
            },
            contained: {
               background: "linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)",
               "&:hover": {
                  background: "linear-gradient(135deg, #1b4332 0%, #0d2818 100%)",
               },
            },
         },
      },
      MuiCard: {
         styleOverrides: {
            root: {
               borderRadius: 12,
               boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
               transition: "all 0.3s ease",
               "&:hover": {
                  boxShadow: "0 8px 24px rgba(45, 106, 79, 0.15)",
               },
            },
         },
      },
      MuiTextField: {
         styleOverrides: {
            root: {
               "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                     borderColor: "#52b788",
                  },
                  "&.Mui-focused fieldset": {
                     borderColor: "#2d6a4f",
                  },
               },
            },
         },
      },
      MuiAppBar: {
         styleOverrides: {
            root: {
               background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
               boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            },
         },
      },
      MuiDrawer: {
         styleOverrides: {
            paper: {
               backgroundColor: "#f5f5f5",
               borderRight: "1px solid #e0e0e0",
            },
         },
      },
   },
});
