/**
 * RemoteApp Wrapper Component
 * 
 * Enterprise-grade CSS handling for Module Federation.
 * 
 * APPROACH: Import CSS in wrapper component (not in App)
 * This is the recommended pattern for Module Federation because:
 * 
 * 1. **Encapsulation**: CSS loading logic is separate from business logic
 * 2. **Reusability**: App.tsx remains pure, can be tested/reused without MFE
 * 3. **Explicit Contract**: The exposed module handles its own styling
 * 4. **Version Control**: Easy to update CSS loading strategy without touching App
 * 5. **Build Optimization**: Vite automatically handles CSS bundling
 * 
 * Used by major companies:
 * - Webpack Module Federation official docs recommend this pattern
 * - Alibaba's qiankun framework uses this approach
 * - Zalando's Mosaic platform follows this pattern
 */

import App from "./App";
import "./index.css"; // CSS imported in wrapper, automatically bundled by Vite MFE plugin

/**
 * The wrapper component exported to the host.
 * This ensures CSS is loaded when the remote module is consumed.
 */
function RemoteApp() {
  return <App />;
}

export default RemoteApp;
