import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { firebase } from '../config';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'
import { addDoc, collection, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { notifyManager } from 'react-query';

const ServerCreate = ({ navigation }) => {
  const [mode, setMode] = useState('options');
  const [selectedReason, setSelectedReason] = useState('');
  const [serverName, setServerName] = useState('');
  const [serverImage, setServerImage] = useState('');
  const [image, setImage] = useState('');
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
        <View>
          <TouchableOpacity onPress={goBack} style={styles.headerButton}>
            <FontAwesome name="times" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const handleOptionSelect = (reason) => {
    setSelectedReason(reason);
    setMode('creation');
  };

  const handleCreateServer = async () => {
    if (!serverName) {
      alert('Please enter a server name');
      return;
    }

    try {
      const currentUser = firebase.auth().currentUser;
      const userId = currentUser ? currentUser.uid : null;

      if (userId) {
        const serverRef = firebase.firestore().collection('servers').doc();
        const serverData = {
          creator: userId,
          mods: [], 
          users: [], 
          reason: selectedReason,
          serverName,
          serverImage: selectedImages.map(image => image.url), 
        };

        await serverRef.set(serverData);

        navigation.navigate('Server', { serverId: serverRef.id });
      }
    } catch (error) {
      console.error('Error creating server:', error);
    }
  };

  const handleBackToOptions = () => {
    setMode('options');
    setServerName('');
    setServerImage('');
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

    if (!result.cancelled) {
      setImage(result.assets[0].uri);
      await uploadImage(result.assets[0].uri, 'image');
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
    <View style={styles.container}>
      {mode === 'options' ? (
        <>
          <Text style={styles.reasonText}>Select a Reason for Creating the Server:</Text>
          <TouchableOpacity style={styles.optionContainer} onPress={() => handleOptionSelect('School Club')}>
            <FontAwesome5 name="school" style={styles.optionIcon} />
            <Text style={styles.optionText}>School Club</Text>
            <FontAwesome5 name="chevron-right" style={styles.arrowIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionContainer} onPress={() => handleOptionSelect('Study Group')}>
            <FontAwesome5 name="book" style={styles.optionIcon} />
            <Text style={styles.optionText}>Study Group</Text>
            <FontAwesome5 name="chevron-right" style={styles.arrowIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionContainer} onPress={() => handleOptionSelect('Friends')}>
            <FontAwesome5 name="user-friends" style={styles.optionIcon} />
            <Text style={styles.optionText}>Friends</Text>
            <FontAwesome5 name="chevron-right" style={styles.arrowIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionContainer} onPress={() => handleOptionSelect('School Community')}>
            <FontAwesome5 name="users" style={styles.optionIcon} />
            <Text style={styles.optionText}>School Community</Text>
            <FontAwesome5 name="chevron-right" style={styles.arrowIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionContainer} onPress={() => handleOptionSelect('Class')}>
            <FontAwesome5 name="chalkboard-teacher" style={styles.optionIcon} />
            <Text style={styles.optionText}>Class</Text>
            <FontAwesome5 name="chevron-right" style={styles.arrowIcon} />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.centeredContainer}>
            <Text style={styles.serverTitle}>Create a Server</Text>
            <TouchableOpacity onPress={pickImage} style={styles.cameraButton}>
                <FontAwesome5 name="camera" style={styles.cameraIcon} />
                <Text style={styles.uploadText}>Upload</Text>
            </TouchableOpacity>
            {selectedImages.length > 0 && (
                <View style={styles.uploadedImageContainer}>
                {selectedImages.map((image, index) => (
                    <View key={index} style={styles.uploadedImageWrapper}>
                    <Image source={{ uri: image.url }} style={styles.uploadedImage} />
                    <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}>
                        <FontAwesome name="times" size={18} color="black" />
                    </TouchableOpacity>
                    </View>
                ))}
                </View>
            )}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Server Name (Required)"
            onChangeText={(text) => setServerName(text)}
          />
          
          <View style={styles.footer}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToOptions}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateServer}>
              <Text style={styles.createText}>Create</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  reasonText: {
    fontSize: 18,
    marginBottom: 10,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  arrowIcon: {
    fontSize: 18,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  serverDescription: {
    fontSize: 18,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  cameraIcon: {
    fontSize: 30,
  },
  uploadText: {
    fontSize: 16,
    marginLeft: 10,
  },
  plusButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'blue',
    borderRadius: 25,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    fontSize: 20,
    color: 'white',
  },
  input: {
    borderWidth: null,
    backgroundColor: 'lightgray',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  selectedImageWrapper: {
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 50,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  backButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  backText: {
    color: 'white',
  },
  createButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  createText: {
    color: 'white',
  },
  uploadedImageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    marginBottom: 10,
  },
  uploadedImageWrapper: {
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 50, 
  },
  headerButton: {
    marginLeft: 16,
    marginTop: 15
  },
});

export default ServerCreate;