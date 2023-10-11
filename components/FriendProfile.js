import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { FontAwesome } from '@expo/vector-icons';
import { firebase } from '../config';
import NavBar from './NavBar';
import { useIsFocused } from '@react-navigation/native';
import { ProfileBody } from './ProfileBody';
import { ProfileButtons } from './ProfileBody';
import { formatDistanceToNow } from 'date-fns';
import NexusImage from '../images/Nexus.png';
import { Chase } from 'react-native-animated-spinkit';

const FriendProfile = ({ route, navigation }) => {
  const { userId } = route.params;
  const isFocused = useIsFocused();
  const [user, setUser] = useState(null);
  const [isMutuals, setIsMutuals] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [userThreads, setUserThreads] = useState([]);
  const [userArchives, setUserArches] = useState([]);
  const [userSaves, setUserSaves] = useState([]);
  const [liked, setLiked] = useState(true);
  const [posts, setPosts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [archives, setArchives] = useState([]);
  const [saves, setSaves] = useState([]);
  const [selectedPostType, setSelectedPostType] = useState("Activity");

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = firebase.firestore().collection('users').doc(userId);
        const snapshot = await userRef.get();
    
        if (snapshot.exists) {
          const userData = snapshot.data();
          setUser(userData);
          if (userData.posts) {
            const postsData = await Promise.all(
              userData.posts.map(async (post) => {
                const postRef = firebase.firestore().collection('groupChatRooms').doc(post.postId);
                const postSnapshot = await postRef.get();
                if (postSnapshot.exists) {
                  const postData = postSnapshot.data();
                  const currentUser = firebase.auth().currentUser;
                  const userId = currentUser ? currentUser.uid : null;
                  const userLiked = postData.votes && postData.votes.some(vote => vote.userId === userId && vote.value === 1);
    
                  return {
                    ...postData,
                    postVote: postData.postVote || 0,
                    postId: post.postId,
                    timestamp: postData.timestamp,
                    liked: userLiked, 
                  };
                } else {
                  console.log(`Post ${post.postId} not found`);
                }
              })
            );
            setUserPosts(postsData);
            setUserSaves(postsData);
          }
        } else {
          console.log('User not found');
        }
      } catch (error) {
        console.log('Error fetching user data: ', error);
      }
    };

    const fetchSavesData = async () => {
      try {
        const userRef = firebase.firestore().collection('users').doc(userId);
        const snapshot = await userRef.get();
    
        if (snapshot.exists) {
          const userData = snapshot.data();
          setUser(userData);
          if (userData.saves) {
            const savesData = await Promise.all(
              userData.saves.map(async (save) => {
                const saveRef = firebase.firestore().collection('groupChatRooms').doc(save.postId);
                const saveSnapshot = await saveRef.get();
                if (saveSnapshot.exists) {
                  const saveData = saveSnapshot.data();
                  const currentUser = firebase.auth().currentUser;
                  const userId = currentUser ? currentUser.uid : null;
                  const userLiked = saveData.votes && saveData.votes.some(vote => vote.userId === userId && vote.value === 1);
    
                  return {
                    ...saveData,
                    postVote: saveData.postVote || 0,
                    postId: save.postId,
                    timestamp: saveData.timestamp,
                    liked: userLiked, 
                  };
                } else {
                  console.log(`Saved post ${save.postId} not found`);
                }
              })
            );
            setUserSaves(savesData);
          }
        } else {
          console.log('User not found');
        }
      } catch (error) {
        console.log('Error fetching user data: ', error);
      }
    };

    const fetchThreadsData = async () => {
      try {
        const userRef = firebase.firestore().collection('users').doc(userId);
        const snapshot = await userRef.get();
    
        if (snapshot.exists) {
          const userData = snapshot.data();
          setUser(userData);
          if (userData.threads) {
            const threadsData = await Promise.all(
              userData.threads.map(async (thread) => {
                const threadRef = firebase.firestore().collection('groupChatRooms').doc(thread.threadId);
                const threadSnapshot = await threadRef.get();
                if (threadSnapshot.exists) {
                  const threadData = threadSnapshot.data();
                  const currentUser = firebase.auth().currentUser;
                  const userId = currentUser ? currentUser.uid : null;
                  const userLiked = threadData.votes && threadData.votes.some(vote => vote.userId === userId && vote.value === 1);
    
                  return {
                    ...threadData,
                    postVote: threadData.postVote || 0,
                    postId: thread.threadId,
                    timestamp: threadData.timestamp,
                    liked: userLiked, 
                  };
                } else {
                  console.log(`Thread ${thread.threadId} not found`);
                }
              })
            );
            setUserThreads(threadsData);
          }
        } else {
          console.log('User not found');
        }
      } catch (error) {
        console.log('Error fetching user data: ', error);
      }
    };

    const fetchArchives = async () => {
      try {
        const docRef = firebase.firestore().collection('users').doc(userId);
        const doc = await docRef.get();
    
        if (doc.exists) {
          const archivesData = doc.data().archives || [];
          setArchives(archivesData);
        } else {
          console.log('Document not found');
        }
      } catch (error) {
        console.error('Error fetching archives:', error);
      }
    };
    
    fetchArchives();
    fetchUserData();
    fetchSavesData();
    fetchThreadsData();
  }, [userId, isFocused, route.params]);  

  const checkMutualStatus = async () => {
    try {
      const currentUser = firebase.auth().currentUser;
      if (currentUser) {
        const currentUserID = currentUser.uid;

        const docRef = firebase.firestore().collection('users').doc(currentUserID);
        const doc = await docRef.get();

        if (doc.exists) {
          const userMutuals = doc.data().mutuals || [];
          setIsMutuals(userMutuals.includes(userId));
        } else {
          console.log('Document not found');
        }
      } else {
        console.log('User not logged in');
      }
    } catch (error) {
      console.error('Error fetching mutual status:', error);
    }
  };

  useEffect(() => {
    checkMutualStatus();
  }, [userId]);

  useEffect(() => {
    const unsubscribe = firebase.firestore()
      .collection('groupChatRooms')
      .onSnapshot(querySnapshot => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(data);
      });

    return () => unsubscribe();
  }, []);

  const handlePostVote = (postId) => {
    const postRef = firebase.firestore().collection('groupChatRooms').doc(postId);
  
    postRef.get().then((doc) => {
      if (doc.exists) {
        const post = doc.data();
        const currentUser = firebase.auth().currentUser;
        const userId = currentUser ? currentUser.uid : null;
  
        const userLiked = post.votes && post.votes.some(vote => vote.userId === userId && vote.value === 1);
  
        let newPostVote = post.postVote || 0;
        let newVotes = post.votes || [];
  
        if (userLiked) {
          newPostVote -= 1;
          newVotes = newVotes.filter(vote => !(vote.userId === userId && vote.value === 1));
        } else {
          newPostVote += 1;
          newVotes.push({ userId, value: 1 });
        }
  
        postRef.update({
          postVote: newPostVote,
          votes: newVotes,
        });
  
        const updatedPosts = posts.map(p => {
          if (p.id === postId) {
            return { ...p, postVote: newPostVote, votes: newVotes };
          }
          return p;
        });

        const updatedSaves = posts.map(p => {
          if (p.id === postId) {
            return { ...p, postVote: newPostVote, votes: newVotes };
          }
          return p;
        });
  
        setPosts(updatedPosts);
        setSaves(updatedSaves)
  
        const updatedUserPosts = userPosts.map(p => {
          if (p.postId === postId) {
            return { ...p, postVote: newPostVote, liked: !userLiked }; // Toggle liked property
          }
          return p;
        });

        const updatedUserSaves = userSaves.map(p => {
          if (p.postId === postId) {
            return { ...p, postVote: newPostVote, liked: !userLiked }; // Toggle liked property
          }
          return p;
        });
  
        setUserPosts(updatedUserPosts);
        setUserSaves(updatedUserSaves);
  
        const userRef = firebase.firestore().collection('users').doc(userId);
        userRef.update({ posts: updatedUserPosts, saves: updatedUserSaves });
      } else {
        console.log('Post not found');
      }
    }).catch((error) => {
      console.log('Error fetching post:', error);
    });
  };  
  
  const handleThreadVote = (threadId, type) => {
    const threadRef = firebase.firestore().collection('groupChatRooms').doc(threadId);
  
    threadRef.get().then((doc) => {
      if (doc.exists) {
        const thread = doc.data();
        const currentUser = firebase.auth().currentUser;
        const userId = currentUser ? currentUser.uid : null;
  
        let newPostVote = thread.postVote || 0;
        let newVotes = thread.votes || [];
  
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
  
        threadRef.update({
          postVote: newPostVote,
          votes: newVotes,
        });
  
        const updatedThreads = threads.map(p => {
          if (p.id === postId) {
            return { ...p, postVote: newPostVote, votes: newVotes };
          }
          return p;
        });
  
        setThreads(updatedThreads);
  
        const updatedUserThreads = userThreads.map(p => {
          if (p.threadId === threadId) {
            return { ...p, postVote: newPostVote };
          }
          return p;
        });
  
        setUserThreads(updatedUserThreads);
  
        const userRef = firebase.firestore().collection('users').doc(user.uid);
        userRef.update({ threads: updatedUserThreads });
      } else {
        console.log('Thread not found', error);
      }
    }).catch((error) => {
      console.log('Error fetching thread:', error);
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

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Chase size={80} color="#c581e7" />
      </View>
    );
  }

  const { id, name, username, bio } = user;

  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 10 }}>
      <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
      <ProfileBody
        name={name}
        username={username}
        bio={bio}
        postCount={userPosts.length}
        id={id}
      />
      <ProfileButtons id={userId} />

      <View style={styles.postTypeButtons}>
        <TouchableOpacity
          style={[
            styles.postTypeButton,
            selectedPostType === "Activity" && styles.selectedPostTypeButton,
          ]}
          onPress={() => setSelectedPostType("Activity")}
        >
          <Text>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.postTypeButton,
            selectedPostType === "Posts" && styles.selectedPostTypeButton,
          ]}
          onPress={() => setSelectedPostType("Posts")}
        >
          <Text>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.postTypeButton,
            selectedPostType === "Archives" && styles.selectedPostTypeButton,
          ]}
          onPress={() => setSelectedPostType("Archives")}
        >
          <Text>Archives</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.postTypeButton,
            selectedPostType === "Saved" && styles.selectedPostTypeButton,
          ]}
          onPress={() => setSelectedPostType("Saved")}
        >
          <Text>Saved</Text>
        </TouchableOpacity>
        </View>

      {isMutuals ? (

      <View style={styles.postsContainer}>
        {selectedPostType === 'Activity' && (
        <View>
        {userPosts.map((post) => (
          post && post.title && post.description && post.timestamp ? (
            <TouchableOpacity key={post.postId} onPress={() => navigation.navigate('Post', { postId: post.postId })}>
              <View style={styles.postContainer}>
                <View style={styles.headerContainer}>
                  <Image
                    source={NexusImage}
                    style={styles.image}
                  />
                  <View style={styles.headerContainerText}>
                    <Text numberOfLines={1} style={styles.headerText}>{post.title}</Text>
                    <Text style={styles.timestampText}>{formatTimestamp(post.timestamp)}</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.bodyText}>{post.description}</Text>
                <View style={styles.iconsContainer}>
                  <TouchableOpacity onPress={() => navigateToPost(post.postId)}>
                    <Feather name="message-circle" size={24} color="black" style={styles.commentIcon} />
                  </TouchableOpacity>
                  <View style={styles.voteContainer}>
                    <Text style={styles.voteCount}>{post.postVote}</Text>
                    <TouchableOpacity onPress={() => handlePostVote(post.postId)}>
                      <Feather
                        name="check"
                        size={24}
                        color={post.liked ? 'green' : 'black'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : null
        ))}
        </View>
        )}
        {selectedPostType === 'Posts' && (
        <View>
            {userThreads.map((thread) => (
                <TouchableOpacity key={thread.threadId} onPress={() => navigation.navigate('ThreadPost', { threadId: thread.threadId })}>
                  <View style={styles.postContainer}>
                    <View style={styles.headerContainer}>
                      <Image
                        source={NexusImage}
                        style={styles.image}
                      />
                      <View style={styles.headerContainerText}>
                        <Text numberOfLines={1} style={styles.headerText}>{thread.header}</Text>
                        <Text style={styles.timestampText}>{formatTimestamp(thread.timestamp)}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.bodyText}>{thread.body}</Text>
                    <View style={styles.iconsContainer}>
                      <TouchableOpacity onPress={() => navigateToPost(thread.threadId)}>
                        <Feather name="message-circle" size={24} color="black" style={styles.commentIcon} />
                      </TouchableOpacity>
                    <View style={styles.voteContainer}>
                     <TouchableOpacity onPress={() => handleThreadVote(thread.threadId, 'upvote')}>
                     <Feather
                     name="arrow-up"
                     size={24}
                     color={thread.postVote > 0 ? 'green' : 'black'}
                     />
                     </TouchableOpacity>
                     <Text style={styles.voteCount}>{thread.postVote}</Text>
                     <TouchableOpacity onPress={() => handleThreadVote(thread.threadId, 'downvote')}>
                     <Feather
                      name="arrow-down"
                      size={24}
                      color={thread.postVote < 0 ? 'red' : 'black'}
                      />
                      </TouchableOpacity>
                     </View>
                    </View>
                  </View>
                </TouchableOpacity>
            ))}
          </View>
        )}
        {selectedPostType === 'Archives' && (
        <View>
            {archives.map((archive) => (
                <TouchableOpacity
                  key={archive.postId} 
                  onPress={() => navigation.navigate('ArchivedPost', { archiveId: archive.postId })}
                >
                  <View style={styles.postContainer}>
                    <View style={styles.headerContainer}>
                      <Image
                        source={NexusImage}
                        style={styles.image}
                      />
                      <View style={styles.headerContainerText}>
                        <Text numberOfLines={1} style={styles.headerText}>{archive.title}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.bodyText}>{archive.description}</Text>
                    <View>
                      <TouchableOpacity style={{flexDirection: 'row'}} onPress={() => navigation.navigate('ArchivedPost', { archiveId: archive.postId })}>
                        <Text style={{marginTop: 2}}>View Archive</Text>
                        <View style={{backgroundColor: 'lightgray', borderRadius: 30, marginLeft: 5}}>
                         <Feather name="arrow-right" size={20} color="white" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}
        {selectedPostType === 'Saved' && (
          <View>
        {userSaves.map((post) => (
          post && post.title && post.description && post.timestamp ? (
            <TouchableOpacity key={post.postId} onPress={() => navigation.navigate('Post', { postId: post.postId })}>
              <View style={styles.postContainer}>
                <View style={styles.headerContainer}>
                  <Image
                    source={NexusImage}
                    style={styles.image}
                  />
                  <View style={styles.headerContainerText}>
                    <Text numberOfLines={1} style={styles.headerText}>{post.title}</Text>
                    <Text style={styles.timestampText}>{formatTimestamp(post.timestamp)}</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.bodyText}>{post.description}</Text>
                <View style={styles.iconsContainer}>
                  <TouchableOpacity onPress={() => navigateToPost(post.postId)}>
                    <Feather name="message-circle" size={24} color="black" style={styles.commentIcon} />
                  </TouchableOpacity>
                  <View style={styles.voteContainer}>
                    <Text style={styles.voteCount}>{post.postVote}</Text>
                    <TouchableOpacity onPress={() => handlePostVote(post.postId)}>
                      <Feather
                        name="check"
                        size={24}
                        color={post.liked ? 'green' : 'black'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : null
        ))}
          </View>
        )}
      </View>

      ) : (
        <View style={styles.lockContainer}>
          <Feather name="lock" style={styles.lockIcon} />
          <Text style={styles.lockText}>Must be following each other to view</Text>
        </View>
      )}
      </ScrollView>
      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockIcon: {
    fontSize: 100,
    color: 'black',
    marginBottom: 10,
  },
  lockText: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  postsContainer: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 10,
    width: '100%'
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
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 7,
    backgroundColor: '#ddb4f1'
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
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginTop: 'auto',
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  timestampText: {
    fontSize: 12,
    color: 'gray',
  },   
  headerButton: {
    marginLeft: 16,
    marginTop: 15
  }, 
  postTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  postTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 10,
  },
  selectedPostTypeButton: {
    borderBottomColor: '#c581e7',
    borderBottomWidth: 1,
  },
});

export default FriendProfile;