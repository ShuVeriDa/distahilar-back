-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Language" AS ENUM ('EN', 'RU', 'CHE');

-- CreateEnum
CREATE TYPE "public"."MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'GUEST');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'FILE');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'VIDEO', 'VOICE', 'FILE');

-- CreateEnum
CREATE TYPE "public"."ChatRole" AS ENUM ('DIALOG', 'CHANNEL', 'GROUP');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('PENDING', 'SENT', 'READ');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "hashedRefreshToken" TEXT,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "bio" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "imageUrl" TEXT,
    "lastSeen" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" TEXT NOT NULL,
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "language" "public"."Language" NOT NULL DEFAULT 'RU',
    "userId" TEXT NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chats" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "link" TEXT NOT NULL,
    "type" "public"."ChatRole" NOT NULL DEFAULT 'DIALOG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contacts" (
    "id" TEXT NOT NULL,
    "savedContactId" TEXT NOT NULL,
    "contactSaverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_members" (
    "id" TEXT NOT NULL,
    "role" "public"."MemberRole" NOT NULL DEFAULT 'GUEST',
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "chat_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "messageType" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."MessageStatus" NOT NULL DEFAULT 'SENT',
    "readByUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedByUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pinnedChatId" TEXT,
    "repliedToId" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration" INTEGER,
    "size" INTEGER,
    "name" TEXT,
    "type" "public"."MediaType" NOT NULL,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."voice_messages" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."video_messages" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reactions" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "messageId" TEXT NOT NULL,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reaction_users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionId" TEXT NOT NULL,

    CONSTRAINT "reaction_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ChatFolders" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ChatFolders_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "public"."user_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "chats_link_key" ON "public"."chats"("link");

-- CreateIndex
CREATE INDEX "chats_type_createdAt_idx" ON "public"."chats"("type", "createdAt");

-- CreateIndex
CREATE INDEX "contacts_savedContactId_createdAt_idx" ON "public"."contacts"("savedContactId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_contactSaverId_savedContactId_key" ON "public"."contacts"("contactSaverId", "savedContactId");

-- CreateIndex
CREATE INDEX "messages_chatId_createdAt_idx" ON "public"."messages"("chatId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "messages_pinnedChatId_key" ON "public"."messages"("pinnedChatId");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_messageId_emoji_key" ON "public"."reactions"("messageId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "reaction_users_userId_reactionId_key" ON "public"."reaction_users"("userId", "reactionId");

-- CreateIndex
CREATE INDEX "_ChatFolders_B_index" ON "public"."_ChatFolders"("B");

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_savedContactId_fkey" FOREIGN KEY ("savedContactId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_contactSaverId_fkey" FOREIGN KEY ("contactSaverId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_members" ADD CONSTRAINT "chat_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_members" ADD CONSTRAINT "chat_members_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_pinnedChatId_fkey" FOREIGN KEY ("pinnedChatId") REFERENCES "public"."chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_repliedToId_fkey" FOREIGN KEY ("repliedToId") REFERENCES "public"."messages"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media" ADD CONSTRAINT "media_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."voice_messages" ADD CONSTRAINT "voice_messages_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_messages" ADD CONSTRAINT "video_messages_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reactions" ADD CONSTRAINT "reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reaction_users" ADD CONSTRAINT "reaction_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reaction_users" ADD CONSTRAINT "reaction_users_reactionId_fkey" FOREIGN KEY ("reactionId") REFERENCES "public"."reactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."folders" ADD CONSTRAINT "folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ChatFolders" ADD CONSTRAINT "_ChatFolders_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ChatFolders" ADD CONSTRAINT "_ChatFolders_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
