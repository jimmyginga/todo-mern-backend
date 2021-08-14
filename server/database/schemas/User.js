const mongoose = require('mongoose');
const { MongooseAutoIncrementID } = require('mongoose-auto-increment-reworked');
const bcrypt = require('bcryptjs');
const R = require('ramda');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
      immutable: true,
    },
    username_case: { type: String, required: true },
    password: { type: String, required: true },
    profile_pic: { type: String },
    first_name: { type: String, maxlength: 20 },
    last_name: { type: String, maxlength: 20 },
    bio: { type: String, maxlength: 240 },
    created_at: { type: Date, default: Date.now, immutable: true },
    updated_at: { type: Date },
  },
  { versionKey: false },
);

if (process.env.NODE_ENV !== 'test') {
  MongooseAutoIncrementID.initialise('counters');

  userSchema.plugin(MongooseAutoIncrementID.plugin, {
    modelName: 'User',
    field: 'user',
    incrementBy: 1,
    startAt: 1,
    unique: true,
    nextCount: false,
    resetCount: false,
  });
}

userSchema.virtual('full_name').get(function() {
  if (this.first_name && this.last_name) {
    return `${this.first_name} ${this.last_name}`;
  }
  if (this.first_name && !this.last_name) {
    return this.first_name;
  }
  if (!this.first_name && this.last_name) {
    return this.last_name;
  }
  return undefined;
});

userSchema.virtual('initials').get(function() {
  return (
    this.first_name
    && this.last_name
    && `${this.first_name[0].concat(this.last_name[0]).toUpperCase()}`
  );
});

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.pre('save', async(next) => {
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

userSchema.methods.hidePassword = function() {
  return R.omit(['password', '_id'], this.toObject({ virtuals: true }));
};

const User = mongoose.model('User', userSchema);

module.exports = User;
