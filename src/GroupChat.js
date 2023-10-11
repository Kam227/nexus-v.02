import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { firebase } from '../config';
import NavBar from '../components/NavBar';
import Feed from '../components/Feed';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import Share from '../components/Share';
import { AppState } from 'react-native';

const GroupChat = () => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [sortingOption, setSortingOption] = useState('top');
  const [avatarLetter, setAvatarLetter] = useState('');

  const bottomSheetModalRef = React.useRef(null);

  const snapPoints = ['100%'];

  const handlePostPress = () => {
    navigation.navigate('PostBox');
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

  useEffect(() => {
    navigation.setOptions({
      header: () => {
        return (
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <View style={styles.headerImg}>
                  <Text style={styles.headerLetter}>{avatarLetter}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.headerButtonsContainer}>
                <TouchableOpacity
                  style={[styles.headerButton, sortingOption === 'top' && styles.activeHeaderButton]}
                  onPress={() => handleSortingOptionChange('top')}
                >
                  <Text style={[styles.headerButtonText, sortingOption === 'top' && styles.activeHeaderButtonText]}>
                  🏆 Top
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
            <Feed sortingOption={sortingOption} />
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={handlePostPress}>
            <Icon name="pencil" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>What's going on today...</Text>
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
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 3
  },
  buttonIcon: {
    marginRight: 10,
    color: 'black',
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
    borderRadius: 25,
    backgroundColor: '#c581e7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLetter: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default GroupChat;