import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { firebase } from '../config';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import Uploading from './Uploading';
import * as ImagePicker from 'expo-image-picker'
import { addDoc, collection, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const PostThread = ({ route }) => {
  const navigation = useNavigation();
  const { interest } = route.params;
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [image, setImage] = useState('');
  const [video, setVideo] = useState('');
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  const goBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <TouchableOpacity onPress={goBack} style={styles.headerButton}>
          <FontAwesome name="times" size={24} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const submitPost = async () => {
    if (header.trim() === '' || body.trim() === '') {
      setError('Please enter text in all sections');
      return;
    }

    const currentUser = firebase.auth().currentUser;
    const threadId = firebase.firestore().collection('groupChatRooms').doc().id;

    try {
      const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
      if (!userDoc.exists) {
        setError('User not found');
        return;
      }

      const thread = {
        threadId: threadId,
        header: header,
        body: body,
        interest: interest,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        images: selectedImages.map(image => image.url), 
      };

      const userThreads = {
        threadId: threadId,
        header: header,
        body: body,
        interest: interest,
        images: selectedImages.map(image => image.url), 
      };

      const db = firebase.firestore();
      const groupChatRoomsCollection = db.collection('groupChatRooms');
      const userCollection = db.collection('users').doc(currentUser.uid);

      await groupChatRoomsCollection.doc(threadId).set(thread);

      await userCollection.update({
        threads: firebase.firestore.FieldValue.arrayUnion(userThreads),
      });

      console.log('Post added successfully in groupChatRooms and user collection!');
      setHeader('');
      setBody('');
      setError('');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding post: ', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      firebase.firestore().collection('files'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            console.log('New file', change.doc.data());
            setFiles((prevFiles) => [...prevFiles, change.doc.data()]);
          }
        });
      }
    );

    return () => unsubscribe();
  }, []);

  async function pickImage() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1, 
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      await uploadImage(result.assets[0].uri, 'image');
    }
  }

  async function pickVideo() {
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [3, 4],
        quaility: 1,
    })

    if(!result.canceled){
        setImage(result.assets[0].uri);
        await uploadImage(result.assets[0].uri, 'video');
    }
  }

  async function uploadImage(uri, fileType) {
    setIsUploading(true);
    const response = await fetch(uri);
    const blob = await response.blob();
  
    const storageRef = ref(firebase.storage(), "Stuff/" + new Date().getTime()); 
    const uploadTask = uploadBytesResumable(storageRef, blob);
  
    uploadTask.on("state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes);
        setProgress(progress.toFixed());
      },
      (e) => {
        console.error(e);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            await saveRecord(fileType, downloadURL, new Date().toISOString());
            const newImage = {
              url: downloadURL,
              fileType: fileType,
              createdAt: new Date().toISOString(),
            };
            setSelectedImages((prevImages) => [...prevImages, newImage]);

            setIsUploading(false);
            setImage('')
            setVideo('')
            setProgress(0)
          });
      }
    );
  }  

  async function saveRecord(fileType, url, createdAt) {
    try {
        const db = firebase.firestore()
        const docRef = await addDoc(collection(db, 'files'), {
            fileType,
            url, 
            createdAt,
        });
        console.log("Document saved correctly", docRef.id)
    } catch(e) {
        console.log(e)
    }
  }

  const removeImage = (index) => {
    setSelectedImages((prevImages) => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);
      return newImages;
    });
  };

  return (
    <View style={[styles.container, isUploading && styles.uploadingBackground]}>
      <TextInput
        style={styles.input}
        placeholder="Enter a title..."
        value={header}
        onChangeText={(text) => setHeader(text)}
        maxLength={60}
      />
      <TextInput
        style={styles.input}
        placeholder="What's on your mind.. "
        value={body}
        onChangeText={(text) => setBody(text)}
        multiline={true}
        maxLength={500}
      />

      {image && <Uploading image={image} video={video} progress={progress} />}

      <View style={styles.iconsContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
          <Ionicons name="image" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={pickVideo} style={styles.iconButton}>
          <Ionicons name="videocam" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {selectedImages.length > 0 && (
        <View style={styles.selectedImagesContainer}>
          {selectedImages.map((image, index) => (
            <View key={index} style={styles.selectedImageWrapper}>
              <Image source={{ uri: image.url }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}>
                <FontAwesome name="times" size={18} color="black" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {error !== '' && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity onPress={submitPost} style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  uploadingBackground: {
    backgroundColor: 'rgba(150, 150, 150, 0.6)', 
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  timeInput: {
    flex: 1,
    borderColor: '#ccc',
    marginRight: 10,
    paddingHorizontal: 8,
  },
  submitButton: {
    backgroundColor: '#c581e7',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerButton: {
    marginLeft: 16,
    marginTop: 15
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  amPmPicker: {
    width: 80,
  },
  iconsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    marginBottom: 16,
  },
  iconButton: {
    marginRight: 10,
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  selectedImageWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: -15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostThread;