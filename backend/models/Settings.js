import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

// Static method to get setting
settingsSchema.statics.getSetting = async function(key, defaultValue = null) {
  try {
    const setting = await this.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

// Static method to set setting
settingsSchema.statics.setSetting = async function(key, value) {
  try {
    return await this.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );
  } catch (error) {
    throw error;
  }
};

export default mongoose.model('Settings', settingsSchema);
