import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { firebase } from '../config';
import { useNavigation } from '@react-navigation/native';

const Pseudonym = () => {
  const navigation = useNavigation();
  const [pseudonym, setPseudonym] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [showInterests, setShowInterests] = useState(false);

  useEffect(() => {
    const user = firebase.auth().currentUser;
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handlePseudonymSubmit = () => {
    if (currentUser) {
      firebase
        .firestore()
        .collection('users')
        .doc(currentUser.uid)
        .update({
          pseudonym: pseudonym,
        })
        .then(() => {
          console.log('Pseudonym updated successfully!');
          setShowInterests(true);
        })
        .catch((error) => {
          console.log('Error updating pseudonym:', error);
        });
    }
  };

  const handleInterestSubmit = () => {
    if (currentUser) {
      firebase
        .firestore()
        .collection('users')
        .doc(currentUser.uid)
        .update({
          interests: selectedInterests,
        })
        .then(() => {
          console.log('Interests updated successfully!');
          navigation.navigate('Dashboard');
        })
        .catch((error) => {
          console.log('Error updating interests:', error);
        });
    }
  };

  const handleInterestSelection = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests((prevInterests) => prevInterests.filter((item) => item !== interest));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests((prevInterests) => [...prevInterests, interest]);
      }
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <View style={styles.container}>
      {!showInterests ? (
        <>
          <Text style={styles.heading}>Set Your Pseudonym</Text>
          <TextInput
            style={styles.input}
            value={pseudonym}
            onChangeText={(text) => setPseudonym(text)}
            placeholder="Enter your pseudonym"
          />
          <Button title="Submit" onPress={handlePseudonymSubmit} />
        </>
      ) : (
        <>
          <Text style={styles.heading}>Select Your Interests</Text>
          <ScrollView style={styles.scrollContainer}>
            {interests.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={selectedInterests.includes(interest) ? styles.selectedInterest : styles.interest}
                onPress={() => handleInterestSelection(interest)}
              >
                <Text>{interest}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button
            title={selectedInterests.length > 0 ? "Submit Interests" : "Skip"}
            onPress={handleInterestSubmit}
          />
        </>
      )}
    </View>
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
  'Fundraising💸', 
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  scrollContainer: {
    maxHeight: 200,
    width: '100%',
    marginBottom: 20,
  },
  interest: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderColor: 'gray',
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
});

export default Pseudonym;