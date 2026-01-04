import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import AppsIcon from "@mui/icons-material/Apps";
import InfoIcon from "@mui/icons-material/Info";
import { RemotePage } from "./RemotePage";
import { APP_NAME, getGreeting, formatDate } from "@mfe/shared";

function HomePage() {
  const greeting = getGreeting();
  const today = formatDate(new Date());

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 3, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
        <Typography variant="h2" gutterBottom sx={{ fontWeight: "bold" }}>
          🏠 Host Application
        </Typography>
        <Typography variant="h5" sx={{ opacity: 0.9 }}>
          {greeting}! Welcome to {APP_NAME}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, opacity: 0.8 }}>
          Today is {today}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                🎨 Styling
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Material-UI (MUI) v6 with Emotion
              </Typography>
              <Chip label="Host App" color="primary" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="secondary" gutterBottom>
                ⚛️ Framework
              </Typography>
              <Typography variant="body2" color="text.secondary">
                React 19 with TypeScript
              </Typography>
              <Chip label="Modern" color="secondary" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="success" gutterBottom>
                🔗 Architecture
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Module Federation with Vite
              </Typography>
              <Chip label="Microfrontend" color="success" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ p: 3, mt: 3, backgroundColor: "#f5f5f5" }}>
        <Typography variant="h6" gutterBottom>
          📦 Shared Library
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Both Host and Remote apps share utilities from <code>@mfe/shared</code> package.
          This demonstrates singleton dependency management across microfrontends.
        </Typography>
      </Paper>
    </Container>
  );
}

function AboutPage() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom color="primary">
            About This POC
          </Typography>
          <Typography variant="body1" paragraph>
            This is a proof-of-concept demonstrating a microfrontend architecture using:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body1" paragraph>
              <strong>PNPM Workspaces:</strong> Monorepo management
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Vite + Module Federation:</strong> Fast builds and runtime module loading
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>React 19:</strong> Latest React features
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>MUI + Tailwind:</strong> Different styling systems coexisting
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Docker + Nginx:</strong> Single container deployment
            </Typography>
          </Box>
          <Paper elevation={0} sx={{ p: 2, mt: 2, backgroundColor: "#e3f2fd" }}>
            <Typography variant="body2" color="text.secondary">
              💡 The remote app is served as static assets only (not directly accessible),
              but can be promoted to an independent deployment with zero code changes.
            </Typography>
          </Paper>
        </CardContent>
      </Card>
    </Container>
  );
}

function Navigation() {
  const location = useLocation();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {APP_NAME}
        </Typography>
        <Button
          color="inherit"
          component={Link}
          to="/"
          startIcon={<HomeIcon />}
          variant={location.pathname === "/" ? "outlined" : "text"}
        >
          Home
        </Button>
        <Button
          color="inherit"
          component={Link}
          to="/remote-app"
          startIcon={<AppsIcon />}
          variant={location.pathname === "/remote-app" ? "outlined" : "text"}
        >
          Remote App
        </Button>
        <Button
          color="inherit"
          component={Link}
          to="/about"
          startIcon={<InfoIcon />}
          variant={location.pathname === "/about" ? "outlined" : "text"}
        >
          About
        </Button>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Box sx={{ flexGrow: 1 }}>
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/remote-app" element={<RemotePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Box>
    </BrowserRouter>
  );
}

export default App;
