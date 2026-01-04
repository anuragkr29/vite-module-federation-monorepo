import React, { Suspense, Component, ErrorInfo, ReactNode } from "react";
import { Box, CircularProgress, Typography, Alert, Button } from "@mui/material";

const RemoteApp = React.lazy(() => import("remote/App"));

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Remote app error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Failed to load Remote Microfrontend
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {this.state.error?.message || "Unknown error occurred"}
            </Typography>
            <Typography variant="caption" component="pre" sx={{ 
              whiteSpace: "pre-wrap", 
              wordBreak: "break-word",
              display: "block",
              mt: 1,
              p: 2,
              bgcolor: "rgba(0,0,0,0.05)",
              borderRadius: 1
            }}>
              {this.state.error?.stack}
            </Typography>
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export function RemotePage() {
  return (
    <Box sx={{ p: 0 }}>
      <ErrorBoundary>
        <Suspense
          fallback={
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                gap: 2
              }}
            >
              <CircularProgress size={60} />
              <Typography variant="h6" color="text.secondary">
                Loading Remote Microfrontend...
              </Typography>
            </Box>
          }
        >
          <RemoteApp />
        </Suspense>
      </ErrorBoundary>
    </Box>
  );
}
