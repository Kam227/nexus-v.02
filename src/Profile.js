import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Animated } from 'react-native';
import { firebase } from '../config';
import { useIsFocused } from '@react-navigation/native';
import NavBar from '../components/NavBar';
import { Feather, Ionicons, FontAwesome } from '@expo/vector-icons';
import { formatDistanceToNow, set } from 'date-fns';
import { Swipeable } from 'react-native-gesture-handler';
import NexusImage from '../images/Nexus.png';
import { Chase } from 'react-native-animated-spinkit';
import { AppState } from 'react-native';
import Nexus from '../images/NexusDark.png';

const Profile = ({ navigation, route }) => {
  const [mutualsCount, setMutualsCount] = useState(0);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [saves, setSaves] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [userThreads, setUserThreads] = useState([]);
  const [userSaves, setUserSaves] = useState([]);
  const [archives, setArchives] = useState([]);
  const [isSwiping, setIsSwiping] = useState(false);
  const [liked, setLiked] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState("Activity");
  const [userServers, setUserServers] = useState([]);
  const isFocused = useIsFocused();

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
    const fetchMutualsCount = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          const currentUserID = currentUser.uid;

          const docRef = firebase.firestore().collection('users').doc(currentUserID);
          const doc = await docRef.get();

          if (doc.exists) {
            const userMutuals = doc.data().mutuals || [];
            setMutualsCount(userMutuals.length);
          } else {
            console.log('Document not found');
          }
        } else {
          console.log('User not logged in');
        }
      } catch (error) {
        console.error('Error fetching mutuals count:', error);
      }
    };

    fetchMutualsCount();
  }, []);

  useEffect(() => {
    if (route.params && route.params.user) {
      setUser(route.params.user);
      if (route.params.user.posts) {
        setUserPosts(route.params.user.posts);
        setUserThreads(route.params.user.posts);
        setUserSaves(route.params.user.posts);
      }
    } else {
      const unsubscribeAuth = firebase.auth().onAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
          firebase
            .firestore()
            .collection('users')
            .doc(firebaseUser.uid)
            .get()
            .then((doc) => {
              if (doc.exists) {
                setUser({ uid: firebaseUser.uid, ...doc.data() });
                if (doc.data().posts) {
                  setUserPosts(doc.data().posts);
                  setUserThreads(doc.data().threads)
                  setUserSaves(doc.data().saves)
                }
              } else {
                console.log('User profile data not found in Firestore.');
              }
            })
            .catch((error) => {
              console.log('Error fetching user profile data:', error);
            });
        } else {
          setUser(null);
          setUserPosts([]);
          setUserThreads([]);
          setUserSaves([]);
        }
      });

      return () => unsubscribeAuth();
    }
  }, [isFocused, route.params]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          const currentUserID = currentUser.uid;
  
          const docRef = firebase.firestore().collection('users').doc(currentUserID);
          const doc = await docRef.get();
  
          if (doc.exists) {
            const userPostsData = doc.data().posts || [];
            const fetchedUserPosts = [];

            const userThreadsData = doc.data().threads || [];
            const fetchedUserThreads = [];

            const userSavesData = doc.data().saves || [];
            const fetchedUserSaves = [];

            for (const post of userPostsData) {
              const postDoc = await firebase.firestore().collection('groupChatRooms').doc(post.postId).get();
              if (postDoc.exists) {
                const postWithData = { ...post, timestamp: postDoc.data().timestamp };
            
                const userLiked = postDoc.data().votes && postDoc.data().votes.some(vote => vote.userId === currentUserID && vote.value === 1);
                postWithData.liked = userLiked; 
            
                fetchedUserPosts.push(postWithData);
              }
            }
            
            for (const thread of userThreadsData) {
              const threadDoc = await firebase.firestore().collection('groupChatRooms').doc(thread.threadId).get();
              if (threadDoc.exists) {
                const threadWithData = { ...thread, timestamp: threadDoc.data().timestamp };
                fetchedUserThreads.push(threadWithData);
              }
            }

            for (const save of userSavesData) {
              const saveDoc = await firebase.firestore().collection('groupChatRooms').doc(save.postId).get();
              if (saveDoc.exists) {
                const saveWithData = { ...save, timestamp: saveDoc.data().timestamp };

                const userLiked = saveDoc.data().votes && saveDoc.data().votes.some(vote => vote.userId === currentUserID && vote.value === 1);
                saveWithData.liked = userLiked; 

                fetchedUserSaves.push(saveWithData);
              }
            }
  
            setUserPosts(fetchedUserPosts);
            setUserThreads(fetchedUserThreads)
            setUserSaves(fetchedUserSaves)
          } else {
            console.log('Document not found');
          }
        } else {
          console.log('User not logged in');
        }
      } catch (error) {
        console.error('Error fetching user posts:', error);
      }
    };
  
    fetchUserPosts();
  }, [isFocused, route.params]);

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

  useEffect(() => {
    const fetchArchives = async () => {
      try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
          const currentUserID = currentUser.uid;
  
          const docRef = firebase.firestore().collection('users').doc(currentUserID);
          const doc = await docRef.get();
  
          if (doc.exists) {
            const archivesData = doc.data().archives || [];
            setArchives(archivesData);
          } else {
            console.log('Document not found');
          }
        } else {
          console.log('User not logged in');
        }
      } catch (error) {
        console.error('Error fetching archives:', error);
      }
    };
  
    fetchArchives();
  }, [isFocused]);

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

  const navigateToPost = (postId) => {
    navigation.navigate('Post', { postId: postId });
  };

  useEffect(() => {
    const currentUser = firebase.auth().currentUser;
    const userId = currentUser ? currentUser.uid : null;

    if (userId) {
      const serverRef = firebase.firestore().collection('servers');
      serverRef
        .where('creator', '==', userId)
        .get()
        .then((querySnapshot) => {
          const serversCreatedByUser = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          serverRef
            .where('users', 'array-contains', userId)
            .get()
            .then((querySnapshot) => {
              const serversUserIsIn = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));

              const allUserServers = [...serversCreatedByUser, ...serversUserIsIn];
              setUserServers(allUserServers);
            });
        })
        .catch((error) => {
          console.error('Error fetching user servers:', error);
        });
    }
  }, []);

  const handleDeletePress = async (postId) => {
    try {
      await firebase.firestore().collection('groupChatRooms').doc(postId).delete();
  
      const currentUser = firebase.auth().currentUser;
      if (currentUser) {
        const currentUserID = currentUser.uid;
        const userRef = firebase.firestore().collection('users').doc(currentUserID);
        const userDoc = await userRef.get();
  
        if (userDoc.exists) {
          const userData = userDoc.data();
          const userPostsData = userData.posts || [];
  
          const updatedUserPostsData = userPostsData.filter((post) => post.postId !== postId);
  
          await userRef.update({ posts: updatedUserPostsData });
  
          setUserPosts(updatedUserPostsData);
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };  

  const handleSwipeBegin = () => {
    setIsSwiping(true);
  };

  const [boxOpacity] = useState(new Animated.Value(0));

  const rightSwipe = (progress, postId) => {
    let scale = 1; 
  
    return (
      <View style={{ marginLeft: 10 }}>
        <TouchableOpacity onPress={() => handleDeletePress(postId)}>
          <View style={{ transform: [{ scale: scale }] }}>
            <Ionicons name="trash-outline" size={24} style={{ marginTop: 55 }} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Chase size={80} color="#c581e7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{user.name ? user.name[0].toUpperCase() : '?'}</Text>
        </View>
        <Text style={styles.userName}>{user.name ? user.name : `user-${firebase.auth().currentUser.uid}`}</Text>
        <Text>{user.username}</Text>
        <Text style={styles.aboutUser}>{user.bio}</Text>
        <View style={styles.userBtnWrapper}>
          <TouchableOpacity style={styles.userBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.userBtnTxt}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.userBtn} onPress={() => firebase.auth().signOut()}>
            <Text style={styles.userBtnTxt}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.userInfoWrapper}>
          <View style={styles.userInfoItem}>
            <Text style={styles.userInfoTitle}>{userPosts.length}</Text>
            <Text style={styles.userInfoSubTitle}>Posts</Text>
          </View>
          <View style={styles.userInfoItem}>
            <Text style={styles.userInfoTitle}>{mutualsCount}</Text>
            <Text style={styles.userInfoSubTitle}>Mutuals</Text>
          </View>
        </View>
        
      <View style={styles.serversContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.serverCreatorContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('ServerCreate')}>
                <View style={styles.serverCreatorButton}>
                  <FontAwesome name="plus" size={24} color="gray" />
                </View>
              </TouchableOpacity>
            </View>
            {userServers.map((server, index) => (
              <View key={index} style={styles.serverContainer}>
                {server.serverImage ? (
                  <TouchableOpacity onPress={() => navigation.navigate('Server', { serverId: server.id, serverName: server.serverName })}>
                    <Image
                      source={{ uri: String(server.serverImage) }}
                      style={styles.serverImage}
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => navigation.navigate('Server', server.id)}>
                    <Image 
                      source={Nexus}
                      style={styles.serverImage}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}
      </ScrollView>
    </View>

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

        <View style={styles.postsContainer}>
          {selectedPostType === 'Activity' && (
          <View>
          {userPosts.map((post) => (
            <Swipeable
              key={post.postId}
              renderRightActions={(progress, dragX) =>
                rightSwipe(progress, post.postId)
              }
              onSwipeableWillBegin={handleSwipeBegin} 
            >
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
            </Swipeable>
          ))}
          </View>
          )}
          {selectedPostType === 'Posts' && (
            <View>
          {userThreads.map((thread) => (
            <Swipeable
              key={thread.threadId}
              renderRightActions={(progress, dragX) =>
                rightSwipe(progress, thread.threadId)
              }
              onSwipeableWillBegin={handleSwipeBegin} 
            >
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

                  <View style={styles.imagesContainer}>
                    {thread.images && thread.images.map((imageUrl, index) => (
                      <Image
                        key={index}
                        source={{ uri: imageUrl }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    ))}
                  </View>

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
            </Swipeable>
          ))}
            </View>
          )}
          {selectedPostType === 'Archives' && (
            <View>
          {archives.map((archive) => (
              <TouchableOpacity
                key={archive.postId} 
                onPress={() => navigation.navigate('ArchivedPost', {postId: archive.postId})}
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
                    <TouchableOpacity style={{flexDirection: 'row'}} onPress={() => navigation.navigate('ArchivedPost', {postId: archive.postId})}>
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
          ))}
            </View>
          )}
        </View>
      </ScrollView>
      <NavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      padding: 20,
    },
    scrollViewContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    userImg: {
      height: 150,
      width: 150,
      borderRadius: 75,
    },
    userName: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 10,
      marginBottom: 10,
    },
    aboutUser: {
      fontSize: 12,
      fontWeight: '600',
      color: '#666',
      textAlign: 'center',
      marginBottom: 10,
    },
    userBtnWrapper: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '100%',
      marginBottom: 10,
      marginTop: 10
    },
    userBtn: {
      borderColor: '#c581e7',
      borderWidth: 2,
      borderRadius: 3,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginHorizontal: 5,
    },
    userBtnTxt: {
      color: 'black',
    },
    userInfoWrapper: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginVertical: 20,
    },
    userInfoItem: {
      justifyContent: 'center',
    },
    userInfoTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 5,
      textAlign: 'center',
    },
    userInfoSubTitle: {
      fontSize: 12,
      color: '#666',
      textAlign: 'center',
    },
      IconBehave: {
        padding: 14,
      },
      IconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
      },
      IconText: {
        marginTop: 5,
        textAlign: 'center',
        color: '#448aff',
      },
      avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#c581e7',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
      },
      avatarLetter: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#eee',
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
      serverCreatorContainer: {
        alignItems: 'center',
        marginTop: 20,
      },
    
      serverCreatorButton: {
        backgroundColor: 'lightgray',
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.7, 
      },
      serversContainer: {
        flexDirection: 'row',
        marginRight: 10,
      },
      serverContainer: {
        width: 60,
        height: 60,
        borderColor: 'gray',
        borderRadius: 30,
      },
      serverImage: {
        width: 60,
        height: 60,
        resizeMode: 'contain', 
        borderRadius: 30,
        marginRight: 7,
      },
      serverCreatorContainer: {
        marginRight: 10,
      },
  });

  export default Profile;