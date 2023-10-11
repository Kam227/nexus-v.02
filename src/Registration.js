import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { firebase } from '../config';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Registration = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigation = useNavigation();

    const goBackToLogin = () => {
        navigation.goBack();
      };

    useEffect(() => {
        navigation.setOptions({
            header: () => (
                <View style={{ backgroundColor: 'white' }}>
                    <TouchableOpacity onPress={goBackToLogin} style={styles.headerButton}>
                        <FontAwesome name="times" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation]);

    const handleNext = () => {
        if (currentPage === 1) {
            if (!firstName || !lastName || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateOfBirth)) {
                setError('Please fill in all fields correctly');
                return;
            }
        } else if (currentPage === 2) {
            const schoolDomain = email.split('@')[1];
            if (!email || !schoolDomain) {
                setError('Please enter a valid email');
                return;
            }
        } else if (currentPage === 3) {
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }
        setError('');
        setCurrentPage(currentPage + 1);
    };

    const goBack = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const registerUser = async () => {
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
    
        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const id = userCredential.user.uid
    
            await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
                firstName,
                lastName,
                email,
                password,
                dateOfBirth,
                school: email.split('@')[1],
                id,
            });
    
            alert('User registered successfully with ID: ' + userCredential.user.uid);
        } catch (error) {
            setError(error.message);
        }
    };
    
    
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Text style={styles.title}>Register Here!</Text>
                {currentPage === 1 && (
                    <View style={styles.inputContainer}>
                        {error ? <Text style={styles.error}>{error}</Text> : null}
                        <TextInput
                            style={styles.textInput}
                            placeholder="First Name"
                            onChangeText={setFirstName}
                            value={firstName}
                            autoCorrect={false}
                        />
                        <TextInput
                            style={styles.textInput}
                            placeholder="Last Name"
                            onChangeText={setLastName}
                            value={lastName}
                            autoCorrect={false}
                        />
                        <TextInput
                            style={styles.textInput}
                            placeholder="Date of Birth (XX/XX/XXXX)"
                            onChangeText={setDateOfBirth}
                            value={dateOfBirth}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity onPress={handleNext} style={styles.button}>
                            <Text style={styles.buttonText}>Next</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {currentPage === 2 && (
                    <View style={styles.inputContainer}>
                        {error ? <Text style={styles.error}>{error}</Text> : null}
                        <TextInput
                            style={styles.textInput}
                            placeholder="Email"
                            onChangeText={setEmail}
                            value={email}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                        />
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
                            <TouchableOpacity onPress={goBack} style={styles.button}>
                                <Text style={styles.buttonText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleNext} style={styles.button}>
                                <Text style={styles.buttonText}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {currentPage === 3 && (
                    <View style={styles.inputContainer}>
                        {error ? <Text style={styles.error}>{error}</Text> : null}
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Password"
                            onChangeText={setPassword}
                            value={password}
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry
                        />
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Confirm Password"
                            onChangeText={setConfirmPassword}
                            value={confirmPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry
                        />
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
                            <TouchableOpacity onPress={goBack} style={styles.button}>
                                <Text style={styles.buttonText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={registerUser} style={styles.button}>
                                <Text style={styles.buttonText}>Register</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default Registration;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollViewContent: {
        alignItems: 'center',
        paddingVertical: 50,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 23,
        marginBottom: 40,
    },
    inputContainer: {
        width: '80%',
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'black',
    },
    textInput: {
        backgroundColor: '#fcfcfc',
        borderRadius: 5,
        paddingBottom: 5,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
        paddingTop: 10,
        paddingBottom: 10,
    },
    button: {
        flex: 1,
        height: 40,
        backgroundColor: '#4267B2',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: 'white',
    },
    error: {
        color: 'red',
        marginBottom: 20,
        textAlign: 'center',
    },
    passwordInput: {
        backgroundColor: '#fcfcfc',
        borderRadius: 5,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 16,
        paddingLeft: 20,
        marginBottom: 20,
    },
    headerButton: {
        marginLeft: 16,
        marginTop: 15,
    },
});