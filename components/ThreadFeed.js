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

const ThreadFeed = ({ sortingOption, interest }) => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);

  const bottomSheetModalRef = React.useRef(null);
  const snapPoints = ['100%'];

  const handlePresentModal = (threadId) => {
    bottomSheetModalRef.current?.present(threadId);
  };
  
  useEffect(() => {
    let unsubscribe = () => {};
  
    if (sortingOption === 'hot') {
      unsubscribe = firebase.firestore()
        .collection('groupChatRooms')
        .onSnapshot(querySnapshot => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            header: doc.data().header,
            body: doc.data().body,
            images: doc.data().images,
            postVote: doc.data().postVote || 0,
            votes: doc.data().votes || [],
            timestamp: doc.data().timestamp, 
            interest: doc.data().interest,
          })).filter(post => post.interest === interest || !('interest' in post)); 
          setPosts(data);
        });
    } else if (sortingOption === 'new') {
      unsubscribe = firebase.firestore()
        .collection('groupChatRooms')
        .orderBy('timestamp', 'desc')
        .onSnapshot(querySnapshot => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            header: doc.data().header,
            body: doc.data().body,
            images: doc.data().images,
            postVote: doc.data().postVote || 0,
            votes: doc.data().votes || [],
            timestamp: doc.data().timestamp,
            interest: doc.data().interest,
          })).filter(post => post.interest === interest || !('interest' in post)); 
          setPosts(data);
        });
    }
  
    return () => unsubscribe();
  }, [sortingOption, interest]);

  const sortedPosts = sortingOption === 'hot' ? [...posts].sort((a, b) => b.postVote - a.postVote) : posts;

  const navigateToPost = (threadId) => {
    navigation.navigate('ThreadPost', { threadId: threadId });
  };

  const navigateToReport = (threadId) => {
    navigation.navigate('Report', { threadId: threadId });
  };

  const handlePostVote = (threadId, type) => {
    const updatedPosts = posts.map(post => {
      if (post.id === threadId) {
        const currentUser = firebase.auth().currentUser;
        const userId = currentUser ? currentUser.uid : null;

        let newPostVote = post.postVote || 0;
        let newVotes = post.votes || [];

        if (type === 'upvote') {
          const userVote = newVotes.find(vote => vote.userId === userId);
          if (!userVote) {
            newPostVote += 1;
            newVotes.push({ userId, undo: -1 });
          } else if (userVote.undo === 1) {
            newPostVote += 2;
            userVote.undo = -1;
          }
        } else if (type === 'downvote') {
          const userVote = newVotes.find(vote => vote.userId === userId);
          if (!userVote) {
            newPostVote -= 1;
            newVotes.push({ userId, undo: 1 });
          } else if (userVote.undo === -1) {
            newPostVote -= 2;
            userVote.undo = 1;
          }
        }

        firebase.firestore().collection('groupChatRooms').doc(threadId).update({
          postVote: newPostVote,
          votes: newVotes,
        });

        const userRef = firebase.firestore().collection('users').doc(userId);
        userRef.get().then((doc) => {
          if (doc.exists) {
            const user = doc.data();
            const updatedUserPosts = user.posts.map((userPost) => {
              if (userPost.threadId === threadId) {
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

        return { ...post, postVote: newPostVote, votes: newVotes };
      }

      return post;
    });

    setPosts(updatedPosts);
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

  const renderPost = ({ item }) => (
      <TouchableOpacity onPress={() => navigateToPost(item.id)}>
      <View style={styles.postContainer}>
        <View style={styles.headerContainer}>
          <Image source={NexusImage} style={styles.image} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerText}>{item.header}</Text>
            <Text style={styles.timestampText}>{formatTimestamp(item.timestamp)}</Text>
          </View>
        </View>
        <Text numberOfLines={2} style={styles.bodyText}>{item.body}</Text>

        <View style={styles.imagesContainer}>
          {item.images && item.images.map((imageUrl, index) => (
            <Image
              key={index}
              source={{ uri: imageUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />
          ))}
        </View>

          <View style={styles.iconsContainer}>
            <View style={styles.leftIconsContainer}>
              <TouchableOpacity onPress={() => navigateToPost(item.id)}>
                <Feather name="message-circle" size={24} color="black" style={styles.commentIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateToReport(item.id)}>
                <Feather name="flag" size={24} color="black" style={styles.commentIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handlePresentModal(item.id)}>
                <Feather name="send" size={24} color="black" style={styles.commentIcon} />
              </TouchableOpacity>
            </View>
            <View style={styles.voteContainer}>
              <TouchableOpacity onPress={() => handlePostVote(item.id, 'upvote')}>
                <Feather
                  name="arrow-up"
                  size={24}
                  color={item.postVote > 0 ? 'green' : 'black'}
                />
              </TouchableOpacity>
              <Text style={styles.voteCount}>{item.postVote}</Text>
              <TouchableOpacity onPress={() => handlePostVote(item.id, 'downvote')}>
                <Feather
                  name="arrow-down"
                  size={24}
                  color={item.postVote < 0 ? 'red' : 'black'}
                />
              </TouchableOpacity>
            </View>
          </View>
          <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={snapPoints}
          >
          <Share threadId={item.id} />
          </BottomSheetModal>
        </View>
      </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedPosts}
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
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  postImage: {
    width: 100,
    height: 100,
    marginHorizontal: 5,
  },
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5, 
  },
  postImage: {
    width: '100%',
    height: 400, 
    resizeMode: 'contain', 
    borderRadius: 8,
  },
});

export default ThreadFeed;