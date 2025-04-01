'use client';

import Feather from '@expo/vector-icons/Feather';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import React, { useRef, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  type ImageSourcePropType,
} from 'react-native';

export interface PostComment {
  id: string;
  username: string;
  userAvatar: ImageSourcePropType;
  text: string;
  timePosted: string;
}

export interface CommentsBottomSheetProps {
  comments: PostComment[];
  commentsCount: number;
  onAddComment: (text: string) => void;
}

export interface CommentsBottomSheetRef {
  open: () => void;
  close: () => void;
}

const CommentsBottomSheet = forwardRef<CommentsBottomSheetRef, CommentsBottomSheetProps>(
  ({ comments, commentsCount, onAddComment }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [newCommentText, setNewCommentText] = React.useState('');

    const snapPoints = useMemo(() => ['70%'], []);

    useImperativeHandle(ref, () => ({
      open: () => {
        bottomSheetRef.current?.expand();
      },
      close: () => {
        bottomSheetRef.current?.close();
      },
    }));

    const renderBackdrop = useCallback(
      (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
      []
    );

    const handleCloseBottomSheet = useCallback(() => {
      bottomSheetRef.current?.close();
    }, []);

    const handleAddComment = () => {
      if (newCommentText.trim()) {
        onAddComment(newCommentText);
        setNewCommentText('');
      }
    };

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.bottomSheetIndicator}>
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>Comments ({commentsCount})</Text>
          <TouchableOpacity onPress={handleCloseBottomSheet}>
            <Feather name="x" size={24} color="#262626" />
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView contentContainerStyle={styles.commentsScrollViewContent}>
          {/* COMMENTS LIST */}
          {comments.length > 0 ? (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentContainer}>
                <Image source={comment.userAvatar} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentUsername}>{comment.username}</Text>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                  <Text style={styles.commentTime}>{comment.timePosted}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
          )}
        </BottomSheetScrollView>

        {/* FORM TO ADD COMMENT */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.commentForm}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={newCommentText}
              onChangeText={setNewCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.postButton, !newCommentText.trim() && styles.postButtonDisabled]}
              onPress={handleAddComment}
              disabled={!newCommentText.trim()}>
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheetIndicator: {
    width: 40,
    backgroundColor: '#d1d1d1',
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentsScrollViewContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  commentContainer: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#f1f1f1',
    borderRadius: 18,
    padding: 10,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
  },
  commentTime: {
    fontSize: 11,
    color: '#8e8e8e',
    marginTop: 4,
    marginLeft: 4,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#8e8e8e',
    textAlign: 'center',
    padding: 16,
  },
  commentForm: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#efefef',
    backgroundColor: 'white',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#efefef',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  postButton: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0095f6',
    borderRadius: 4,
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#b2dffc',
  },
  postButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CommentsBottomSheet;
