export type Mode='listener'|'speaker';
export type Message={id:string;roomId:string;participantId:string;participantName:string;text:string;rawText?:string;createdAt:number;aiAdjusted?:boolean};
export type Participant={id:string;name:string;mode:Mode;connectedAt:number};
