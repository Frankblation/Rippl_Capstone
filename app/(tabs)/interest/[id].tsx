"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { getPostsByInterestId, getInterestById } from "~/utils/data"
import { useAuth } from "~/components/providers/AuthProvider"
import { useUser } from "~/hooks/useUser"
import PostCard from "~/components/PostCard" // Assuming you have this component
import FadeInView from "~/components/FadeInView"
import ScaleInView from "~/components/ScaleInView"
import { formatPostsForUI } from "~/utils/formatPosts" // Assuming you have this utility
import { supabase } from "~/utils/supabase"

export default function InterestScreen() {
  const { id, name } = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [interest, setInterest] = useState(null)
  const [likedPosts, setLikedPosts] = useState(new Set())
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const router = useRouter()

  // Get authenticated user
  const { user: authUser } = useAuth()
  const { user } = useUser(authUser?.id || null)

  // Fetch interest details and initial posts
  useEffect(() => {
    const loadData = async () => {
      if (!id) return

      setLoading(true)
      try {
        // Fetch interest details
        const interestData = await getInterestById(id as string)
        setInterest(interestData)

        // Fetch posts for this interest
        const postsData = await getPostsByInterestId(id as string, {
          limit: 10,
          page: 1,
        })

        // Format posts for UI
        const formattedPosts = await formatPostsForUI(postsData)
        setPosts(formattedPosts)

        // Check if there are more posts to load
        setHasMore(postsData.length === 10)
      } catch (error) {
        console.error("Error loading interest data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  // Load liked posts when user data is available
  useEffect(() => {
    const loadLikedPosts = async () => {
      if (!user?.id) return

      try {
        // Get all posts that the user has liked from user_post_engagement
        const { data, error } = await supabase
          .from("user_post_engagement")
          .select("post_id")
          .eq("user_id", user.id)
          .eq("has_liked", true)

        if (error) throw error

        // Create a Set of post IDs that the user has liked
        const likedPostIds = new Set(data.map((item) => item.post_id))
        setLikedPosts(likedPostIds)
      } catch (error) {
        console.error("Error loading liked posts:", error)
      }
    }

    if (user?.id) {
      loadLikedPosts()
    }
  }, [user?.id])

  // Load more posts when reaching the end of the list
  const loadMorePosts = async () => {
    if (!hasMore || loadingMore || !id) return

    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const morePosts = await getPostsByInterestId(id as string, {
        limit: 10,
        page: nextPage,
      })

      if (morePosts.length > 0) {
        const formattedMorePosts = await formatPostsForUI(morePosts)
        setPosts((prevPosts) => [...prevPosts, ...formattedMorePosts])
        setPage(nextPage)
        setHasMore(morePosts.length === 10)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error loading more posts:", error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Handle like status changes
  const handleLikeStatusChange = (postId, isLiked) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev)
      if (isLiked) {
        newSet.add(postId)
      } else {
        newSet.delete(postId)
      }
      return newSet
    })
  }

  // Render a post item
  const renderPostItem = ({ item, index }) => {
    const delay = index * 50 // Staggered animation

    return (
      <FadeInView delay={delay} duration={300}>
        <ScaleInView delay={delay} duration={300}>
          <PostCard
            {...item}
            userId={user?.id || ""}
            postUserId={item.postUserId}
            isLiked={likedPosts.has(item.id)}
            onLikeStatusChange={handleLikeStatusChange}
            onProfilePress={() => router.push(`/(tabs)/profile/${item.postUserId}`)}
            onCommentPress={() => {
              // Handle comment press if needed
            }}
          />
        </ScaleInView>
      </FadeInView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00AF9F" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{name || interest?.name || "Interest"}</Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 16 + insets.bottom,
        }}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts found</Text>
            <Text style={styles.emptySubtext}>Be the first to post about this interest!</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#00AF9F" />
              <Text style={styles.loadingMoreText}>Loading more posts...</Text>
            </View>
          ) : null
        }
      />
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
    fontSize: 24,
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
  loadingMoreContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
})
