import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { firebase } from '../config';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import Uploading from '../components/Uploading';
import * as ImagePicker from 'expo-image-picker'
import { addDoc, collection, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Picker } from '@react-native-picker/picker';
import { AppState } from 'react-native';


const PostBox = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [day, setDay] = useState('1');
  const [month, setMonth] = useState('01');
  const [year, setYear] = useState('2023');
  const [hourStart, setHourStart] = useState('1');
  const [hourEnd, setHourEnd] = useState('00');
  const [minutesStart, setMinutesStart] = useState('1');
  const [minutesEnd, setMinutesEnd] = useState('00');
  const [date, setDate] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [selectedAmPm1, setSelectedAmPm1] = useState('AM');
  const [selectedAmPm2, setSelectedAmPm2] = useState('AM');
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
    if (title.trim() === '' || description.trim() === '' || location.trim() === '') {
      setError('Please fill in all required fields.');
      return;
    }
  
    const formattedDate = `${month}/${day}/${year}`;
    
    const currentUser = firebase.auth().currentUser;
    const postId = firebase.firestore().collection('groupChatRooms').doc().id;

    try {
      const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
      if (!userDoc.exists) {
        setError('User not found');
        return;
      }

      const school = userDoc.data().school;

      const post = {
        postId: postId,
        title: title,
        description: description,
        location: location,
        date: formattedDate,
        timeStart: `${hourStart}:${minutesStart} ${selectedAmPm1}`,
        timeEnd: `${hourEnd}:${minutesEnd} ${selectedAmPm2}`,
        userId: currentUser.uid,
        school: school,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        images: selectedImages.map(image => image.url), 
      };

      const userPosts = {
        postId: postId,
        title: title,
        description: description,
        location: location,
        date: formattedDate,
        timeStart: `${hourStart}:${minutesStart} ${selectedAmPm1}`,
        timeEnd: `${hourEnd}:${minutesEnd} ${selectedAmPm2}`,
        userId: currentUser.uid,
        school: school,
      };

      const db = firebase.firestore();
      const groupChatRoomsCollection = db.collection('groupChatRooms');
      const userCollection = db.collection('users').doc(currentUser.uid);

      await groupChatRoomsCollection.doc(postId).set(post);

      await userCollection.update({
        posts: firebase.firestore.FieldValue.arrayUnion(userPosts),
      });

      console.log('Post added successfully in groupChatRooms and user collection!');
      setTitle('');
      setDescription('');
      setLocation('');
      setDate('');
      setTimeStart('');
      setTimeEnd('');
      setSelectedAmPm1('AM');
      setSelectedAmPm2('AM');
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

  const archiveExpiredPosts = async () => {
    const currentUser = firebase.auth().currentUser;
    const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
    const userPosts = userDoc.data().posts || [];
  
    const currentDate = new Date();
    const db = firebase.firestore();
    const batch = db.batch();
    const userRef = db.collection('users').doc(currentUser.uid);
    const groupChatRoomsCollection = db.collection('groupChatRooms');
    const archivedGroupChatRoomsCollection = db.collection('archivedGroupChatRooms');
  
    userPosts.forEach((post) => {
      const postEndTime = new Date(post.date + ' ' + post.timeEnd);
      if (postEndTime < currentDate) {
        const archivedPost = { ...post };
  
        const archivedPostRef = archivedGroupChatRoomsCollection.doc(post.postId);
        batch.set(archivedPostRef, archivedPost);
  
        batch.update(userRef, {
          archives: firebase.firestore.FieldValue.arrayUnion(post),
        });
  
        batch.update(userRef, {
          posts: firebase.firestore.FieldValue.arrayRemove(post),
        });
  
        const postRef = groupChatRoomsCollection.doc(post.postId);
        batch.delete(postRef);
      }
    });
  
    await batch.commit();
  };

  const archiveInterval = setInterval(archiveExpiredPosts, 90000);

  archiveExpiredPosts();

  useEffect(() => {
    return () => {
      clearInterval(archiveInterval);
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      const backgroundArchiveInterval = setInterval(archiveExpiredPosts, 900000);

      return () => {
        clearInterval(backgroundArchiveInterval);
      };
    }
  };

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription.remove(); 
    };
  }, []);
  
  return (
    <View style={[styles.container, isUploading && styles.uploadingBackground]}>
      <TextInput
        style={styles.input}
        placeholder="Title of event..."
        value={title}
        onChangeText={(text) => setTitle(text)}
        maxLength={60}
      />
      <TextInput
        style={styles.input}
        placeholder="Description of event... "
        value={description}
        onChangeText={(text) => setDescription(text)}
        multiline={true}
        maxLength={250}
      />
      <TextInput
        style={styles.input}
        placeholder="Location of event... "
        value={location}
        onChangeText={(text) => setLocation(text)}
        multiline={true}
        maxLength={60}
      />

      <View style={{flexDirection: 'row', marginBottom: 30}}>
      <Picker
          value={month}
          onValueChange={(itemValue) => setMonth(itemValue)}
          style={styles.timeInput}
        >
          <Picker.Item label="1" value="1"/>
          <Picker.Item label="2" value="2"/>
          <Picker.Item label="3" value="3"/>
          <Picker.Item label="4" value="4"/>
          <Picker.Item label="5" value="5"/>
          <Picker.Item label="6" value="6"/>
          <Picker.Item label="7" value="7"/>
          <Picker.Item label="8" value="8"/>
          <Picker.Item label="9" value="9"/>
          <Picker.Item label="10" value="10"/>
          <Picker.Item label="11" value="11"/>
          <Picker.Item label="12" value="12"/>
        </Picker>

        <Text>/   </Text>

        <Picker
          value={day}
          onValueChange={(itemValue) => setDay(itemValue)}
          style={styles.timeInput}
        >
          <Picker.Item label="00" value="00"/>
          <Picker.Item label="01" value="01"/>
          <Picker.Item label="02" value="02"/>
          <Picker.Item label="03" value="03"/>
          <Picker.Item label="04" value="04"/>
          <Picker.Item label="05" value="05"/>
          <Picker.Item label="06" value="06"/>
          <Picker.Item label="07" value="07"/>
          <Picker.Item label="08" value="08"/>
          <Picker.Item label="09" value="09"/>
          <Picker.Item label="10" value="10"/>
          <Picker.Item label="11" value="11"/>
          <Picker.Item label="12" value="12"/>
          <Picker.Item label="13" value="13"/>
          <Picker.Item label="14" value="14"/>
          <Picker.Item label="15" value="15"/>
          <Picker.Item label="16" value="16"/>
          <Picker.Item label="17" value="17"/>
          <Picker.Item label="18" value="18"/>
          <Picker.Item label="19" value="19"/>
          <Picker.Item label="20" value="20"/>
          <Picker.Item label="21" value="21"/>
          <Picker.Item label="22" value="22"/>
          <Picker.Item label="23" value="23"/>
          <Picker.Item label="24" value="24"/>
          <Picker.Item label="25" value="25"/>
          <Picker.Item label="26" value="26"/>
          <Picker.Item label="27" value="27"/>
          <Picker.Item label="28" value="28"/>
          <Picker.Item label="29" value="29"/>
          <Picker.Item label="30" value="30"/>
          <Picker.Item label="31" value="31"/>
        </Picker>

        <Text>/   </Text>

        <Picker
          selectedValue={year}
          onValueChange={(itemValue) => setYear(itemValue)}
          style={styles.amPmPicker}
        >
          <Picker.Item label="2023" value="2023"/>
          <Picker.Item label="2024" value="2024"/>
          <Picker.Item label="2025" value="2025"/>
          <Picker.Item label="2026" value="2026"/>
          <Picker.Item label="2027" value="2027"/>
          <Picker.Item label="2028" value="2028"/>
          <Picker.Item label="2029" value="2029"/>
          <Picker.Item label="2030" value="2030"/>
          <Picker.Item label="2031" value="2031"/>
          <Picker.Item label="2032" value="2032"/>
          <Picker.Item label="2033" value="2033"/>
          <Picker.Item label="2034" value="2034"/>
          <Picker.Item label="2035" value="2035"/>
          <Picker.Item label="2036" value="2036"/>
          <Picker.Item label="2037" value="2037"/>
          <Picker.Item label="2038" value="2038"/>
          <Picker.Item label="2039" value="2039"/>
          <Picker.Item label="2040" value="2040"/>
          <Picker.Item label="2041" value="2041"/>
          <Picker.Item label="2042" value="2042"/>
          <Picker.Item label="2043" value="2043"/>

        </Picker>
      </View>

      <View style={styles.timeContainer}>
        <Picker
          value={hourStart}
          onValueChange={(itemValue) => setHourStart(itemValue)}
          style={styles.timeInput}
        >
          <Picker.Item label="1" value="1"/>
          <Picker.Item label="2" value="2"/>
          <Picker.Item label="3" value="3"/>
          <Picker.Item label="4" value="4"/>
          <Picker.Item label="5" value="5"/>
          <Picker.Item label="6" value="6"/>
          <Picker.Item label="7" value="7"/>
          <Picker.Item label="8" value="8"/>
          <Picker.Item label="9" value="9"/>
          <Picker.Item label="10" value="10"/>
          <Picker.Item label="11" value="11"/>
          <Picker.Item label="12" value="12"/>
        </Picker>

        <Text>:   </Text>

        <Picker
          value={minutesStart}
          onValueChange={(itemValue) => setMinutesStart(itemValue)}
          style={styles.timeInput}
        >
          <Picker.Item label="00" value="00"/>
          <Picker.Item label="01" value="01"/>
          <Picker.Item label="02" value="02"/>
          <Picker.Item label="03" value="03"/>
          <Picker.Item label="04" value="04"/>
          <Picker.Item label="05" value="05"/>
          <Picker.Item label="06" value="06"/>
          <Picker.Item label="07" value="07"/>
          <Picker.Item label="08" value="08"/>
          <Picker.Item label="09" value="09"/>
          <Picker.Item label="10" value="10"/>
          <Picker.Item label="11" value="11"/>
          <Picker.Item label="12" value="12"/>
          <Picker.Item label="13" value="13"/>
          <Picker.Item label="14" value="14"/>
          <Picker.Item label="15" value="15"/>
          <Picker.Item label="16" value="16"/>
          <Picker.Item label="17" value="17"/>
          <Picker.Item label="18" value="18"/>
          <Picker.Item label="19" value="19"/>
          <Picker.Item label="20" value="20"/>
          <Picker.Item label="21" value="21"/>
          <Picker.Item label="22" value="22"/>
          <Picker.Item label="23" value="23"/>
          <Picker.Item label="24" value="24"/>
          <Picker.Item label="25" value="25"/>
          <Picker.Item label="26" value="26"/>
          <Picker.Item label="27" value="27"/>
          <Picker.Item label="28" value="28"/>
          <Picker.Item label="29" value="29"/>
          <Picker.Item label="30" value="30"/>
          <Picker.Item label="31" value="31"/>
          <Picker.Item label="32" value="32"/>
          <Picker.Item label="33" value="33"/>
          <Picker.Item label="34" value="34"/>
          <Picker.Item label="35" value="35"/>
          <Picker.Item label="36" value="36"/>
          <Picker.Item label="37" value="37"/>
          <Picker.Item label="38" value="38"/>
          <Picker.Item label="39" value="39"/>
          <Picker.Item label="40" value="40"/>
          <Picker.Item label="41" value="41"/>
          <Picker.Item label="42" value="42"/>
          <Picker.Item label="43" value="43"/>
          <Picker.Item label="44" value="44"/>
          <Picker.Item label="45" value="45"/>
          <Picker.Item label="46" value="46"/>
          <Picker.Item label="47" value="47"/>
          <Picker.Item label="48" value="48"/>
          <Picker.Item label="49" value="49"/>
          <Picker.Item label="50" value="50"/>
          <Picker.Item label="51" value="51"/>
          <Picker.Item label="52" value="52"/>
          <Picker.Item label="53" value="53"/>
          <Picker.Item label="54" value="54"/>
          <Picker.Item label="55" value="55"/>
          <Picker.Item label="56" value="56"/>
          <Picker.Item label="57" value="57"/>
          <Picker.Item label="58" value="58"/>
          <Picker.Item label="59" value="59"/>
        </Picker>

        <Picker
          selectedValue={selectedAmPm1}
          onValueChange={(itemValue) => setSelectedAmPm1(itemValue)}
          style={styles.amPmPicker}
        >
          <Picker.Item label="AM" value="AM" />
          <Picker.Item label="PM" value="PM" />
        </Picker>
      </View>

      <View style={styles.timeContainer}>
        <Picker
          value={hourEnd}
          onValueChange={(itemValue) => setHourEnd(itemValue)}
          style={styles.timeInput}
        >
          <Picker.Item label="1" value="1"/>
          <Picker.Item label="2" value="2"/>
          <Picker.Item label="3" value="3"/>
          <Picker.Item label="4" value="4"/>
          <Picker.Item label="5" value="5"/>
          <Picker.Item label="6" value="6"/>
          <Picker.Item label="7" value="7"/>
          <Picker.Item label="8" value="8"/>
          <Picker.Item label="9" value="9"/>
          <Picker.Item label="10" value="10"/>
          <Picker.Item label="11" value="11"/>
          <Picker.Item label="12" value="12"/>
        </Picker>

        <Text>:   </Text>

        <Picker
          value={minutesEnd}
          onValueChange={(itemValue) => setMinutesEnd(itemValue)}
          style={styles.timeInput}
        >
          <Picker.Item label="00" value="00"/>
          <Picker.Item label="01" value="01"/>
          <Picker.Item label="02" value="02"/>
          <Picker.Item label="03" value="03"/>
          <Picker.Item label="04" value="04"/>
          <Picker.Item label="05" value="05"/>
          <Picker.Item label="06" value="06"/>
          <Picker.Item label="07" value="07"/>
          <Picker.Item label="08" value="08"/>
          <Picker.Item label="09" value="09"/>
          <Picker.Item label="10" value="10"/>
          <Picker.Item label="11" value="11"/>
          <Picker.Item label="12" value="12"/>
          <Picker.Item label="13" value="13"/>
          <Picker.Item label="14" value="14"/>
          <Picker.Item label="15" value="15"/>
          <Picker.Item label="16" value="16"/>
          <Picker.Item label="17" value="17"/>
          <Picker.Item label="18" value="18"/>
          <Picker.Item label="19" value="19"/>
          <Picker.Item label="20" value="20"/>
          <Picker.Item label="21" value="21"/>
          <Picker.Item label="22" value="22"/>
          <Picker.Item label="23" value="23"/>
          <Picker.Item label="24" value="24"/>
          <Picker.Item label="25" value="25"/>
          <Picker.Item label="26" value="26"/>
          <Picker.Item label="27" value="27"/>
          <Picker.Item label="28" value="28"/>
          <Picker.Item label="29" value="29"/>
          <Picker.Item label="30" value="30"/>
          <Picker.Item label="31" value="31"/>
          <Picker.Item label="32" value="32"/>
          <Picker.Item label="33" value="33"/>
          <Picker.Item label="34" value="34"/>
          <Picker.Item label="35" value="35"/>
          <Picker.Item label="36" value="36"/>
          <Picker.Item label="37" value="37"/>
          <Picker.Item label="38" value="38"/>
          <Picker.Item label="39" value="39"/>
          <Picker.Item label="40" value="40"/>
          <Picker.Item label="41" value="41"/>
          <Picker.Item label="42" value="42"/>
          <Picker.Item label="43" value="43"/>
          <Picker.Item label="44" value="44"/>
          <Picker.Item label="45" value="45"/>
          <Picker.Item label="46" value="46"/>
          <Picker.Item label="47" value="47"/>
          <Picker.Item label="48" value="48"/>
          <Picker.Item label="49" value="49"/>
          <Picker.Item label="50" value="50"/>
          <Picker.Item label="51" value="51"/>
          <Picker.Item label="52" value="52"/>
          <Picker.Item label="53" value="53"/>
          <Picker.Item label="54" value="54"/>
          <Picker.Item label="55" value="55"/>
          <Picker.Item label="56" value="56"/>
          <Picker.Item label="57" value="57"/>
          <Picker.Item label="58" value="58"/>
          <Picker.Item label="59" value="59"/>
        </Picker>

        <Picker
          selectedValue={selectedAmPm2}
          onValueChange={(itemValue) => setSelectedAmPm2(itemValue)}
          style={styles.amPmPicker}
        >
          <Picker.Item label="AM" value="AM" />
          <Picker.Item label="PM" value="PM" />
        </Picker>
      </View>

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

export default PostBox;