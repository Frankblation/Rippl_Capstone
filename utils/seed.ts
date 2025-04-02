import { supabase } from "./supabase";
import { createUser, createPost } from "./data";
import { PostType } from "./db";
import { faker } from '@faker-js/faker';

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
 * Assigns 2 random interests to a user and 3-6 more interests that share the same category_id as the 2 random interests.
 */
const assignInterestsToUser = async (userId: string, interests: any[]) => {
  // Step 1: Select 2 random interests
  const randomInterests = interests.sort(() => 0.5 - Math.random()).slice(0, 2);

  // Step 2: Get the category_ids of the selected random interests
  const categoryIds = randomInterests.map((interest) => interest.category_id);

  // Step 3: Filter interests that share the same category_id as the selected random interests
  const relatedInterests = interests.filter((interest) =>
    categoryIds.includes(interest.category_id) && !randomInterests.some((ri) => ri.id === interest.id)
  );

  // Step 4: Select 3-6 additional interests from the related interests
  const additionalInterests = relatedInterests
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 4) + 3); // Randomly select between 3 and 6

  // Combine the random interests and additional interests
  const userInterests = [...randomInterests, ...additionalInterests];

  // Step 5: Insert the interests into the user_interests table
  await Promise.all(
    userInterests.map(async (interest: { id: any }) => {
      await supabase.from("user_interests").insert({ user_id: userId, interest_id: interest.id });
    })
  );

  return userInterests;
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

  // Attempt to update the post popularity row
  const { error: updateError } = await supabase
    .from('post_popularity')
    .update({
      comments: ((await supabase.from('post_popularity').select('comments').eq('post_id', post_id).single()).data?.comments || 0) + 1, // Increment comments
      total_engagement: ((await supabase.from('post_popularity').select('total_engagement').eq('post_id', post_id).single()).data?.total_engagement || 0) + 1, // Increment total engagement
    })
    .eq('post_id', post_id);

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      // If no row exists, create one with default values
      try {
        await supabase
          .from('post_popularity')
          .insert({ post_id, comments: 1, reposts: 0, total_engagement: 1 });
      } catch (insertError) {
        if ((insertError as any).code === '23505') {
          // Ignore duplicate key error if another process already inserted the row
          console.warn('Post popularity row already exists for post_id:', post_id);
        } else {
          console.error('Error creating post popularity entry:', insertError);
        }
      }
    } else {
      console.error('Error updating post comments:', updateError);
    }
  }

  return data;
};

/**
 * Creates a like on a post.
 */
const createLike = async ({ post_id, user_id }: { post_id: string; user_id: string }) => {
  // Attempt to update the post popularity row
  const { error: updateError } = await supabase
    .from('post_popularity')
    .update({
      likes: (await supabase.from('post_popularity').select('likes').eq('post_id', post_id).single()).data?.likes + 1 || 1, // Increment likes
      total_engagement: (await supabase.from('post_popularity').select('total_engagement').eq('post_id', post_id).single()).data?.total_engagement + 1 || 1, // Increment total engagement
    })
    .eq('post_id', post_id);

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      // If no row exists, create one with default values
      try {
        await supabase
          .from('post_popularity')
          .insert({ post_id, likes: 1, reposts: 0, total_engagement: 1 });
      } catch (insertError) {
        if ((insertError as any).code === '23505') {
          // Ignore duplicate key error if another process already inserted the row
          console.warn('Post popularity row already exists for post_id:', post_id);
        } else {
          console.error('Error creating post popularity entry:', insertError);
        }
      }
    } else {
      console.error('Error updating post likes:', updateError);
    }
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

    // Create all users
    const users = await Promise.all(
      Array.from({ length: 5 }, async (_, i) => {
        return await createUser({
          email: faker.internet.email(),
          password: faker.internet.password(),
          name: faker.person.fullName(),
          image: faker.image.avatar(),
        });
      })
    );

    // Assign interests and create posts
    for (const user of users) {
      const userInterests = await assignInterestsToUser(user.id, interests);
      for (const interest of userInterests) {
        // This then creates a post from the user with a specific interest ( 1 post for each interest of theirs )
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
            await createComment({ post_id: post.id, user_id: otherUser.id, content: `Interesting thoughts on ${interest.name}! ${faker.internet.emoji()}` });
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
