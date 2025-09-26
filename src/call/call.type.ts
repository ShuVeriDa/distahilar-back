export class InitiateCallDto {
  chatId: string;
  isVideoCall?: boolean;
}

export class CallResponseDto {
  callId: string;
  action: CallActionEnum;
}

export class CallEndDto {
  callId: string;
}

export interface CallNotification {
  callId: string;
  callerId: string;
  callerName: string;
  chatId: string;
  chatName: string;
  isVideoCall: boolean;
  timestamp: number;
}

export interface CallStatus {
  id: string;
  chatId: string;
  callerId: string;
  participantIds: string[];
  status: CallStatusEnum;
  isVideoCall: boolean;
  startedAt: Date;
  endedAt?: Date;
}

export enum CallStatusEnum {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  ACTIVE = 'active',
  ENDED = 'ended',
}

export enum CallActionEnum {
  ACCEPT = 'accept',
  REJECT = 'reject',
}

export enum CallTypeEnum {
  OFFER = 'offer',
  ANSWER = 'answer',
}

// WebRTC signaling DTOs
export class WebRtcOfferDto {
  callId: string;
  toUserId: string;
  sdp: string;
  type: CallTypeEnum.OFFER;
}

export class WebRtcAnswerDto {
  callId: string;
  toUserId: string;
  sdp: string;
  type: CallTypeEnum.ANSWER;
}

export class WebRtcIceCandidateDto {
  callId: string;
  toUserId: string;
  candidate: any;
}

export class JoinVoiceChatDto {
  chatId: string;
}

export class LeaveVoiceChatDto {
  chatId: string;
}

// Live stream / voice room (groups & channels)

export enum LiveRoleEnum {
  HOST = 'host',
  SPEAKER = 'speaker',
  LISTENER = 'listener',
}

export interface LiveRoomState {
  chatId: string;
  isLive: boolean;
  hostId: string | null;
  speakers: string[];
  listeners: string[];
  raisedHands: string[];
  muted: string[];
  startedAt?: number;
}

export class StartLiveDto {
  chatId: string;
}

export class StopLiveDto {
  chatId: string;
}

export class JoinLiveDto {
  chatId: string;
}

export class LeaveLiveDto {
  chatId: string;
}

export class RaiseHandDto {
  chatId: string;
}

export class ApproveSpeakerDto {
  chatId: string;
  userId: string; // target user to promote
}

export class RevokeSpeakerDto {
  chatId: string;
  userId: string; // target user to demote
}

export class ToggleMuteDto {
  chatId: string;
  userId: string; // target user to mute/unmute
  isMuted: boolean;
}

export class GetLiveRoomStateDto {
  chatId: string;
}

// Live WebRTC signaling DTOs (for groups/channels live streams)
export class LiveWebRtcOfferDto {
  chatId: string;
  toUserId: string;
  sdp: string;
  type: CallTypeEnum.OFFER;
}

export class LiveWebRtcAnswerDto {
  chatId: string;
  toUserId: string;
  sdp: string;
  type: CallTypeEnum.ANSWER;
}

export class LiveWebRtcIceCandidateDto {
  chatId: string;
  toUserId: string;
  candidate: any;
}

export class GetLivePeersDto {
  chatId: string;
}

export interface LivePeerInfo {
  userId: string;
  role: LiveRoleEnum;
  isMuted: boolean;
}
