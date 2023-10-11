import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { firebase } from '../config';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Report = ({ route }) => {
    const [selectedType, setSelectedType] = useState(null);
    const [description, setDescription] = useState('');
    const { postId } = route.params;
    const navigation = useNavigation()

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
  

  const handleTypeSelection = (type) => {
    setSelectedType(type);
  };

  const handleSubmit = () => {
    if (selectedType && description) {
      firebase
        .firestore()
        .collection('reports')
        .add({
          postId: postId,
          type: selectedType,
          description: description,
        })
        .then(() => {
          setSelectedType(null);
          setDescription('');
          console.log('Report submitted');
        })
        .catch((error) => {
          console.error('Error submitting report:', error);
        });
    }
  };  

  return (
    <View style={styles.container}>
      {!selectedType ? (
        <View>
          <Text style={styles.title}>Select the type of misdemeanor:</Text>
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => handleTypeSelection('Harassment')}
          >
            <Text style={styles.itemText}>Harassment </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => handleTypeSelection('Inappropriate Language')}
          >
            <Text style={styles.itemText}>Inappropriate Language </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => handleTypeSelection('Bullying')}
          >
            <Text style={styles.itemText}>Bullying </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => handleTypeSelection('Racism, Sexism, and Homophobia')}
          >
            <Text style={styles.itemText}>Racism, Sexism, and Homophobia </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => handleTypeSelection('Other')}
          >
            <Text style={styles.itemText}>Other </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.title}>Describe the misdemeanor:</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setDescription(text)}
            value={description}
            placeholder="Enter description"
            multiline
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
  },
  itemText: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    height: 100,
  },
  submitButton: {
    backgroundColor: '#c581e7',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
  },
  headerButton: {
    marginLeft: 16,
    marginTop: 15
  },
});

export default Report;