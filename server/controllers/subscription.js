import subscription from "../Modals/subscription.js";
import user from "../Modals/Auth.js";

// Toggle subscription
export const toggleSubscription = async (req, res) => {
  const { userId } = req.body;
  const { channelId } = req.params;

  try {
    // Prevent self-subscription
    if (userId === channelId) {
      return res.status(400).json({ message: "Cannot subscribe to yourself" });
    }

    const existingSubscription = await subscription.findOne({
      subscriber: userId,
      channel: channelId,
    });

    if (existingSubscription) {
      // Unsubscribe
      await subscription.findByIdAndDelete(existingSubscription._id);
      return res.status(200).json({ subscribed: false });
    } else {
      // Subscribe
      await subscription.create({ 
        subscriber: userId, 
        channel: channelId 
      });
      return res.status(200).json({ subscribed: true });
    }
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Get subscriber count for a channel
export const getSubscriberCount = async (req, res) => {
  const { channelId } = req.params;

  try {
    const count = await subscription.countDocuments({ channel: channelId });
    return res.status(200).json({ count });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Check if user is subscribed to a channel
export const checkSubscription = async (req, res) => {
  const { userId, channelId } = req.params;

  try {
    const existingSubscription = await subscription.findOne({
      subscriber: userId,
      channel: channelId,
    });

    return res.status(200).json({ 
      isSubscribed: !!existingSubscription 
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Get all channels a user is subscribed to
export const getUserSubscriptions = async (req, res) => {
  const { userId } = req.params;

  try {
    const subscriptions = await subscription
      .find({ subscriber: userId })
      .populate({
        path: "channel",
        model: "user",
      })
      .exec();

    return res.status(200).json(subscriptions);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
