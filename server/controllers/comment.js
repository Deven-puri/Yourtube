import comment from "../Modals/comment.js";
import mongoose from "mongoose";
import { detectLanguage, translateText, getCityFromCoordinates, getCityFromIP } from "../services/translationService.js";

// Utility: Check for special characters (block comments with special chars)
function containsSpecialCharacters(text) {
  // Allow letters, numbers, spaces, and basic punctuation only
  const allowedPattern = /^[a-zA-Z0-9\s.,!?;:()'"-]*$/;
  return !allowedPattern.test(text);
}

export const postcomment = async (req, res) => {
  const commentdata = req.body;
  
  try {
    // Validate comment body for special characters
    if (containsSpecialCharacters(commentdata.commentbody)) {
      return res.status(400).json({ 
        message: "Comment contains special characters and cannot be posted. Please use only letters, numbers, and basic punctuation." 
      });
    }
    
    // Detect language of comment
    const detectedLang = await detectLanguage(commentdata.commentbody);
    
    // Get city from request (latitude/longitude from frontend)
    let city = "Unknown";
    if (commentdata.latitude && commentdata.longitude) {
      city = await getCityFromCoordinates(commentdata.latitude, commentdata.longitude);
    } else if (req.ip) {
      city = await getCityFromIP(req.ip);
    }
    
    // Create comment with additional fields
    const postcomment = new comment({
      ...commentdata,
      city,
      originalLanguage: detectedLang,
      likes: [],
      dislikes: []
    });
    
    await postcomment.save();
    return res.status(200).json({ comment: true, data: postcomment });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({ videoid: videoid });
    return res.status(200).json(commentvideo);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  
  // Validate comment body for special characters
  if (containsSpecialCharacters(commentbody)) {
    return res.status(400).json({ 
      message: "Comment contains special characters and cannot be posted. Please use only letters, numbers, and basic punctuation." 
    });
  }
  
  try {
    const updatecomment = await comment.findByIdAndUpdate(_id, {
      $set: { commentbody: commentbody },
    });
    res.status(200).json(updatecomment);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Like a comment
export const likecomment = async (req, res) => {
  const { id: _id } = req.params;
  const { userid } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  
  try {
    const commentDoc = await comment.findById(_id);
    
    // Remove from dislikes if already disliked
    const dislikeIndex = commentDoc.dislikes.indexOf(userid);
    if (dislikeIndex !== -1) {
      commentDoc.dislikes.splice(dislikeIndex, 1);
    }
    
    // Toggle like
    const likeIndex = commentDoc.likes.indexOf(userid);
    if (likeIndex === -1) {
      commentDoc.likes.push(userid);
    } else {
      commentDoc.likes.splice(likeIndex, 1);
    }
    
    await commentDoc.save();
    res.status(200).json({ likes: commentDoc.likes.length, dislikes: commentDoc.dislikes.length });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Dislike a comment
export const dislikecomment = async (req, res) => {
  const { id: _id } = req.params;
  const { userid } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  
  try {
    const commentDoc = await comment.findById(_id);
    
    // Remove from likes if already liked
    const likeIndex = commentDoc.likes.indexOf(userid);
    if (likeIndex !== -1) {
      commentDoc.likes.splice(likeIndex, 1);
    }
    
    // Toggle dislike
    const dislikeIndex = commentDoc.dislikes.indexOf(userid);
    if (dislikeIndex === -1) {
      commentDoc.dislikes.push(userid);
    } else {
      commentDoc.dislikes.splice(dislikeIndex, 1);
    }
    
    await commentDoc.save();
    
    // Auto-delete if 2 or more dislikes
    if (commentDoc.dislikes.length >= 2) {
      await comment.findByIdAndDelete(_id);
      return res.status(200).json({ 
        deleted: true, 
        message: "Comment removed due to multiple dislikes",
        likes: 0,
        dislikes: 0
      });
    }
    
    res.status(200).json({ 
      deleted: false,
      likes: commentDoc.likes.length, 
      dislikes: commentDoc.dislikes.length 
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Translate a comment
export const translatecomment = async (req, res) => {
  const { id: _id } = req.params;
  const { targetLanguage } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  
  try {
    const commentDoc = await comment.findById(_id);
    
    if (!commentDoc) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    // Check if translation already exists
    if (commentDoc.translations && commentDoc.translations.get(targetLanguage)) {
      return res.status(200).json({ 
        translatedText: commentDoc.translations.get(targetLanguage),
        cached: true
      });
    }
    
    // Translate the comment
    const result = await translateText(
      commentDoc.commentbody, 
      targetLanguage, 
      commentDoc.originalLanguage
    );
    
    // Store translation in database
    if (!commentDoc.translations) {
      commentDoc.translations = new Map();
    }
    commentDoc.translations.set(targetLanguage, result.translatedText);
    await commentDoc.save();
    
    res.status(200).json({ 
      translatedText: result.translatedText,
      cached: false,
      detectedSourceLanguage: result.detectedSourceLanguage
    });
  } catch (error) {
    return res.status(500).json({ message: "Translation failed" });
  }
};
