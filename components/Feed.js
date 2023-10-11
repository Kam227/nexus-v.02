import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from 'react-native-vector-icons';
import { firebase } from '../config';
import { formatDistanceToNow } from 'date-fns';
import NexusImage from '../images/Nexus.png';
import {
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import Share from './Share';

const Feed = ({ sortingOption }) => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [userSchool, setUserSchool] = useState('');
  const [mutualUserIds, setMutualUserIds] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);

  const bottomSheetModalRef = React.useRef(null);
  const snapPoints = ['100%'];

  const handlePresentModal = (postId) => {
    bottomSheetModalRef.current?.present(postId);
  };

  useEffect(() => {
    const currentUser = firebase.auth().currentUser;
  
    if (currentUser) {
      firebase.firestore().collection('users').doc(currentUser.uid).get().then((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          setUserSchool(userData.school);
  
          setMutualUserIds(userData.mutuals || []);
  
          const fetchUserNames = async () => {
            const names = {};
            for (const userId of userData.mutuals || []) {
              const userName = await getUserNameById(userId);
              names[userId] = userName;
            }
            setUserNames(names);
          };
          fetchUserNames();
        } else {
          console.log('User not found');
        }
      }).catch((error) => {
        console.log('Error fetching user:', error);
      });
    }

  }, []);
  
  useEffect(() => {
    let unsubscribe;

    if (sortingOption === 'top') {
      unsubscribe = firebase.firestore()
        .collection('groupChatRooms')
        .onSnapshot(querySnapshot => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            description: doc.data().description,
            location: doc.data().location,
            timeStart: doc.data().timeStart,
            timeEnd: doc.data().timeEnd,
            selectedAmPm1: doc.data().selectedAmPm1,
            selectedAmPm2: doc.data().selectedAmPm2,
            postVote: doc.data().postVote || 0,
            votes: doc.data().votes || [],
            school: doc.data().school,
            timestamp: doc.data().timestamp, 
          }));
          setPosts(data);
        });
    } else if (sortingOption === 'new') {
      unsubscribe = firebase.firestore()
        .collection('groupChatRooms')
        .orderBy('timestamp', 'desc')
        .onSnapshot(querySnapshot => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            description: doc.data().description,
            location: doc.data().location,
            timeStart: doc.data().timeStart,
            timeEnd: doc.data().timeEnd,
            selectedAmPm1: doc.data().selectedAmPm1,
            selectedAmPm2: doc.data().selectedAmPm2,
            postVote: doc.data().postVote || 0,
            votes: doc.data().votes || [],
            school: doc.data().school,
            timestamp: doc.data().timestamp, 
          }));
          setPosts(data);
        });
    }

    return () => unsubscribe();
  }, [sortingOption]);

  const sortedPosts = sortingOption === 'top' ? [...posts].sort((a, b) => b.postVote - a.postVote) : posts;

  const navigateToPost = (postId) => {
    navigation.navigate('Post', { postId: postId });
  };

  const navigateToReport = (postId) => {
    navigation.navigate('Report', { postId: postId });
  };

  const handlePostVote = (postId) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const currentUser = firebase.auth().currentUser;
        const userId = currentUser ? currentUser.uid : null;

        let newPostVote = post.postVote || 0;

        const userVote = post.votes.find(vote => vote.userId === userId);

        if (!userVote) {
          newPostVote += 1; 
          post.votes.push({ userId, value: 1 });
        } else {
          newPostVote -= userVote.value;
          userVote.value *= -1; 
        }

        firebase.firestore().collection('groupChatRooms').doc(postId).update({
          postVote: newPostVote,
          votes: post.votes,
        });

        const userRef = firebase.firestore().collection('users').doc(userId);
        userRef.get().then((doc) => {
          if (doc.exists) {
            const user = doc.data();
            const updatedUserPosts = user.posts.map((userPost) => {
              if (userPost.postId === postId) {
                return { ...userPost, postVote: newPostVote };
              }
              return userPost;
            });
            userRef.update({ posts: updatedUserPosts });
          } else {
            console.log('User not found');
          }
        }).catch((error) => {
          console.log('Error fetching user:', error);
        });

        return { ...post, postVote: newPostVote };
      }

      return post;
    });

    setPosts(updatedPosts);
  };

  const getUserNameById = (userId) => {
    return firebase.firestore().collection('users').doc(userId).get().then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        return userData.name; 
      } else {
        return 'Unknown User';
      }
    }).catch((error) => {
      console.log('Error fetching user name:', error);
      return 'Unknown User';
    });
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

  useEffect(() => {
    const currentUser = firebase.auth().currentUser;
    const fetchBookmarkedPosts = async () => {
      if (currentUser) {
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setBookmarkedPosts(userData.saves || []);
        }
      }
    };
    fetchBookmarkedPosts();
  }, []);

  const toggleBookmark = async (post) => { 
    const currentUser = firebase.auth().currentUser;
  
    if (!currentUser) {
      return;
    }
  
    const userRef = firebase.firestore().collection('users').doc(currentUser.uid);
    const userDoc = await userRef.get();
  
    if (userDoc.exists) {
      const userData = userDoc.data();
      const savedPosts = userData.saves || []; 
      const savedIndex = savedPosts.findIndex(savedPost => savedPost.postId === post.id);
  
      if (savedIndex === -1) {
        const updatedSaves = [
          ...savedPosts,
          {
            postId: post.id,
            title: post.title,
            description: post.description,
            location: post.location,
            timeStart: post.timeStart,
            timeEnd: post.timeEnd,
            postVote: post.postVote,
          },
        ];
        await userRef.update({ saves: updatedSaves });
  
        setBookmarkedPosts(updatedSaves);
      } else {
        const updatedSaves = savedPosts.filter(savedPost => savedPost.postId !== post.id);
        await userRef.update({ saves: updatedSaves });
  
        setBookmarkedPosts(updatedSaves);
      }
    }
  };

  const isPostBookmarked = (postId) => {
    return bookmarkedPosts.some(savedPost => savedPost.postId === postId);
  };

  const updateBookmarkedPosts = async () => {
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setBookmarkedPosts(userData.saves || []);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      updateBookmarkedPosts();
    });

    return unsubscribe;
  }, [navigation]);

  const renderPost = ({ item }) => (
    
      <TouchableOpacity onPress={() => navigateToPost(item.id)}>
      <View style={styles.postContainer}>
        <View style={styles.headerContainer}>
          <Image source={NexusImage} style={styles.image} />
          <View style={styles.headerTextContainer}>
            <Text numberOfLines={1} style={styles.headerText}>{item.title}</Text>
            <Text style={styles.timestampText}>{formatTimestamp(item.timestamp)}</Text>
          </View>
        </View>
          <Text numberOfLines={1} style={styles.bodyText}>{item.description}</Text>

      {item.votes.some(vote => mutualUserIds.includes(vote.userId)) && (
        <View>
          <TouchableOpacity style={{ flexDirection: 'row', marginBottom: 8 }} onPress={() => navigation.navigate('MutualsList', {postId: item.id, mutualUserIds, userNames,})}>
            <Text>Liked by </Text>
            {item.votes
              .filter(vote => mutualUserIds.includes(vote.userId))
              .map((vote, index, arr) => (
                <Text key={vote.userId} style={{ fontWeight: 'bold' }}>
                  {index === 0
                    ? userNames[vote.userId] || 'Loading...'
                    : index === 1
                    ? ` and ${userNames[vote.userId] || 'Loading...'}`
                    : null}
                  {index === arr.length - 1 && arr.length > 1
                    ? ` ...show more`
                    : null}
                </Text>
              ))}
          </TouchableOpacity>
        </View>
      )}

          <View style={styles.iconsContainer}>
            <View style={styles.leftIconsContainer}>
              <TouchableOpacity onPress={() => navigateToPost(item.id)}>
                <Feather name="message-circle" size={24} color="black" style={styles.commentIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateToReport(item.id)}>
                <Feather name="flag" size={24} color="black" style={styles.commentIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleBookmark(item)}>
                <Feather name="bookmark" size={24} color={isPostBookmarked(item.id) ? '#f5d41a' : 'black'} style={styles.commentIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handlePresentModal(item.id)}>
                <Feather name="send" size={24} color='black' style={styles.commentIcon} />
              </TouchableOpacity>
            </View>
            <View style={styles.voteContainer}>
            <Text style={styles.voteCount}>{item.postVote}</Text>
              <TouchableOpacity onPress={() => handlePostVote(item.id)}>
                <Feather
                  name="check"
                  size={24}
                  color={item.votes.find(vote => vote.userId === firebase.auth().currentUser?.uid)?.value === 1 ? 'green' : 'black'}
                />
              </TouchableOpacity>
            </View>
          </View>
          <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={snapPoints}
          >
          <Share postId={item.id} />
          </BottomSheetModal>
        </View>
      </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedPosts.filter(post => post.school === userSchool)}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 7,
    backgroundColor: '#ddb4f1'
  },
  postContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: 'gray',
  },
  bodyText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
    marginRight: 8,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteCount: {
    fontWeight: 'bold',
    fontSize: 18,
    marginHorizontal: 8,
  },
  commentIcon: {
    marginRight: 10,
  },
  timestampText: {
    fontSize: 12,
    color: 'gray',
  },
});

export default Feed;