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
