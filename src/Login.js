import { View, Text, TextInput, StyleSheet, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { firebase } from '../config';
import { TouchableOpacity } from 'react-native-gesture-handler';
import logo from '../images/logoDark.png';
import { Ionicons } from '@expo/vector-icons';

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <View style={{backgroundColor: 'white', borderBottomColor: 'white'}}>
          <Text></Text>
        </View>
      ),
    });
  }, [navigation]);

  const forgetPassword = () => {
    firebase
      .auth()
      .sendPasswordResetEmail(email)
      .then(() => {
        alert('Password reset email sent');
      })
      .catch((error) => {
        alert(error);
      });
  };

  const loginUser = async (email, password) => {
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      setError('Invalid email, username, or password');
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <View>
        {error !== '' && <Text style={styles.errorText}>{error}</Text>}
        <TextInput
          style={styles.textInput}
          placeholder="Email"
          onChangeText={(email) => setEmail(email)}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="black"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            onChangeText={(password) => setPassword(password)}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showPassword}
            placeholderTextColor="black"
          />
          <TouchableOpacity style={styles.showPasswordIcon} onPress={toggleShowPassword}>
            <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color="black" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => loginUser(email, password)} style={styles.button}>
          <Text style={{ fontWeight: 'bold', fontSize: 22, color: '#fff' }}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
          <Text style={styles.registerText}>
            Don't have an account?{' '}
            <Text style={{ color: '#c581e7', fontWeight: 'bold' }}>Sign up!</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgetPasswordText}>Forget Password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  textInput: {
    paddingTop: 20,
    paddingBottom: 10,
    width: 300,
    fontSize: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    marginBottom: 20,
    color: 'black',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    fontSize: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    color: 'black',
  },
  showPasswordIcon: {
    paddingHorizontal: 10,
  },
  button: {
    marginTop: 20,
    height: 50,
    width: 300,
    backgroundColor: '#4267B2',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  registerText: {
    marginTop: 20,
    fontSize: 16,
    color: 'black',
  },
  forgetPasswordText: {
    marginTop: 20,
    fontSize: 16,
    color: '#c581e7',
  },
  logo: {
    width: 300,
    height: 100,
    marginBottom: 5,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
  },
});