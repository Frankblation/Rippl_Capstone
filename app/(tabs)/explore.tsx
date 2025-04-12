"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
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
import FadeInView from "~/components/FadeInView"
import ScaleInView from "~/components/ScaleInView"
import { Colors } from "~/constants/Colors"
import { useColorScheme } from "~/hooks/useColorScheme"

// Get screen width to calculate grid dimensions
const { width } = Dimensions.get("window")
const MARGIN = 2
const DOUBLE_MARGIN = MARGIN * 2

// Calculate sizes for different post types
const SMALL_SIZE = (width - DOUBLE_MARGIN * 3) / 3
const MEDIUM_SIZE = (width - DOUBLE_MARGIN * 2) / 2
const LARGE_SIZE = width - DOUBLE_MARGIN

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

// Dynamic Post Grid Item Component
const PostGridItem = ({ post, size, onPress }) => {
  // Determine content type and style based on post properties
  const hasImage = post.image_url && post.image_url.trim() !== ""
  const hasVideo = post.has_video
  const hasText = post.content && post.content.trim() !== ""
  const hasTitle = post.title && post.title.trim() !== ""
  const [imageError, setImageError] = useState(false)

  // Determine background color based on post type
  const getBackgroundColor = () => {
    if (post.interest_id) {
      // Use different colors based on interest_id
      const interestColors = [
        "#00AF9F", // teal
        "#FF6B6B", // coral
        "#4E6EF2", // blue
        "#FFB347", // orange
        "#9775FA", // purple
        "#54BAB9", // seafoam
      ]
      // Use the interest_id to pick a color (modulo to stay within array bounds)
      const colorIndex = Number.parseInt(post.interest_id?.replace(/\D/g, "") || "0") % interestColors.length
      return interestColors[colorIndex] || "#00AF9F"
    }
    return "#00AF9F" // default teal
  }

  // Handle image loading error
  const handleImageError = () => {
    setImageError(true)
  }

  // Determine if we should show text content
  const shouldShowTextContent = !hasImage || imageError

  return (
    <TouchableOpacity
      style={[
        styles.gridItem,
        {
          width: size.width,
          height: size.height,
          margin: MARGIN,
        },
      ]}
      onPress={() => onPress(post)}
      activeOpacity={0.9}
    >
      {hasImage && !imageError ? (
        // Image post with error handling
        <Image source={{ uri: post.image_url }} style={styles.gridItemImage} onError={handleImageError} />
      ) : (
        // Text-only post or image failed to load
        <View
          style={[
            styles.textPostContainer,
            {
              backgroundColor: getBackgroundColor(),
            },
          ]}
        >
          {hasTitle && (
            <Text style={styles.postTitle} numberOfLines={2}>
              {post.title}
            </Text>
          )}
          {hasText && (
            <Text style={styles.postText} numberOfLines={4}>
              {post.content}
            </Text>
          )}
          {!hasTitle && !hasText && (
            <View style={styles.placeholderContainer}>
              <Feather name="file-text" size={24} color="#fff" />
            </View>
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

// Masonry Layout Component
const MasonryLayout = ({ posts, onPostPress }) => {
  // Assign sizes to posts based on various factors
  const getPostSize = (post, index) => {
    // Determine size based on post properties and position
    const hasImage = post.image_url && post.image_url.trim() !== ""
    const hasVideo = post.has_video
    const contentLength = (post.content || "").length

    // Create patterns for different sizes
    if (index % 12 === 0 || index % 12 === 7) {
      // Large posts (full width)
      return { width: LARGE_SIZE, height: MEDIUM_SIZE * 1.5 }
    } else if (index % 12 === 1 || index % 12 === 2 || index % 12 === 8 || index % 12 === 9) {
      // Medium posts (half width)
      return { width: MEDIUM_SIZE, height: MEDIUM_SIZE }
    } else if (hasVideo) {
      // Video posts (medium size)
      return { width: MEDIUM_SIZE, height: MEDIUM_SIZE }
    } else if (contentLength > 200 && !hasImage) {
      // Long text posts (medium size)
      return { width: MEDIUM_SIZE, height: MEDIUM_SIZE * 1.2 }
    } else {
      // Small posts (third width)
      return { width: SMALL_SIZE, height: SMALL_SIZE }
    }
  }

  // Memoize the rows to prevent unnecessary re-renders
  const rows = useMemo(() => {
    let currentRow = []
    let currentRowWidth = 0
    const rowsArray = []

    posts.forEach((post, index) => {
      const size = getPostSize(post, index)

      // If adding this post would exceed screen width, start a new row
      if (currentRowWidth + size.width > width && currentRow.length > 0) {
        rowsArray.push(
          <View key={`row-${rowsArray.length}`} style={styles.masonryRow}>
            {currentRow}
          </View>,
        )
        currentRow = []
        currentRowWidth = 0
      }

      // Add post to current row
      currentRow.push(<PostGridItem key={post.id} post={post} size={size} onPress={onPostPress} />)
      currentRowWidth += size.width + DOUBLE_MARGIN
    })

    // Add the last row if it has items
    if (currentRow.length > 0) {
      rowsArray.push(
        <View key={`row-${rowsArray.length}`} style={styles.masonryRow}>
          {currentRow}
        </View>,
      )
    }

    return rowsArray
  }, [posts]) // Only recalculate when posts change

  return (
    <ScrollView contentContainerStyle={styles.masonryContainer} showsVerticalScrollIndicator={false}>
      {rows}
    </ScrollView>
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
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)

  // Get authenticated user ID from auth hook
  const { user: authUser } = useAuth()
  const { user } = useUser(authUser?.id || null)

  // Load all posts and interests when component mounts
  useEffect(() => {
    if (!hasInitiallyLoaded) {
      loadAllPosts()
      loadAllInterests()
      setHasInitiallyLoaded(true)
    }
  }, [hasInitiallyLoaded])

  // Load all interests for search functionality
  const loadAllInterests = async () => {
    try {
      const interests = await getAllInterests()
      setAllInterests(interests)
    } catch (error) {
      console.error("Error loading interests:", error)
    }
  }

  // Load all posts instead of just recommended ones
  const loadAllPosts = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true)
    } else if (!refreshing) {
      setLoading(true)
    }

    try {
      // Use getAllPosts instead of getRecommendedPostsForUser to show posts from everyone
      const posts = await getAllPosts(50) // Increased limit for better masonry layout
      setAllPosts(posts)
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
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
        // Search for users using the existing searchUsers function
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

  const handlePostPress = useCallback((post) => {
    // Navigate to post detail
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

  // Render search results
  const renderSearchResults = useCallback(() => {
    if (searchLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00AF9F" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )
    }

    if (userResults.length === 0 && interestResults.length === 0 && searchQuery.trim() !== "") {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>Try different keywords or check your spelling</Text>
        </View>
      )
    }

    if (searchQuery.trim() === "") {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Search for users and interests</Text>
          <Text style={styles.emptySubtext}>Enter keywords to find people and topics</Text>
        </View>
      )
    }

    return (
      <ScrollView
        style={styles.searchResultsContainer}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 16 + insets.bottom,
        }}
      >
        {userResults.length > 0 && (
          <View>
            <Text style={styles.sectionHeaderText}>Users</Text>
            {userResults.map((user, index) => (
              <FadeInView key={`user-${user.id}`} delay={index * 50} duration={300}>
                <ScaleInView delay={index * 50} duration={300}>
                  <UserCard
                    id={user.id}
                    name={user.name}
                    username={user.username}
                    avatar={user.avatar}
                    onPress={() => handleUserPress(user.id)}
                  />
                </ScaleInView>
              </FadeInView>
            ))}
          </View>
        )}

        {interestResults.length > 0 && (
          <View style={{ marginTop: userResults.length > 0 ? 20 : 0 }}>
            <Text style={styles.sectionHeaderText}>Interests</Text>
            {interestResults.map((interest, index) => (
              <FadeInView key={`interest-${interest.id}`} delay={index * 50} duration={300}>
                <ScaleInView delay={index * 50} duration={300}>
                  <InterestCard
                    id={interest.id}
                    name={interest.name}
                    icon={interest.icon}
                    onPress={() => handleInterestPress(interest.id, interest.name)}
                  />
                </ScaleInView>
              </FadeInView>
            ))}
          </View>
        )}
      </ScrollView>
    )
  }, [searchLoading, userResults, interestResults, searchQuery, insets.bottom, handleUserPress, handleInterestPress])

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
          renderSearchResults()
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00AF9F" />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : (
          <View style={{ flex: 1, marginBottom: 60 + insets.bottom }}>
            <MasonryLayout posts={allPosts} onPostPress={handlePostPress} />
            {allPosts.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No posts available</Text>
                <Text style={styles.emptySubtext}>Check back later for new content</Text>
              </View>
            )}
          </View>
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
  searchResultsContainer: {
    flex: 1,
  },
  // Masonry Layout Styles
  masonryContainer: {
    paddingHorizontal: MARGIN,
  },
  masonryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
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
  // Grid Styles
  gridItem: {
    overflow: "hidden",
    borderRadius: 8,
  },
  gridItemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  textPostContainer: {
    width: "100%",
    height: "100%",
    padding: 12,
    justifyContent: "center",
  },
  postTitle: {
    fontSize: 16,
    fontFamily: "geistBold",
    color: "#fff",
    marginBottom: 4,
  },
  postText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
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
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  placeholderContainer: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
})
