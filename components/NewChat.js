import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image, ScrollView, FlatList } from 'react-native';
import { firebase } from '../config';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import { formatDistanceToNow } from 'date-fns';
import NavBar from '../components/NavBar';
import Announcements from '../components/Announcements';
import logo from '../images/logoDark.png';

const NewChat = ({ navigation }) => {
  const [currentUserUid, setCurrentUserUid] = useState(null);
  const [userName, setUserName] = useState('');
  const [userInterests, setUserInterests] = useState([]);
  const [postsByInterest, setPostsByInterest] = useState({});

  const bottomSheetModalRef = React.useRef(null);

  const snapPoints = ['100%'];

  const handlePresentModal = () => {
    bottomSheetModalRef.current?.present();
  };

  useEffect(() => {
    navigation.setOptions({
      title: 'Nexus',
      headerStyle: { backgroundColor: '#fff' },
      headerTitleStyle: { color: 'black' },
      headerTintColor: 'black',
      header: () => {
        return (
          <BottomSheetModalProvider>
            <View>
              <View style={styles.topHeaderContainer}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
                <View style={{ alignItems: 'center' }}>
              </View>
                <View style={styles.iconsContainer}>
                  <TouchableOpacity onPress={handlePresentModal} style={styles.iconContainer}>
                    <Ionicons name="megaphone-outline" style={styles.icon} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.bottomHeaderContainer}>
                <TouchableOpacity style={styles.bottomIcon} onPress={() => navigation.navigate('Dashboard')}>
                  <Ionicons name='people-outline' style={styles.icon}/>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomIcon} onPress={() => navigation.navigate('NewChat')}>
                  <Ionicons name='globe-outline' style={styles.iconSelected}/>
                </TouchableOpacity>
              </View>
            </View>
          </BottomSheetModalProvider>
        );
      },      
    });
  }, [navigation]);

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
          setCurrentUserUid(currentUserUid);

          const interests = userData.interests || [];
          setUserInterests(interests);
        }
      } catch (error) {
        console.log('Error fetching user information:', error);
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchPostsByInterest = async () => {
      try {
        const postsSnapshot = await firebase
          .firestore()
          .collection('groupChatRooms')
          .orderBy('timestamp', 'desc')
          .get();

        const postsByInterest = {};

        postsSnapshot.forEach((doc) => {
          const postData = doc.data();
          const interest = postData.interest;

          if (userInterests.includes(interest)) {
            if (!postsByInterest[interest]) {
              postsByInterest[interest] = [];
            }

            postsByInterest[interest].push({
              id: doc.id,
              header: postData.header,
              body: postData.body,
              images: postData.images,
              timestamp: postData.timestamp,
              interest: interest,
            });
          }
        });

        setPostsByInterest(postsByInterest);
      } catch (error) {
        console.log('Error fetching posts by interest:', error);
      }
    };

    if (userInterests.length > 0) {
      fetchPostsByInterest();
    }
  }, [userInterests]);

  const handleInterestPress = (interest) => {
    navigation.navigate('Thread', { interest });
  };

  const formatTimestamp = (timestamp) => {
    if (timestamp) {
      const now = new Date();
      const messageDate = timestamp.toDate();
      const distance = formatDistanceToNow(messageDate, { addSuffix: true });
  
      if (messageDate < now && Math.abs(now - messageDate) >= 24 * 60 * 60 * 1000) {
        const formatOptions = {
          yesterday: "'Yesterday'",
          addSuffix: true,
        };
        if (Math.abs(now - messageDate) >= 365 * 24 * 60 * 60 * 1000) {
          formatOptions.year = "'Year(s)'";
        } else if (Math.abs(now - messageDate) >= 30 * 24 * 60 * 60 * 1000) {
          formatOptions.month = "'Month(s)'";
        } else if (Math.abs(now - messageDate) >= 24 * 60 * 60 * 1000) {
          formatOptions.day = "'Day(s)'";
        }
        return formatDistanceToNow(messageDate, formatOptions);
      }
  
      return distance;
    }
    return '';
  };  

  const renderPostItem = ({ item }) => (
    <TouchableOpacity
      style={styles.postContainer}
      onPress={() => navigation.navigate('ThreadPost', { threadId: item.id })}>
      <Text style={styles.postHeader}>{item.header}</Text>
      <Text style={styles.postTime}>{formatTimestamp(item.timestamp)}</Text>
      <Text style={styles.postBody}>{item.body}</Text>
  
      <View style={styles.imagesContainer}>
        {item.images &&
          item.images.map((imageUrl, index) => (
            <Image key={index} source={{ uri: imageUrl }} style={styles.image} />
          ))}
      </View>
    </TouchableOpacity>
  );

  const renderInterestItem = ({ item }) => (
    <View>
      <TouchableOpacity
        style={styles.interestContainer}
        onPress={() => handleInterestPress(item)}>
        <View style={styles.interestTitleContainer}>
          <Text style={styles.interestTitle}>{item}</Text>
          <Text style={styles.viewMoreText}>VIEW MORE </Text>
        </View>
      </TouchableOpacity>
      {postsByInterest[item] && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.postsContainer}>
          <FlatList
            data={postsByInterest[item].slice(0, 5)}
            horizontal
            renderItem={renderPostItem}
            keyExtractor={(item) => item.id}
          />
        </ScrollView>
      )}
    </View>
  );  

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
          <FlatList
            data={userInterests}
            renderItem={renderInterestItem}
            keyExtractor={(item, index) => index.toString()}
            style={styles.interestList}
          />
        <NavBar />
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={snapPoints}>
          <Announcements />
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    top: 5,
  },
  card: {
    width: '100%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userImgWrapper: {
    marginRight: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#c581e7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImg: {
    marginRight: 10,
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
  headerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  singleImgWrapper: {
    marginRight: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddb4f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  letter: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
    borderBottomColor: '#cccccc',
    borderBottomWidth: 1,
  },
  userInfoText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 13,
    color: 'black',
  },
  postTime: {
    fontSize: 12,
    color: "#ee5b50",
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
    marginBottom: 20,
    height: 70,
    width: 250,
    backgroundColor: '#c581e7',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  logoContainer: {
    marginLeft: 16,
    marginTop: 10,
    marginBottom: 10
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'your-fancy-font', 
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginLeft: 16,
    marginRight: 16,
  },
  bottomIcon: {
    marginLeft: 75,
    marginRight: 75,
  },
  icon: {
    fontSize: 24,
  },
  iconSelected: {
    fontSize: 24,
    color: '#c581e7'
  },
  topHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 5,
    backgroundColor: 'white',
  },
  bottomHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    marginBottom: 10
  },  
  bottomSheetContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
  },
  messageAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10
  },
  messageAvatarText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  messageTextContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    borderBottomColor: '#cccccc',
  },
  announcementText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  logo: {
    width: 100,
    height: 50,
    marginBottom: 5,
  },

  interestContainer: {
    marginHorizontal: 10,
    marginBottom: 10,
  },
  interestTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 5,
  },
  interestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewMoreText: {
    fontSize: 11,
    color: '#555',
  },
  postsContainer: {
    marginVertical: 10,
  },
  postContainer: {
    borderColor: 'rgba(128, 128, 128, 0.2)',
    borderWidth: 1,
    padding: 5,
    borderRadius: 10,
    marginVertical: 5,
    width: 220,
    height: 150, 
    marginRight: 10,
    overflow: 'hidden', 
  },
  postHeader: {
    fontSize: 12, 
    fontWeight: 'bold',
    color: '#9d9d9d'
  },
  postTime: {
    fontSize: 12,
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'left', 
  },
  postBody: {
    fontSize: 16,
    color: 'black',
    textAlign: 'left',
    fontWeight: 'bold',
    marginTop: 2
  },
  imagesContainer: {
    marginTop: 10,
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 100,
    resizeMode: 'cover',
    marginRight: 10,
    marginBottom: 12,
    marginLeft: 3,
  },
});

export default NewChat;