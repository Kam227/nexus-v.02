import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import ProgressBar from './ProgressBar';
import { Video } from 'expo-av';

const Uploading = ({ image, video, progress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        {image && (
          <Image
            source={{ uri: image }}
            style={styles.image}
          />
        )}
        {video && (
          <Video
            source={{
              uri: video,
            }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="contain"
            style={styles.video}
            useNativeControls
          />
        )}
        <Text style={styles.uploadingText}>Uploading...</Text>
        <ProgressBar progress={progress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(150, 150, 150, 0.6)', 
  },
  content: {
    width: '70%',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    borderRadius: 6,
  },
  video: {
    width: 200,
    height: 200,
  },
  uploadingText: {
    fontSize: 12,
  },
});

export default Uploading;