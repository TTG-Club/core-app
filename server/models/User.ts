import { isString, uniq } from 'lodash-es';
import { model, Schema } from 'mongoose';

export type ROLE = 'USER' | 'ADMIN' | 'MODERATOR' | 'SUBSCRIBER' | 'WRITER';
export interface UserDto {
  _id: string;
  username: string;
  email: string;
  password: string;
  verified?: boolean;
  createdAt: number;
  updatedAt: number;
  roles: Array<ROLE>;
}

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: 3,
      maxLength: 1000,
      alias: ['name', 'login', 'nickname'],
      validate: (value: unknown) => isString(value) && !/[^\w\-.]/.test(value),
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: 6,
      maxLength: 1000,
      match: /^[\w.%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    roles: {
      type: [
        {
          type: String,
          enum: ['USER', 'ADMIN', 'MODERATOR', 'SUBSCRIBER', 'WRITER'],
        },
      ],
      default: ['USER'],
      set: (value: Array<ROLE>) => uniq(value),
    },
  },
  {
    timestamps: true,
    statics: {
      findByUsername(username: string) {
        return this.findOne({ username }).exec();
      },
      findByEmail(email: string) {
        return this.findOne({ email }).exec();
      },
      findVerified() {
        return this.find({ verified: true }).exec();
      },
      findNotVerified() {
        return this.find({ verified: false }).exec();
      },
      async isUsernameExist(username: string) {
        const exist = await this.exists({ username }).exec();

        return !!exist;
      },
      async isEmailExist(email: string) {
        const exist = await this.exists({ email }).exec();

        return !!exist;
      },
    },
    query: {
      byUsername(username) {
        return this.where({ username: new RegExp(username, 'i') });
      },
    },
  },
);

export const User = model('user', userSchema);
