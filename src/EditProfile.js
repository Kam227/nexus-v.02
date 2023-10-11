import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { firebase } from '../config';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';

const EditProfile = ({ navigation }) => {
  const bottomSheetRef = useRef(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pseudonym, setPseudonym] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);

  const goBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={goBack} style={styles.headerButton}>
            <FontAwesome name="times" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerButton}>
            <FontAwesome name="cog" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);  

  useEffect(() => {
    const currentUser = firebase.auth().currentUser;
    const userRef = firebase.firestore().collection('users').doc(currentUser.uid);

    userRef
      .get()
      .then((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          setName(userData.name || '');
          setUsername(userData.username || '');
          setBio(userData.bio || '');
          setPseudonym(userData.pseudonym || '');
          setSelectedInterests(userData.interests || []);
        } else {
          console.log('User profile data not found in Firestore.');
        }
      })
      .catch((error) => {
        console.log('Error fetching user data:', error);
      });

  }, []);

  const handleInterestDelete = (interest) => {
    setSelectedInterests((prevInterests) => prevInterests.filter((item) => item !== interest));
  };

  const handleInterestSelect = (interest) => {
    if (selectedInterests.includes(interest)) {
      handleInterestDelete(interest);
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests((prevInterests) => [...prevInterests, interest]);
      }
    }
  };

  const handleOpenBottomSheet = () => {
    bottomSheetRef.current.present();
  };

  const handleCloseBottomSheet = () => {
    bottomSheetRef.current.close();
  };

  const handleSave = () => {
    const currentUser = firebase.auth().currentUser;
    const userRef = firebase.firestore().collection('users').doc(currentUser.uid);

    userRef
      .update({
        name: name,
        username: username,
        bio: bio,
        pseudonym: pseudonym,
        interests: selectedInterests,
      })
      .then(() => {
        console.log('Profile information saved successfully');
        navigation.goBack({ user: { ...currentUser, name, username, bio, pseudonym, interests: selectedInterests } });
      })
      .catch((error) => {
        console.log('Error saving profile information:', error);
      });
  };

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        <View style={styles.action}>
          <FontAwesome name='user-o' size={20} color='#666666' style={{marginLeft: 7}} />
          <TextInput
            placeholder='Name'
            placeholderTextColor='#666666'
            autoCorrect={false}
            style={styles.textInput}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.action}>
          <FontAwesome name='user' size={20} color='#666666' style={{marginLeft: 7}} />
          <TextInput
            placeholder='Username'
            placeholderTextColor='#666666'
            autoCorrect={false}
            style={styles.textInput}
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.action}>
          <FontAwesome name='envelope-o' size={20} color='#666666' style={{marginLeft: 7}} />
          <TextInput
            placeholder='Bio'
            placeholderTextColor='#666666'
            autoCorrect={false}
            style={styles.textInput}
            value={bio}
            onChangeText={setBio}
          />
        </View>

        <View style={styles.action}>
          <FontAwesome name='question' size={20} color='#666666' style={{marginLeft: 7}} />
          <TextInput
            placeholder='Pseudonym'
            placeholderTextColor='#666666'
            autoCorrect={false}
            style={styles.textInput}
            value={pseudonym}
            onChangeText={setPseudonym}
          />
        </View>

        <View style={styles.interestsContainer}>
          <TouchableOpacity style={styles.interestsInput} onPress={handleOpenBottomSheet}>
            {selectedInterests.map((interest) => (
              <View key={interest} style={styles.interestBubble}>
                <Text>{interest}</Text>
                <TouchableOpacity onPress={() => handleInterestDelete(interest)}>
                  <FontAwesome name='times' size={16} color='red' />
                </TouchableOpacity>
              </View>
            ))}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.commandButton} onPress={handleSave}>
          <Text style={styles.panelButtonTitle}>Submit</Text>
        </TouchableOpacity>

        <BottomSheetModal
          ref={bottomSheetRef}
          snapPoints={['50%']}
          backdropComponent={() => <View style={styles.backdrop} />}
        >
          <View style={styles.bottomSheet}>
            <Text style={styles.panelTitle}>Select Your Interests</Text>
            <ScrollView style={styles.scrollContainer}>
              {interests.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={selectedInterests.includes(interest) ? styles.selectedInterest : styles.interest}
                  onPress={() => handleInterestSelect(interest)}
                >
                  <Text>{interest}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseBottomSheet}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
};

const interests = [
  'Animals🐘', 
  'Aquariums💧', 
  'Architecture🏙️', 
  'Art🎨', 
  'Artificial Intelligence🦾', 
  'Baking🍞', 
  'Biology🧬', 
  'Botany🌿', 
  'Business💼', 
  'Camping⛺', 
  'Carpentry🪵', 
  'Chess♟️', 
  'Coaching🏆', 
  'Comic Books / Manga📚', 
  'Concerts🎶', 
  'Cosplay👗', 
  'Dance💃', 
  'Design📐', 
  'Engineering⚛️',
  'Environmental Action♻️', 
  'Farming🐄', 
  'Festivals🎪', 
  'Filmmaking🎥', 
  'Fundraising💸' , 
  'Gardening💐', 
  'Gymnastics🏋️', 
  'History⏳', 
  'Information Security🔐', 
  'Journalism📓', 
  'Kite Flying🪁', 
  'Maintenance🧹',
  'Math🧮', 
  'Television📺', 
  'Photography📸', 
  'Politics⚖️',  
  'Public Speaking🗣️', 
  'Running🏃‍♂️', 
  'Science🧪', 
  'Skateboarding🛹', 
  'Skiing🎿', 
  'Snowboarding🏂', 
  'Snorkeling🤿', 
  'Surfing🏄', 
  'Table Tennis🏓', 
  'Technology💻', 
  'Theatre🎭', 
  'Travel✈️', 
  'Wrestling🤼'
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  commandButton: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#FF6347',
    alignItems: 'center',
    marginTop: 10,
  },
  panel: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    width: '100%',
  },
  header: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#333333',
    shadowOffset: {width: -1, height: -3},
    shadowRadius: 2,
    shadowOpacity: 0.4,
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  panelHeader: {
    alignItems: 'center',
  },
  panelHandle: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00000040',
    marginBottom: 10,
  },
  panelTitle: {
    fontSize: 27,
    height: 35,
  },
  panelSubtitle: {
    fontSize: 14,
    color: 'gray',
    height: 30,
    marginBottom: 10,
  },
  panelButton: {
    padding: 13,
    borderRadius: 10,
    backgroundColor: '#2e64e5',
    alignItems: 'center',
    marginVertical: 7,
  },
  panelButtonTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
  },
  action: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    paddingBottom: 5,
  },
  actionError: {
    flexDirection: 'row',
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FF0000',
    paddingBottom: 5,
  },
  textInput: {
    flex: 1,
    marginTop: 0,
    paddingLeft: 10,
    color: '#333333',
  },


  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  icon: {
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    marginLeft: 6,
    color: '#333',
  },
  interestsContainer: {
    marginBottom: 20,
  },
  interestsInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '100%',
    flexWrap: 'wrap',
  },
  interestBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    margin: 4,
  },
  interestText: {
    marginRight: 6,
  },
  saveButton: {
    paddingVertical: 14,
    backgroundColor: '#007BFF',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  scrollContainer: {
    maxHeight: 200,
    marginBottom: 20,
  },
  interest: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedInterest: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: 'gray',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007BFF',
  },
  headerButton: {
     marginLeft: 16,
     marginTop: 15
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 7,
    marginTop: 10,
    backgroundColor: 'white',
  },
});

export default EditProfile;