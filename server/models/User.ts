import { isString } from 'lodash-es';
import type { Document, Model } from 'mongoose';
import { model, Schema } from 'mongoose';
import { ROLE } from '~~/shared/types/user';

export interface UserDocument extends Document {
  username: string;
  email: string;
  password: string;
  verified?: boolean;
  createdAt: number;
  updatedAt: number;
  role?: ROLE;
}

interface UserStaticMethods extends Model<UserDocument> {
  findByUsername(username: string): Promise<UserDocument>;
  findByEmail(email: string): Promise<UserDocument>;
  findVerified(): Promise<Array<UserDocument>>;
  findNotVerified(): Promise<Array<UserDocument>>;
  isUsernameExist(username: string): Promise<boolean>;
  isEmailExist(email: string): Promise<boolean>;
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
      select: false,
    },
    role: {
      type: {
        type: String,
        enum: ROLE,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
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
      byUsername(username: string) {
        return this.where({ username: new RegExp(username, 'i') });
      },
    },
  },
);

export const User = model<UserDocument, UserStaticMethods>('user', userSchema);
