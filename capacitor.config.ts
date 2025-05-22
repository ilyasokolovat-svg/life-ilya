
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ed51e209aa73480d8809f5599078f3a6',
  appName: 'self-growth-calendar',
  webDir: 'dist',
  server: {
    url: 'https://ed51e209-aa73-480d-8809-f5599078f3a6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
