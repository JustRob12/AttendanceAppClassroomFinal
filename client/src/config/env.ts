import { Platform } from 'react-native';

const ENV = {
  dev: {
    apiUrl: process.env.API_URL || 'http://192.168.1.5:3001',
  },
  prod: {
    apiUrl: process.env.API_URL || 'https://your-production-url.com',
  },
};

const getEnvVars = () => {
  // Add more conditions as needed
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export default getEnvVars(); 