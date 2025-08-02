import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const ReactotronTest = () => {
  useEffect(() => {
    // Test Reactotron on component mount
    console.tron?.log("🧪 ReactotronTest component mounted");
    console.tron?.log("🔧 Testing Reactotron functionality");

    // Test different log types
    console.tron?.log("📝 This is a regular log");
    console.tron?.warn("⚠️ This is a warning");
    console.tron?.error("❌ This is an error");

    // Test object logging
    console.tron?.log("📊 Test object:", {
      name: "Test Object",
      value: 42,
      nested: {
        key: "value",
        array: [1, 2, 3],
      },
    });

    // Test array logging
    console.tron?.log("📋 Test array:", ["item1", "item2", "item3"]);
  }, []);

  const testReactotron = () => {
    console.tron?.log("🎯 Button pressed - Reactotron test");
    console.tron?.log("⏰ Timestamp:", new Date().toISOString());

    // Test custom command
    console.tron?.display({
      name: "Custom Test",
      preview: "Reactotron is working!",
      value: {
        message: "Success!",
        timestamp: new Date().toISOString(),
        random: Math.random(),
      },
    });
  };

  const testNetworkLogging = () => {
    console.tron?.log("🌐 Testing network logging");
    // Simulate a network request
    fetch("https://jsonplaceholder.typicode.com/posts/1")
      .then((response) => response.json())
      .then((data) => {
        console.tron?.log("📡 Network response:", data);
      })
      .catch((error) => {
        console.tron?.log("❌ Network error:", error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reactotron Test</Text>
      <Text style={styles.subtitle}>Check Reactotron for logs</Text>

      <TouchableOpacity style={styles.button} onPress={testReactotron}>
        <Text style={styles.buttonText}>Test Reactotron</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testNetworkLogging}>
        <Text style={styles.buttonText}>Test Network Logging</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});

export default ReactotronTest;
