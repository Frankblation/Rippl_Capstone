"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, TextInput, ScrollView } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { useAuth } from "~/components/providers/AuthProvider"
import { useUser } from "~/hooks/useUser"
import { searchUsers, getAllInterests, getSuggestedUsersByInterest, getEventsNearby } from "~/utils/data"
import { router } from "expo-router"
import Feather from "@expo/vector-icons/Feather"
import { useColorScheme } from "~/hooks/useColorScheme"

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

// User Card Component
const UserCard = ({ id, name, username, avatar, onPress }) => {
  return (
    <TouchableOpacity style={styles.userCard} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <View style={styles.userContent}>
        <Text style={styles.name}>{name}</Text>
        {username && <Text style={styles.username}>@{username}</Text>}
      </View>
      <Feather name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  )
}

// Interest Card Component
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

// Event Card Component
const EventCard = ({ id, title, date, location, image, onPress }) => {
  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.7}>
      {image ? (
        <Image source={{ uri: image }} style={styles.eventImage} />
      ) : (
        <View style={styles.eventImagePlaceholder}>
          <Feather name="calendar" size={24} color="#999" />
        </View>
      )}
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.eventDate}>{date}</Text>
        <Text style={styles.eventLocation} numberOfLines={1}>
          {location}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [userResults, setUserResults] = useState([])
  const [interestResults, setInterestResults] = useState([])
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [trendingEvents, setTrendingEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)

  // Get authenticated user ID from auth hook
  const { user: authUser } = useAuth()
  const { user } = useUser(authUser?.id || null)

  // Load data when component mounts
  useEffect(() => {
    loadInitialData()
  }, [user?.id])

  // Load all initial data
  const loadInitialData = async () => {
    setLoading(true)
    try {
      // Load data in parallel
      await Promise.all([loadSuggestedUsers(), loadTrendingEvents()])
    } catch (error) {
      console.error("Error loading initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load suggested users based on user interests
  const loadSuggestedUsers = async () => {
    try {
      let users = []

      // If we have a function to get suggested users by interest and the user is logged in
      if (typeof getSuggestedUsersByInterest === "function" && user?.id) {
        users = await getSuggestedUsersByInterest(user.id)
      } else {
        // Fallback to regular user search
        users = await searchUsers("")
        users = users.slice(0, 5) // Limit to 5 users
      }

      // Format the user data
      const formattedUsers = users.map((user) => ({
        id: user.id,
        name: user.name || user.full_name || "User",
        username: user.username || "",
        avatar: user.image || user.avatar_url || "https://randomuser.me/api/portraits/women/68.jpg",
      }))

      setSuggestedUsers(formattedUsers)
    } catch (error) {
      console.error("Error loading suggested users:", error)
      setSuggestedUsers([])
    }
  }

  // Load trending events based on location
  const loadTrendingEvents = async () => {
    try {
      let events = []

      // If we have a function to get events nearby
      if (typeof getEventsNearby === "function") {
        events = await getEventsNearby()
      } else {
        // Fallback to empty array if the function doesn't exist
        events = []
      }

      // Format the event data
      const formattedEvents = events.map((event) => ({
        id: event.id,
        title: event.title || event.name || "Event",
        date: event.date || event.event_date || "Upcoming",
        location: event.location || "Location not specified",
        image: event.image || event.image_url || null,
      }))

      setTrendingEvents(formattedEvents)
    } catch (error) {
      console.error("Error loading trending events:", error)
      setTrendingEvents([])
    }
  }

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

        // Search for interests
        const interests = await getAllInterests()
        const filteredInterests = interests
          .filter((interest) => interest.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 10)

        // Format the results
        const formattedUsers = users.map((user) => ({
          id: user.id,
          name: user.name || user.full_name || "User",
          username: user.username || "",
          avatar: user.image || user.avatar_url || "https://randomuser.me/api/portraits/women/68.jpg",
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
    [],
  )

  // Handle search input
  const handleSearch = useCallback(
    (text) => {
      setSearchQuery(text)
      if (text.trim() === "") {
        setUserResults([])
        setInterestResults([])
      } else {
        performSearch(text)
      }
    },
    [performSearch],
  )

  // Handle user press
  const handleUserPress = useCallback((userId) => {
    router.push(`/(tabs)/profile/${userId}`)
  }, [])

  // Handle interest press
  const handleInterestPress = useCallback((interestId, interestName) => {
    router.push({
      pathname: `/(tabs)/interest/${interestId}`,
      params: { name: interestName },
    })
  }, [])

  // Handle event press
  const handleEventPress = useCallback((eventId) => {
    // Navigate to event details page if available
    if (typeof eventId === "string") {
      router.push(`/(tabs)/event/${eventId}`)
    }
  }, [])

  // Render search results
  const renderSearchResults = () => {
    if (searchLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00AF9F" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )
    }

    if (searchQuery.trim() === "") {
      return null
    }

    if (userResults.length === 0 && interestResults.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>Try different keywords or check your spelling</Text>
        </View>
      )
    }

    return (
      <View style={styles.searchResultsContainer}>
        {interestResults.length > 0 && (
          <>
            <Text style={styles.sectionHeaderText}>Interests</Text>
            {interestResults.map((interest) => (
              <InterestCard
                key={`interest-${interest.id}`}
                id={interest.id}
                name={interest.name}
                icon={interest.icon}
                onPress={() => handleInterestPress(interest.id, interest.name)}
              />
            ))}
          </>
        )}

        {userResults.length > 0 && (
          <>
            <Text style={styles.sectionHeaderText}>Users</Text>
            {userResults.map((user) => (
              <UserCard
                key={`user-${user.id}`}
                id={user.id}
                name={user.name}
                username={user.username}
                avatar={user.avatar}
                onPress={() => handleUserPress(user.id)}
              />
            ))}
          </>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header with title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={18} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users and interests"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")} style={styles.clearButton}>
              <Feather name="x" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00AF9F" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingBottom: 20 + insets.bottom,
          }}
        >
          {/* Search Results */}
          {renderSearchResults()}

          {/* Default Content (when no search is active) */}
          {searchQuery.trim() === "" && (
            <>
              {/* Trending Events */}
              {trendingEvents.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Events Near You</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsContainer}>
                    {trendingEvents.map((event) => (
                      <EventCard
                        key={`event-${event.id}`}
                        id={event.id}
                        title={event.title}
                        date={event.date}
                        location={event.location}
                        image={event.image}
                        onPress={() => handleEventPress(event.id)}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Suggested Users */}
              {suggestedUsers.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>People You Might Like</Text>
                  {suggestedUsers.map((user) => (
                    <UserCard
                      key={`suggested-${user.id}`}
                      id={user.id}
                      name={user.name}
                      username={user.username}
                      avatar={user.avatar}
                      onPress={() => handleUserPress(user.id)}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
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
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: "#f2f2f2",
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
  clearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "geistBold",
    color: "#333",
    marginBottom: 12,
  },
  eventsContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  eventCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  eventImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  eventImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  eventContent: {
    padding: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: "geistBold",
    color: "#333",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: "#00AF9F",
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: "#666",
  },
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
    marginTop: 40,
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
  searchResultsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontFamily: "geistBold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
})
