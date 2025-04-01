import readline from 'readline'; // Import readline for command-line input
import { supabase } from "./supabase";
import { createUser, createPost } from "./data";
import { PostType } from "./db";

/**
 * Fetches interests and categories from Supabase
 */
const fetchInterests = async () => {
  const { data: interests, error } = await supabase.from("interests").select("id, name, category_id");
  if (error) {
    console.error("Error fetching interests:", error);
    return [];
  }
  return interests;
};


/**
 * Assigns random interests to a user.
 */
const assignInterestsToUser = async (userId: string, interests: any[]) => {
  const userInterests = interests.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);

  // Ensure that the interest ids exist before inserting into user_interests
  const validInterests = userInterests.filter(interest => interests.some(i => i.id === interest.id));

  await Promise.all(validInterests.map(async (interest: { id: any; }) => {
    await supabase.from("user_interests").insert({ user_id: userId, interest_id: interest.id });
  }));

  return validInterests;
};

/**
 * Creates a comment on a post.
 */
const createComment = async ({ post_id, user_id, content }: { post_id: string; user_id: string; content: string }) => {
  // Insert the comment
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id, user_id, content })
    .select()
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    return null;
  }

  // Fetch the post popularity row
  const { data: post, error: fetchError } = await supabase
    .from('post_popularity')
    .select('comments, total_engagement')
    .eq('post_id', post_id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      // If no row exists, create one with default values
      const { error: insertError } = await supabase
        .from('post_popularity')
        .insert({ post_id, comments: 1, reposts: 0, total_engagement: 1 });

      if (insertError) {
        console.error('Error creating post popularity entry:', insertError);
      }
      return data;
    } else {
      console.error('Error fetching post comments:', fetchError);
      return data;
    }
  }

  // Update the comments count and total engagement
  const { error: updateError } = await supabase
    .from('post_popularity')
    .update({
      comments: (post.comments || 0) + 1,
      total_engagement: (post.total_engagement || 0) + 1,
    })
    .eq('post_id', post_id);

  if (updateError) {
    console.error('Error updating post comments:', updateError);
  }

  return data;
};

/**
 * Creates a like on a post.
 */
const createLike = async ({ post_id, user_id }: { post_id: string; user_id: string }) => {
  // Fetch the post popularity row
  const { data: post, error: fetchError } = await supabase
    .from('post_popularity')
    .select('likes, total_engagement')
    .eq('post_id', post_id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      // If no row exists, create one with default values
      const { error: insertError } = await supabase
        .from('post_popularity')
        .insert({ post_id, likes: 1, reposts: 0, total_engagement: 1 });

      if (insertError) {
        console.error('Error creating post popularity entry:', insertError);
      }
      return;
    } else {
      console.error('Error fetching post likes:', fetchError);
      return;
    }
  }

  // Update the likes count and total engagement
  const { error: updateError } = await supabase
    .from('post_popularity')
    .update({
      likes: (post.likes || 0) + 1,
      total_engagement: (post.total_engagement || 0) + 1,
    })
    .eq('post_id', post_id);

  if (updateError) {
    console.error('Error updating post likes:', updateError);
  }
};

/**
 * Seeds the database with users, posts, comments, and likes.
 */
const seed = async () => {
  try {
    const interests = await fetchInterests(); // gets all interest from db
    if (!interests.length) {
      console.error("No interests found in database.");
      return;
    }

    // Create users
    const users = await Promise.all(
      Array.from({ length: 5 }, async (_, i) => {
        return await createUser({
          email: `user${i + 1}@example.com`,
          password: "password123",
          name: `User ${i + 1}`,
          image: "https://via.placeholder.com/150",
        });
      })
    );

    // Assign interests and create posts
    for (const user of users) {
      const userInterests = await assignInterestsToUser(user.id, interests); // this assigns 3 (i think) random interests to the user
      for (const interest of userInterests) {
        // This then creates a post from the user with a specific interest
        const post = await createPost({
          post_type: PostType.NOTE,
          title: `${user.name} shares about ${interest.name}`,
          location: "Online",
          description: `A discussion about ${interest.name}.`,
          image: "https://via.placeholder.com/300",
          user_id: user.id,
          likes: 0,
          reposts: 0,
          interest_id: interest.id // Add interest_id to the post
        });
        // Other users interact with the post
        const otherUsers = users.filter((u) => u.id !== user.id);
        await Promise.all(
          otherUsers.map(async (otherUser) => {
            await createComment({ post_id: post.id, user_id: otherUser.id, content: `Interesting thoughts on ${interest.name}!` });
            await createLike({ post_id: post.id, user_id: otherUser.id });
          })
        );
      }
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};


// Uncomment the following line to seed the db
seed();

// To run the seed file run the command "npx ts-node utils/seed.ts" from the root
