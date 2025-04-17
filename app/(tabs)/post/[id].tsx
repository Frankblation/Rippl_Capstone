"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  Platform,
} from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { useAuth } from "~/components/providers/AuthProvider"
import { useUser } from "~/hooks/useUser"
import { getAllPosts, searchUsers, getAllInterests } from "~/utils/data"
import { router } from "expo-router"
import Feather from "@expo/vector-icons/Feather"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import * as Haptics from "expo-haptics"
import { Colors } from "~/constants/Colors"
import { useColorScheme } from "~/hooks/useColorScheme"

// Get screen dimensions
const { width } = Dimensions.get("window")
const SPACING = 2
const NUM_COLUMNS = 3
const ITEM_WIDTH = (width - SPACING * (NUM_COLUMNS + 1)) / NUM_COLUMNS

// Debounce function to prevent excessive API calls
const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

// Custom Search Bar Component
const SearchBar = ({ placeholder, onSearch, onFocus, onCancel, value }) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = () => {
    setIsFocused(true)
    if (onFocus) onFocus()
  }

  const handleCancel = () => {
    setIsFocused(false)
    if (onCancel) onCancel()
  }

  return (
    <View style={styles.searchBarContainer}>
      <View style={[styles.searchInputContainer, isFocused && styles.searchInputFocused]}>
        <Feather name="search" size={18} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onSearch}
          onFocus={handleFocus}
          returnKeyType="search"
        />
      </View>
      {isFocused && (
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// User Card Component for search results
const UserCard = ({ id, name, username, avatar, onPress }) => {
  return (
    <TouchableOpacity style={styles.userCard} onPress={onPress} activeOpacity={0.7}>
      <Image source={avatar} style={styles.avatar} />
      <View style={styles.userContent}>
        <Text style={styles.name}>{name}</Text>
        {username && <Text style={styles.username}>@{username}</Text>}
      </View>
      <Feather name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  )
}

// Interest Card Component for search results
const InterestCard = ({ id, name, icon, onPress }) => {
  return (
    <TouchableOpacity style={styles.interestCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.interestIconContainer, { backgroundColor: "#00AF9F" }]}>
        <Text style={styles.interestIcon}>{icon || name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.interestContent}>
        <Text style={styles.interestName}>{name}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  )
}

// Post Grid Item Component
const PostGridItem = ({ post, onPress }) => {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const hasVideo = post.has_video

  // Handle image loading start
  const handleImageLoadStart = () => {
    setImageLoading(true)
  }

  // Handle image loading success
  const handleImageLoad = () => {
    setImageLoading(false)
  }

  // Handle image loading error
  const handleImageError = () => {
    console.log("Image failed to load:", post.image_url)
    setImageLoading(false)
    setImageError(true)
  }

  // Debug log for image URL
  useEffect(() => {
    if (post.image_url) {
      console.log(`Post ${post.id} has image URL: ${post.image_url}`)
    } else {
      console.log(`Post ${post.id} has no image URL`)
    }
  }, [post.id, post.image_url])

  return (
    <TouchableOpacity style={styles.gridItem} onPress={() => onPress(post)} activeOpacity={0.9}>
      {/* Always try to load the image if there's an image_url */}
      {post.image_url && post.image_url.trim() !== "" ? (
        <>
          <Image
            source={{ uri: post.image_url }}
            style={styles.gridItemImage}
            onLoadStart={handleImageLoadStart}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Loading indicator */}
          {imageLoading && (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </>
      ) : (
        // Fallback for posts without image_url - show post content
        <View style={styles.noImageContainer}>
          {post.title ? (
            <Text style={styles.noImageTitle} numberOfLines={3}>
              {post.title}
            </Text>
          ) : post.content ? (
            <Text style={styles.noImageText} numberOfLines={4}>
              {post.content}
            </Text>
          ) : (
            <Text style={styles.noImageText}>Post</Text>
          )}
        </View>
      )}

      {/* Video indicator if post has video */}
      {hasVideo && (
        <View style={styles.videoIndicator}>
          <Feather name="play" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  )
}

// Search Results Component
const SearchResults = ({ loading, query, userResults, interestResults, onUserPress, onInterestPress, insets }) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00AF9F" />
        <Text style={styles.loadingText}>Searching...</Text>
      </View>
    )
  }

  if (userResults.length === 0 && interestResults.length === 0 && query.trim() !== "") {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No results found</Text>
        <Text style={styles.emptySubtext}>Try different keywords or check your spelling</Text>
      </View>
    )
  }

  if (query.trim() === "") {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Search for users and interests</Text>
        <Text style={styles.emptySubtext}>Enter keywords to find people and topics</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={[
        ...(userResults.length > 0 ? [{ type: "header", id: "users-header", title: "Users" }] : []),
        ...userResults.map((user) => ({ type: "user", ...user })),
        ...(interestResults.length > 0 ? [{ type: "header", id: "interests-header", title: "Interests" }] : []),
        ...interestResults.map((interest) => ({ type: "interest", ...interest })),
      ]}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 16 + insets.bottom,
      }}
      renderItem={({ item }) => {
        if (item.type === "header") {
          return <Text style={styles.sectionHeaderText}>{item.title}</Text>
        } else if (item.type === "user") {
          return (
            <UserCard
              id={item.id}
              name={item.name}
              username={item.username}
              avatar={item.avatar}
              onPress={() => onUserPress(item.id)}
            />
          )
        } else if (item.type === "interest") {
          return (
            <InterestCard
              id={item.id}
              name={item.name}
              icon={item.icon}
              onPress={() => onInterestPress(item.id, item.name)}
            />
          )
        }
        return null
      }}
    />
  )
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userResults, setUserResults] = useState([])
  const [interestResults, setInterestResults] = useState([])
  const [allPosts, setAllPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [allInterests, setAllInterests] = useState([])

  // Get authenticated user ID from auth hook
  const { user: authUser } = useAuth()
  const { user } = useUser(authUser?.id || null)

  // Load all posts and interests when component mounts
  useEffect(() => {
    loadAllPosts()
    loadAllInterests()
  }, [])

  // Load all interests for search functionality
  const loadAllInterests = async () => {
    try {
      const interests = await getAllInterests()
      setAllInterests(interests)
    } catch (error) {
      console.error("Error loading interests:", error)
    }
  }

  // Load all posts
  const loadAllPosts = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true)
    } else if (!refreshing) {
      setLoading(true)
    }

    try {
      const posts = await getAllPosts()

      // Log the first few posts to debug image URLs
      if (posts.length > 0) {
        console.log("First few posts:")
        posts.slice(0, 3).forEach((post, index) => {
          console.log(`Post ${index + 1}:`, {
            id: post.id,
            title: post.title,
            image_url: post.image_url,
          })
        })
      }

      setAllPosts(posts)
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadAllPosts(true)
  }, [])

  // Perform search with debounce
  const performSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setUserResults([])
        setInterestResults([])
        setSearchLoading(false)
        return
      }

      setSearchLoading(true)

      try {
        // Search for users
        const users = await searchUsers(query)

        // Filter interests based on the query
        const filteredInterests = allInterests
          .filter((interest) => interest.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 10)

        // Format the results
        const formattedUsers = users.map((user) => ({
          id: user.id,
          name: user.name || "User",
          username: user.username || "",
          avatar: { uri: user.image || "https://randomuser.me/api/portraits/women/68.jpg" },
        }))

        const formattedInterests = filteredInterests.map((interest) => ({
          id: interest.id,
          name: interest.name,
          icon: interest.icon,
        }))

        setUserResults(formattedUsers)
        setInterestResults(formattedInterests)
      } catch (error) {
        console.error("Error searching:", error)
        setUserResults([])
        setInterestResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300),
    [allInterests],
  )

  // Handle search input
  const handleSearch = useCallback(
    (text) => {
      setSearchQuery(text)
      if (text.trim() === "") {
        setIsSearching(false)
        setUserResults([])
        setInterestResults([])
      } else {
        setIsSearching(true)
        performSearch(text)
      }
    },
    [performSearch],
  )

  // Handle search focus
  const handleSearchFocus = useCallback(() => {
    setIsSearching(true)
  }, [])

  // Handle search cancel
  const handleSearchCancel = useCallback(() => {
    setSearchQuery("")
    setIsSearching(false)
    setUserResults([])
    setInterestResults([])
  }, [])

  // Handle user press in search results
  const handleUserPress = useCallback((userId) => {
    router.push(`/(tabs)/profile/${userId}`)
  }, [])

  // Handle interest press in search results
  const handleInterestPress = useCallback((interestId, interestName) => {
    router.push({
      pathname: `/(tabs)/interest/${interestId}`,
      params: { name: interestName },
    })
  }, [])

  // Handle post press
  const handlePostPress = useCallback((post) => {
    router.push({
      pathname: `/(tabs)/post/${post.id}`,
      params: {
        userId: post.user_id,
        interestId: post.interest_id,
      },
    })
  }, [])

  // Navigation functions with haptic feedback
  const navigateToHome = useCallback(() => {
    Haptics.selectionAsync()
    router.push("/(tabs)/home")
  }, [])

  const navigateToAddPost = useCallback(() => {
    Haptics.selectionAsync()
    router.push("/(tabs)/add-post")
  }, [])

  const navigateToMatching = useCallback(() => {
    Haptics.selectionAsync()
    router.push("/(tabs)/matching")
  }, [])

  const navigateToProfile = useCallback(() => {
    Haptics.selectionAsync()
    if (user?.id) {
      router.push(`/(tabs)/profile/${user.id}`)
    }
  }, [user?.id])

  // Render post item for the grid
  const renderPostItem = useCallback(
    ({ item }) => {
      return <PostGridItem post={item} onPress={handlePostPress} />
    },
    [handlePostPress],
  )

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        {/* Header with title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
        </View>

        {/* Custom Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="Search users and interests"
            onSearch={handleSearch}
            onFocus={handleSearchFocus}
            onCancel={handleSearchCancel}
            value={searchQuery}
          />
        </View>

        {/* Search Results or Explore Grid */}
        {isSearching ? (
          <SearchResults
            loading={searchLoading}
            query={searchQuery}
            userResults={userResults}
            interestResults={interestResults}
            onUserPress={handleUserPress}
            onInterestPress={handleInterestPress}
            insets={insets}
          />
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00AF9F" />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : (
          <FlatList
            data={allPosts}
            renderItem={renderPostItem}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={{
              paddingBottom: 60 + insets.bottom,
            }}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No posts available</Text>
                <Text style={styles.emptySubtext}>Check back later for new content</Text>
              </View>
            }
          />
        )}

        {/* Custom Tab Bar */}
        <View style={[styles.customTabBar, { paddingBottom: insets.bottom || 16 }]}>
          <TouchableOpacity style={styles.tabButton} onPress={navigateToHome}>
            <Feather name="home" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} activeOpacity={1}>
            <Feather name="search" size={24} color={Colors[colorScheme ?? "light"].tint} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} onPress={navigateToAddPost}>
            <Feather name="plus" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} onPress={navigateToMatching}>
            <MaterialCommunityIcons name="cards-outline" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} onPress={navigateToProfile}>
            <Feather name="user" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "geistBold",
    color: "#333",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // Grid Styles
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    margin: SPACING,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  gridItemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f0f0f0",
  },
  noImageTitle: {
    color: "#333",
    fontSize: 14,
    fontFamily: "geistMedium",
    textAlign: "center",
  },
  noImageText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
  },
  videoIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  // Custom Search Bar Styles
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInputFocused: {
    borderColor: "#00AF9F",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#333",
    padding: 0,
  },
  cancelButton: {
    marginLeft: 10,
    paddingVertical: 8,
  },
  cancelText: {
    color: "#00AF9F",
    fontSize: 16,
    fontFamily: "geistMedium",
  },
  // User Card Styles
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: "geistBold",
    color: "#333",
  },
  username: {
    fontSize: 14,
    color: "#666",
  },
  // Interest Card Styles
  interestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  interestIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#00AF9F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  interestIcon: {
    fontSize: 24,
    color: "#fff",
  },
  interestContent: {
    flex: 1,
  },
  interestName: {
    fontSize: 16,
    fontFamily: "geistBold",
    color: "#333",
  },
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 200,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "geistBold",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  sectionHeaderText: {
    fontSize: 18,
    fontFamily: "geistBold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  // Custom Tab Bar
  customTabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
    position: Platform.OS === "ios" ? "absolute" : "relative",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    padding: 8,
  },
})
