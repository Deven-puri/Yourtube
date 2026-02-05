import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { ThumbsUp, ThumbsDown, Languages, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
  city?: string;
  originalLanguage?: string;
  likes?: string[];
  dislikes?: string[];
  translations?: Map<string, string>;
}
const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [translatedComments, setTranslatedComments] = useState<Record<string, string>>({});
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [userLocation, setUserLocation] = useState<{ latitude?: number; longitude?: number }>({});
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const fetchedComments = [
    {
      _id: "1",
      videoid: videoId,
      userid: "1",
      commentbody: "Great video! Really enjoyed watching this.",
      usercommented: "John Doe",
      commentedon: new Date(Date.now() - 3600000).toISOString(),
      city: "New York",
      likes: [],
      dislikes: []
    },
    {
      _id: "2",
      videoid: videoId,
      userid: "2",
      commentbody: "Thanks for sharing this amazing content!",
      usercommented: "Jane Smith",
      commentedon: new Date(Date.now() - 7200000).toISOString(),
      city: "London",
      likes: [],
      dislikes: []
    },
  ];
  
  useEffect(() => {
    loadComments();
    getUserLocation();
  }, [videoId]);
  
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
        }
      );
    }
  };

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div>Loading history...</div>;
  }
  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    // Validate for special characters
    const allowedPattern = /^[a-zA-Z0-9\s.,!?;:()'"-]*$/;
    if (!allowedPattern.test(newComment)) {
      toast.error("Comment contains special characters. Please use only letters, numbers, and basic punctuation.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      });
      if (res.data.comment) {
        const newCommentObj: Comment = res.data.data || {
          _id: Date.now().toString(),
          videoid: videoId,
          userid: user._id,
          commentbody: newComment,
          usercommented: user.name || "Anonymous",
          commentedon: new Date().toISOString(),
          city: "Unknown",
          likes: [],
          dislikes: []
        };
        setComments([newCommentObj, ...comments]);
        toast.success("Comment posted successfully!");
      }
      setNewComment("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId ? { ...c, commentbody: editText } : c
          )
        );
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error) {
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
        toast.success("Comment deleted");
      }
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };
  
  const handleLike = async (commentId: string) => {
    if (!user) {
      toast.error("Please login to like comments");
      return;
    }
    
    try {
      const res = await axiosInstance.post(`/comment/like/${commentId}`, {
        userid: user._id
      });
      
      // Update local state
      setComments(prev => prev.map(c => 
        c._id === commentId 
          ? { 
              ...c, 
              likes: c.likes?.includes(user._id) 
                ? c.likes.filter(id => id !== user._id)
                : [...(c.likes || []), user._id],
              dislikes: c.dislikes?.filter(id => id !== user._id) || []
            }
          : c
      ));
    } catch (error) {
      toast.error("Failed to like comment");
    }
  };
  
  const handleDislike = async (commentId: string) => {
    if (!user) {
      toast.error("Please login to dislike comments");
      return;
    }
    
    try {
      const res = await axiosInstance.post(`/comment/dislike/${commentId}`, {
        userid: user._id
      });
      
      if (res.data.deleted) {
        // Comment was auto-deleted due to 2+ dislikes
        setComments(prev => prev.filter(c => c._id !== commentId));
        toast.info("Comment removed due to multiple dislikes");
      } else {
        // Update local state
        setComments(prev => prev.map(c => 
          c._id === commentId 
            ? { 
                ...c, 
                dislikes: c.dislikes?.includes(user._id) 
                  ? c.dislikes.filter(id => id !== user._id)
                  : [...(c.dislikes || []), user._id],
                likes: c.likes?.filter(id => id !== user._id) || []
              }
            : c
        ));
      }
    } catch (error) {
      toast.error("Failed to dislike comment");
    }
  };
  
  const handleTranslate = async (commentId: string) => {
    try {
      const res = await axiosInstance.post(`/comment/translate/${commentId}`, {
        targetLanguage
      });
      
      setTranslatedComments(prev => ({
        ...prev,
        [commentId]: res.data.translatedText
      }));
      
      toast.success(res.data.cached ? "Translation loaded" : "Translated successfully");
    } catch (error) {
      toast.error("Translation failed");
    }
  };
  
  const clearTranslation = (commentId: string) => {
    setTranslatedComments(prev => {
      const newTranslations = { ...prev };
      delete newTranslations[commentId];
      return newTranslations;
    });
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>
      
      {/* Language Selector */}
      <div className="flex items-center gap-2">
        <Languages className="w-4 h-4" />
        <label className="text-sm font-medium">Translate to:</label>
        <select 
          value={targetLanguage} 
          onChange={(e) => setTargetLanguage(e.target.value)}
          className="text-sm border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="ar">Arabic</option>
          <option value="ta">Tamil</option>
          <option value="te">Telugu</option>
          <option value="kn">Kannada</option>
          <option value="ml">Malayalam</option>
        </select>
      </div>

      {user && (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e: any) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setNewComment("")}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback>{comment.usercommented[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {comment.usercommented}
                  </span>
                  {comment.city && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {comment.city}
                    </span>
                  )}
                  <span className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(comment.commentedon))} ago
                  </span>
                </div>

                {editingCommentId === comment._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={handleUpdateComment}
                        disabled={!editText.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm mb-2">
                      {translatedComments[comment._id] || comment.commentbody}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 mt-2">
                      {/* Like/Dislike */}
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleLike(comment._id)}
                          className={`flex items-center gap-1 text-sm ${
                            comment.likes?.includes(user?._id) 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : 'text-gray-500 hover:text-blue-600'
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>{comment.likes?.length || 0}</span>
                        </button>
                        
                        <button 
                          onClick={() => handleDislike(comment._id)}
                          className={`flex items-center gap-1 text-sm ${
                            comment.dislikes?.includes(user?._id) 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-gray-500 hover:text-red-600'
                          }`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span>{comment.dislikes?.length || 0}</span>
                        </button>
                      </div>
                      
                      {/* Translate Button */}
                      {translatedComments[comment._id] ? (
                        <button 
                          onClick={() => clearTranslation(comment._id)}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <Languages className="w-4 h-4" />
                          Show Original
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleTranslate(comment._id)}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Languages className="w-4 h-4" />
                          Translate
                        </button>
                      )}
                      
                      {/* Edit/Delete for own comments */}
                      {comment.userid === user?._id && (
                        <>
                          <button 
                            onClick={() => handleEdit(comment)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(comment._id)}
                            className="text-sm text-gray-500 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
