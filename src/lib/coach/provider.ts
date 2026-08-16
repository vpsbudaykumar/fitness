export type ProviderReply={message:string;action?:{type:string;params:Record<string,unknown>}};
export interface AIProvider { respond(input:{message:string;intent:string;context:Record<string,unknown>}):Promise<ProviderReply>; }
export class UnavailableProvider implements AIProvider { async respond(_input:{message:string;intent:string;context:Record<string,unknown>}):Promise<ProviderReply>{throw new Error("AI provider is not configured");} }
