
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
    event_interests: EventInterestsTable;
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
}

// Posts Data Type
export interface PostsTable {
    id: string;
    post_type: PostType; // enum
    title: string;
    location: string;
    description: string;
    image: string;
    user_id: string;
    likes: number;
    reposts: number;
    created_at: string;
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
export interface EventInterestsTable {
    event_id: string;
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

// User Matches Data Type
export interface UserMatchesTable {
    user_id: string;
    matched_user_id: string;
}