import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  // For group chat, we don't need recipientId
  // This is a group message visible to all users
  type: {
    type: String,
    enum: ['group', 'system'],
    default: 'group'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for efficient querying of recent messages
messageSchema.index({ timestamp: -1 });
messageSchema.index({ senderId: 1, timestamp: -1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
});

const Message = mongoose.model('Message', messageSchema);

export default Message;