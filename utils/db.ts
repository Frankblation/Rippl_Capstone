import { ISOStringFormat } from "date-fns";
import { ShadowNodeWrapper, Timestamp } from "react-native-reanimated/lib/typescript/commonTypes";

// ENUM Types
export enum PostType {
    NOTE = 'note',
    EVENT = 'event',
  }

export enum Status {
    GOING = 'going',
    INTERESTED = 'interested',
}

export interface Database {
    users: UsersTable;
    posts: PostsTable;
    messages: MessagesTable;
    interests: InterestsTable;
    friendships: FriendshipsTable;
    comments: CommentsTable;
    chats: ChatsTable;
    attendees: AttendeesTable;
    chat_participants: ChatParticipantsTable;
    post_interests: PostInterestsTable;
    interest_categories: InterestCategoriesTable;
    post_popularity: PostPopularityTable;
    user_interests: UserInterestsTable;
    user_matches: UserMatchesTable;
}

// Users Data Type
export interface UsersTable {
    id: string;
    email: string;
    password: string;
    name: string;
    image: string;
    created_at: string;
    description: string;
}

// Posts Data Type
export interface PostsTable {
    id: string;
    post_type: PostType; // enum
    title: string;
    location?: string;
    description: string;
    image: string;
    user_id: string;
    created_at: string;
    interest_id: string;
    attendees?: AttendeesTable;
    event_date?: ISOStringFormat;
}

// Messages Data Type
export interface MessagesTable {
    id: string;
    chat_id: string;
    user_id: string;
    content: string;
    read_status: boolean;
    sent_at: string;
}

// Interests Data Type
export interface InterestsTable {
    id: string;
    name: string;
    category_id: string;
}

// Friendships Data Type
export interface FriendshipsTable {
    user_id: string;
    friend_id: string;
}

// Interest Categories Data Type
export interface CommentsTable {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    likes: number;
    replies: number;
    sent_at: string;
}

// Chats Data Type
export interface ChatsTable {
    id: string;
    created_at: string;
    updated_at: string;
}

// Attendees Data Type
export interface AttendeesTable {
    post_id: string;
    user_id: string;
    status: Status; // enum
}

// Chat Participants Data Type
export interface ChatParticipantsTable {
    chat_id: string;
    user_id: string;
}

// Event Interests Data Type
export interface PostInterestsTable {
    post_id: string;
    interest_id: string;
}

// Interest Categories Data Type
export interface InterestCategoriesTable {
    id: string;
    name: string;
}

// Post Popularity Data Type
export interface PostPopularityTable {
    post_id: string;
    likes: number;
    comments: number;
    reposts: number;
    total_engagement: number;
}

// User Interests Data Type
export interface UserInterestsTable {
    user_id: string;
    interest_id: string;
}

// User Swipe Yes Data Type
export interface UserSwipedYesTable {
  user_id: string;
  swiped_user_id: string;
  swiped_yes: boolean;
}

// User Matches Data Type
export interface UserMatchesTable {
    user_id: string;
    matched_user_id: string;
}

// User User Recommendations Data Types
export interface UserUserRecommendationsTable {
  id: string;
  user_id: string;
  recommended_user_id: string;
  has_been_recommended: boolean;
  similarity_score: number;
  timestamp: string;
}

export interface RecommendedUserResponse {
  recommended_user_id: string;
  recommended_users: {
    id: string;
    name: string;
    bio: string | null;
    picture_url: string | null;
    interests: string[] | null;
  };
}

export interface SupabaseUser {
  id: string;
  aud: string;
  role: string;
  email: string;
  phone: string;
  is_anonymous: boolean;
  created_at: string;
  confirmed_at: string;
  email_confirmed_at: string;
  confirmation_sent_at: string;
  last_sign_in_at: string;
  updated_at: string;

  app_metadata: {
    provider: string;
    providers: string[];
  };

  user_metadata: {
    email: string;
    email_verified: boolean;
    phone_verified: boolean;
    sub: string;
  };

  identities: {
    id: string;
    user_id: string;
    identity_id: string;
    provider: string;
    email: string;
    created_at: string;
    updated_at: string;
    last_sign_in_at: string;
    identity_data: Record<string, unknown>;
  }[];
}

export interface SupabaseSession {
  data: {
    session: {
      access_token: string;
      refresh_token: string;
      user: SupabaseUser | null;
    };
  };
  error: {
    message: string;
  } | null;
}
