"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { getUserById, getInterestById } from "~/utils/data"
import { useAuth } from "~/components/providers/AuthProvider"
import { useUser } from "~/hooks/useUser"
import { Feather } from "@expo/vector-icons"
import { supabase } from "~/utils/supabase"

export default function PostDetailScreen() {
  const { id, userId, interestId } = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState(null)
  const [postUser, setPostUser] = useState(null)
  const [interest, setInterest] = useState(null)
  const [isLiked, setIsLiked] = useState(false)

  // Get authenticated user
  const { user: authUser } = useAuth()
  const { user } = useUser(authUser?.id || null)

  // Fetch post details
  useEffect(() => {
    const loadData = async () => {
      if (!id) return

      setLoading(true)
      try {
        // Fetch post details
        const { data: postData, error: postError } = await supabase.from("posts").select("*").eq("id", id).single()

        if (postError) throw postError
        setPost(postData)

        // Fetch post creator details
        if (postData.user_id) {
          const userData = await getUserById(postData.user_id)
          setPostUser(userData)
        }

        // Fetch interest details
        if (postData.interest_id) {
          const interestData = await getInterestById(postData.interest_id)
          setInterest(interestData)
        }

        // Check if post is liked by current user
        if (user?.id) {
          const { data: likeData, error: likeError } = await supabase
            .from("user_post_engagement")
            .select("has_liked")
            .eq("user_id", user.id)
            .eq("post_id", id)
            .maybeSingle()

          if (!likeError && likeData) {
            setIsLiked(likeData.has_liked)
          }
        }
      } catch (error) {
        console.error("Error loading post data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, user?.id])

  // Handle like/unlike
  const toggleLike = async () => {
    if (!user?.id || !post) return

    try {
      const newLikeStatus = !isLiked
      setIsLiked(newLikeStatus)

      // Check if engagement record exists
      const { data: existingEngagement, error: checkError } = await supabase
        .from("user_post_engagement")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", post.id)
        .maybeSingle()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      if (existingEngagement) {
        // Update existing record
        await supabase.from("user_post_engagement").update({ has_liked: newLikeStatus }).eq("id", existingEngagement.id)
      } else {
        // Create new record
        await supabase.from("user_post_engagement").insert({
          user_id: user.id,
          post_id: post.id,
          has_liked: newLikeStatus,
          has_reposted: false,
          comment_count: 0,
        })
      }

      // Update post popularity
      await supabase
        .from("post_popularity")
        .update({
          likes: supabase.rpc(newLikeStatus ? "increment" : "decrement", { row_id: post.id }),
        })
        .eq("post_id", post.id)
    } catch (error) {
      console.error("Error toggling like:", error)
      // Revert UI state if operation failed
      setIsLiked(!isLiked)
    }
  }

  // Handle interest press
  const handleInterestPress = () => {
    if (!interest) return

    router.push({
      pathname: `/(tabs)/interest/${interest.id}`,
      params: { name: interest.name },
    })
  }

  // Handle user press
  const handleUserPress = () => {
    if (!postUser) return

    router.push(`/(tabs)/profile/${postUser.id}`)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00AF9F" />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Post not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Post Image */}
        {post.image_url && <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />}

        {/* Post Content */}
        <View style={styles.postContent}>
          {/* Title and Actions */}
          <View style={styles.titleContainer}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
                <Feather
                  name={isLiked ? "heart" : "heart"}
                  size={24}
                  color={isLiked ? "#FF3B30" : "#999"}
                  style={{ opacity: isLiked ? 1 : 0.7 }}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Feather name="message-circle" size={24} color="#999" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Feather name="share" size={24} color="#999" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Post Text */}
          <Text style={styles.postText}>{post.content}</Text>

          {/* User and Interest */}
          <View style={styles.metaContainer}>
            {postUser && (
              <TouchableOpacity style={styles.userContainer} onPress={handleUserPress}>
                <Image
                  source={{ uri: postUser.image || "https://randomuser.me/api/portraits/women/68.jpg" }}
                  style={styles.userAvatar}
                />
                <Text style={styles.userName}>{postUser.name}</Text>
              </TouchableOpacity>
            )}

            {interest && (
              <TouchableOpacity style={styles.interestTag} onPress={handleInterestPress}>
                <Text style={styles.interestText}>{interest.name}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Location if available */}
          {post.location && (
            <View style={styles.locationContainer}>
              <Feather name="map-pin" size={16} color="#666" />
              <Text style={styles.locationText}>{post.location}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "geistBold",
    color: "#333",
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: "#00AF9F",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: "geistBold",
    marginBottom: 16,
  },
  postImage: {
    width: "100%",
    height: 300,
  },
  postContent: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 20,
    fontFamily: "geistBold",
    color: "#333",
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 16,
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontFamily: "geistMedium",
    color: "#333",
  },
  interestTag: {
    backgroundColor: "#00AF9F",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "geistMedium",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
})
