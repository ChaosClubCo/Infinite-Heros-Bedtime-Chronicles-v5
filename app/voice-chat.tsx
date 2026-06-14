import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { useSettings } from "@/lib/SettingsContext";

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

async function audioUriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Failed to read audio file"));
    reader.readAsDataURL(blob);
  });
}

function buildWavDataUri(pcm16Chunks: string[], sampleRate = 24000): string {
  const arrays = pcm16Chunks.map((chunk) => {
    const binary = atob(chunk);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return arr;
  });

  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
  const pcmData = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    pcmData.set(arr, offset);
    offset += arr.length;
  }

  const header = new Uint8Array(44);
  const dv = new DataView(header.buffer);
  header.set([0x52, 0x49, 0x46, 0x46], 0);
  dv.setUint32(4, 36 + pcmData.length, true);
  header.set([0x57, 0x41, 0x56, 0x45], 8);
  header.set([0x66, 0x6d, 0x74, 0x20], 12);
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  header.set([0x64, 0x61, 0x74, 0x61], 36);
  dv.setUint32(40, pcmData.length, true);

  const wav = new Uint8Array(44 + pcmData.length);
  wav.set(header);
  wav.set(pcmData, 44);

  const chunkSize = 8192;
  let binary = "";
  for (let i = 0; i < wav.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(wav.slice(i, i + chunkSize)));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function parseSseText(text: string): Array<{ type: string; data?: string; transcript?: string; error?: string }> {
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const line = block.split("\n").find((l) => l.startsWith("data: "));
      if (!line) return null;
      try {
        return JSON.parse(line.slice(6));
      } catch {
        return null;
      }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
}

function RecordButton({
  isRecording,
  isProcessing,
  onPressIn,
  onPressOut,
}: {
  isRecording: boolean;
  isProcessing: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      pulse.value = withRepeat(
        withTiming(1.18, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording, pulse]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isProcessing}
      accessibilityLabel={isRecording ? "Stop recording" : "Hold to speak"}
      accessibilityRole="button"
      style={styles.recordBtnOuter}
    >
      <Animated.View
        style={[
          styles.recordBtn,
          isRecording && styles.recordBtnActive,
          isProcessing && styles.recordBtnProcessing,
          animStyle,
        ]}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons
            name={isRecording ? "stop" : "mic"}
            size={32}
            color="#fff"
          />
        )}
      </Animated.View>
      <Text style={styles.recordLabel}>
        {isProcessing ? "Processing…" : isRecording ? "Release to send" : "Hold to speak"}
      </Text>
    </Pressable>
  );
}

export default function VoiceChatScreen() {
  const { settings } = useSettings();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await apiRequest("GET", "api/conversations");
      const { data } = await res.json() as { data: Conversation[] };
      setConversations(data);
    } catch {
      // Network error — show empty state
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  async function loadMessages(id: number) {
    setLoadingMsgs(true);
    try {
      const res = await apiRequest("GET", `api/conversations/${id}`);
      const conv = await res.json() as { messages: Array<{ role: string; content: string; id: number }> };
      setMessages(
        (conv.messages || []).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          id: String(m.id),
        }))
      );
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }

  async function createConversation() {
    try {
      const res = await apiRequest("POST", "api/conversations", { title: "New Adventure" });
      const conv = await res.json() as Conversation;
      setConversations((prev) => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
    } catch {
      Alert.alert("Could not start chat", "Voice chat requires a server connection.");
    }
  }

  async function deleteConversation(id: number) {
    try {
      await apiRequest("DELETE", `api/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch {
      // Silently ignore
    }
  }

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission needed", "Please allow microphone access to use voice chat.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      Alert.alert("Recording error", "Could not start recording. Please try again.");
    }
  }

  async function stopRecordingAndSend() {
    if (!recordingRef.current || activeConvId === null) return;
    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("No audio recorded");

      const base64Audio = await audioUriToBase64(uri);

      const res = await apiRequest("POST", `api/conversations/${activeConvId}/messages`, {
        audio: base64Audio,
        voice: "alloy",
      });

      const sseText = await res.text();
      const events = parseSseText(sseText);

      let userText = "";
      let assistantText = "";
      const pcm16Chunks: string[] = [];

      for (const event of events) {
        if (event.type === "user_transcript" && event.data) userText = event.data;
        if (event.type === "transcript" && event.data) assistantText += event.data;
        if (event.type === "audio" && event.data) pcm16Chunks.push(event.data);
        if (event.type === "done" && event.transcript) assistantText = event.transcript;
      }

      const newMessages: Message[] = [];
      if (userText) newMessages.push({ role: "user", content: userText, id: `u-${Date.now()}` });
      if (assistantText) newMessages.push({ role: "assistant", content: assistantText, id: `a-${Date.now()}` });
      setMessages((prev) => [...prev, ...newMessages]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      // Play back the assistant's audio response
      if (pcm16Chunks.length > 0) {
        await playPcm16Audio(pcm16Chunks);
      } else if (assistantText) {
        await playTtsAudio(assistantText);
      }
    } catch (err) {
      Alert.alert("Error", "Could not send voice message. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function playPcm16Audio(chunks: string[]) {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const wavUri = buildWavDataUri(chunks);
      const { sound } = await Audio.Sound.createAsync({ uri: wavUri });
      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      // Fallback to TTS if WAV playback fails — handled by caller
    }
  }

  async function playTtsAudio(text: string) {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const res = await apiRequest("POST", "api/tts", {
        text: text.slice(0, 5000),
        voice: settings.narratorVoice || "moonbeam",
        mode: "classic",
      });
      const { filename } = await res.json() as { filename: string };
      if (!filename) return;
      const audioUrl = `${getApiUrl()}api/tts-audio/${filename}`;
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      // Audio playback failed — UI already shows the text
    }
  }

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (activeConvId !== null) loadMessages(activeConvId);
  }, [activeConvId]);

  // Conversation list view
  if (activeConvId === null) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color={Colors.starlight} />
          </Pressable>
          <Text style={styles.headerTitle}>Voice Chat</Text>
          <Pressable onPress={createConversation} style={styles.newBtn} accessibilityLabel="Start new conversation" accessibilityRole="button">
            <Ionicons name="add" size={24} color={Colors.accent} />
          </Pressable>
        </View>

        {loadingConvs ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="mic-outline" size={64} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to start talking with your hero</Text>
            <Pressable onPress={createConversation} style={styles.startBtn} accessibilityLabel="Start first conversation" accessibilityRole="button">
              <Text style={styles.startBtnText}>Start Talking</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setActiveConvId(item.id)}
                style={styles.convItem}
                accessibilityLabel={`Open conversation: ${item.title}`}
                accessibilityRole="button"
              >
                <View style={styles.convIcon}>
                  <Ionicons name="chatbubble-outline" size={20} color={Colors.accent} />
                </View>
                <View style={styles.convInfo}>
                  <Text style={styles.convTitle}>{item.title}</Text>
                  <Text style={styles.convDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable
                  onPress={() => deleteConversation(item.id)}
                  hitSlop={12}
                  accessibilityLabel="Delete conversation"
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.3)" />
                </Pressable>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // Message view
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => { setActiveConvId(null); setMessages([]); }}
          style={styles.backBtn}
          accessibilityLabel="Back to conversations"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.starlight} />
        </Pressable>
        <Text style={styles.headerTitle}>Your Hero</Text>
        <View style={{ width: 40 }} />
      </View>

      {loadingMsgs ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 && (
            <View style={styles.emptyMessages}>
              <Text style={styles.emptySubtitle}>Hold the mic button to talk to your hero!</Text>
            </View>
          )}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.bubble, msg.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}
            >
              <Text style={[styles.bubbleText, msg.role === "user" ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
                {msg.content}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.recordArea}>
        <RecordButton
          isRecording={isRecording}
          isProcessing={isProcessing}
          onPressIn={startRecording}
          onPressOut={stopRecordingAndSend}
        />
        <Text style={styles.privacyNote}>
          Voice is sent to our AI partner to reply and isn’t stored by us.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: Colors.starlight,
  },
  newBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 20,
    color: Colors.starlight,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  startBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 8,
  },
  startBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  convIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(99,102,241,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  convInfo: {
    flex: 1,
  },
  convTitle: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 15,
    color: Colors.starlight,
  },
  convDate: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 24,
  },
  emptyMessages: {
    paddingTop: 60,
    alignItems: "center",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    padding: 14,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bubbleText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: "#fff",
  },
  bubbleTextAssistant: {
    color: Colors.starlight,
  },
  recordArea: {
    paddingVertical: 24,
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  privacyNote: {
    marginTop: 12,
    paddingHorizontal: 32,
    fontSize: 11,
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
  },

  recordBtnOuter: {
    alignItems: "center",
    gap: 10,
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  recordBtnActive: {
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
  },
  recordBtnProcessing: {
    backgroundColor: "rgba(99,102,241,0.5)",
    shadowOpacity: 0,
  },
  recordLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
});
