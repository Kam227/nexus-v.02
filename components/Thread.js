import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { firebase } from '../config';
import NavBar from '../components/NavBar';
import ThreadFeed from './ThreadFeed';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import Share from '../components/Share';

const Thread = ({route}) => {
  const navigation = useNavigation();
  const { interest } = route.params;
  const [userName, setUserName] = useState('');
  const [sortingOption, setSortingOption] = useState('hot');
  const [avatarLetter, setAvatarLetter] = useState('');

  const bottomSheetModalRef = React.useRef(null);

  const snapPoints = ['100%'];

  const handlePostPress = () => {
    navigation.navigate('PostThread', {interest: interest});
  };

  const handleSortingOptionChange = (option) => {
    setSortingOption(option);
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const currentUserUid = firebase.auth().currentUser.uid;
        const userSnapshot = await firebase
          .firestore()
          .collection('users')
          .doc(currentUserUid)
          .get();

        if (userSnapshot.exists) {
          const userData = userSnapshot.data();
          const name = userData.name;
          setUserName(name);
          setAvatarLetter(name.charAt(0).toUpperCase()); 
        }
      } catch (error) {
        console.log('Error fetching user information:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const goBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    navigation.setOptions({
      header: () => {
        return (
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={goBack}>
                <View style={styles.headerImg}>
                  <FontAwesome name="times" size={24} color="#000" />
                </View>
              </TouchableOpacity>
              <View style={styles.headerButtonsContainer}>
                <TouchableOpacity
                  style={[styles.headerButton, sortingOption === 'hot' && styles.activeHeaderButton]}
                  onPress={() => handleSortingOptionChange('hot')}
                >
                  <Text style={[styles.headerButtonText, sortingOption === 'hot' && styles.activeHeaderButtonText]}>
                  🔥 Hot
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerButton, sortingOption === 'new' && styles.activeHeaderButton]}
                  onPress={() => handleSortingOptionChange('new')}
                >
                  <Text style={[styles.headerButtonText, sortingOption === 'new' && styles.activeHeaderButtonText]}>
                    New 🥱
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      },
    });
  }, [navigation, avatarLetter, sortingOption]);

  return (
    <BottomSheetModalProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.feedContainer}>
          <ScrollView style={styles.scrollView}>
            <ThreadFeed sortingOption={sortingOption} interest={interest} />
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={handlePostPress}>
            <Feather name="plus" size={20} color="#fff" style={styles.buttonIcon} />
          </TouchableOpacity>
          <NavBar />
        </View>
        <BottomSheetModal ref={bottomSheetModalRef} index={0} snapPoints={snapPoints}>
          <Share />
        </BottomSheetModal>
      </SafeAreaView>
    </BottomSheetModalProvider>
  );
};

const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  headerButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  activeHeaderButton: {
    backgroundColor: '#ddd',
  },
  activeHeaderButtonText: {
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  button: {
    position: 'absolute',
    bottom: windowHeight * 0.1,
    right: 20,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#c581e7',
    borderRadius: 25,
    borderColor: '#ddd',
  },
  buttonIcon: {
    color: 'white',
  },
  buttonText: {
    color: '#888',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: 'white',
    padding: 7,
    marginBottom: 10
  },
  headerButtonsContainer: {
    flexDirection: 'row',
  },
  headerButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginLeft: 10,
  },
  headerButtonText: {
    color: '#888',
    fontWeight: 'bold',
  },
  activeHeaderButton: {
    backgroundColor: '#ddd',
  },
  activeHeaderButtonText: {
    color: '#000',
  },
  headerImg: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLetter: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Thread;