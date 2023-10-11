import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { firebase } from '../config';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigation = useNavigation();

  const goBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <View style={{backgroundColor: 'white'}}>
            <TouchableOpacity onPress={goBack} style={styles.headerButton}>
            <FontAwesome name="times" size={24} color="#000" />
            </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const handleResetPassword = () => {
    if (email === '') {
      setMessage('Please enter your email');
    } else {
      // Check if the email exists in the user collection
      const usersRef = firebase.firestore().collection('users');
      usersRef
        .where('email', '==', email)
        .get()
        .then((querySnapshot) => {
          if (querySnapshot.empty) {
            setMessage('There is no account associated with this email');
          } else {
            setMessage('Check your email to reset your password!');
          }
        })
        .catch((error) => {
          console.log('Error checking email in user collection:', error);
        });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.message}>{message}</Text>
        <TextInput
          style={styles.input}
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="Enter your email"
          placeholderTextColor="#888"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleResetPassword}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerButton: {
    marginLeft: 16,
    marginTop: 15,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    color: 'red',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#c581e7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});