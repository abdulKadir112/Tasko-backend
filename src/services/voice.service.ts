import { Audio } from "expo-av";

let recording: Audio.Recording | null = null;

export async function startRecording() {
  try {
    await Audio.requestPermissionsAsync();

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    recording = new Audio.Recording();

    await recording.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    await recording.startAsync();

    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function stopRecording() {
  try {
    if (!recording) return null;

    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();

    recording = null;

    return uri;
  } catch (e) {
    console.log(e);
    return null;
  }
}