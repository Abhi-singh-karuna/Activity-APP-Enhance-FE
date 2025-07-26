import Reactotron from "reactotron-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Extend the Console interface to include tron property
declare global {
  interface Console {
    tron: typeof Reactotron;
  }
}

// Create the Reactotron configuration
const reactotron = Reactotron.setAsyncStorageHandler(AsyncStorage) // AsyncStorage would either come from `react-native` or `@react-native-community/async-storage` depending on where you get it from
  .configure({
    name: "TimeTracker App",
    host: "192.168.29.169", // This should be your local IP address
  })
  .useReactNative({
    asyncStorage: false, // there's a reactotron bug with the async storage on Android, so we use setAsyncStorageHandler instead
    networking: {
      ignoreUrls: /symbolicate|127.0.0.1/,
    },
    editor: false, // there are issues with editor
    errors: { veto: (stackFrame) => false }, // or true to skip all stack trace lines
    overlay: false, // just turning off overlay
  })
  .connect();

// Add some helper functions for Reactotron debugging
// Clear the Reactotron timeline on every app refresh
Reactotron.clear?.();

// Make sure we log any reactotron errors in dev
console.tron = Reactotron;
Reactotron.onCustomCommand({
  command: "test",
  handler: () => {
    console.tron.log("This is a test");
  },
  title: "Test Command",
  description: "A simple test command",
});

export default reactotron;
