/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/create-interests`; params?: Router.UnknownInputParams; } | { pathname: `/create-profile`; params?: Router.UnknownInputParams; } | { pathname: `/details`; params?: Router.UnknownInputParams; } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/landing`; params?: Router.UnknownInputParams; } | { pathname: `/login`; params?: Router.UnknownInputParams; } | { pathname: `/signup`; params?: Router.UnknownInputParams; } | { pathname: `/welcome`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(chat)'}/chat-list` | `/chat-list`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/add-post` | `/add-post`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/explore` | `/explore`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/home` | `/home`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/matched-users` | `/matched-users`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/matching` | `/matching`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/profile/edit` | `/profile/edit`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/profile` | `/profile`; params?: Router.UnknownInputParams; } | { pathname: `/+not-found`, params: Router.UnknownInputParams & {  } } | { pathname: `${'/(chat)'}/[id]` | `/[id]`, params: Router.UnknownInputParams & { id: string | number; } } | { pathname: `${'/(tabs)'}/profile/[id]` | `/profile/[id]`, params: Router.UnknownInputParams & { id: string | number; } };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/create-interests`; params?: Router.UnknownOutputParams; } | { pathname: `/create-profile`; params?: Router.UnknownOutputParams; } | { pathname: `/details`; params?: Router.UnknownOutputParams; } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/landing`; params?: Router.UnknownOutputParams; } | { pathname: `/login`; params?: Router.UnknownOutputParams; } | { pathname: `/signup`; params?: Router.UnknownOutputParams; } | { pathname: `/welcome`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(chat)'}/chat-list` | `/chat-list`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/add-post` | `/add-post`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/explore` | `/explore`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/home` | `/home`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/matched-users` | `/matched-users`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/matching` | `/matching`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/profile/edit` | `/profile/edit`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/profile` | `/profile`; params?: Router.UnknownOutputParams; } | { pathname: `/+not-found`, params: Router.UnknownOutputParams & {  } } | { pathname: `${'/(chat)'}/[id]` | `/[id]`, params: Router.UnknownOutputParams & { id: string; } } | { pathname: `${'/(tabs)'}/profile/[id]` | `/profile/[id]`, params: Router.UnknownOutputParams & { id: string; } };
      href: Router.RelativePathString | Router.ExternalPathString | `/create-interests${`?${string}` | `#${string}` | ''}` | `/create-profile${`?${string}` | `#${string}` | ''}` | `/details${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `/landing${`?${string}` | `#${string}` | ''}` | `/login${`?${string}` | `#${string}` | ''}` | `/signup${`?${string}` | `#${string}` | ''}` | `/welcome${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(chat)'}/chat-list${`?${string}` | `#${string}` | ''}` | `/chat-list${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/add-post${`?${string}` | `#${string}` | ''}` | `/add-post${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/explore${`?${string}` | `#${string}` | ''}` | `/explore${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/home${`?${string}` | `#${string}` | ''}` | `/home${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/matched-users${`?${string}` | `#${string}` | ''}` | `/matched-users${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/matching${`?${string}` | `#${string}` | ''}` | `/matching${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/profile/edit${`?${string}` | `#${string}` | ''}` | `/profile/edit${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/profile${`?${string}` | `#${string}` | ''}` | `/profile${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/create-interests`; params?: Router.UnknownInputParams; } | { pathname: `/create-profile`; params?: Router.UnknownInputParams; } | { pathname: `/details`; params?: Router.UnknownInputParams; } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/landing`; params?: Router.UnknownInputParams; } | { pathname: `/login`; params?: Router.UnknownInputParams; } | { pathname: `/signup`; params?: Router.UnknownInputParams; } | { pathname: `/welcome`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(chat)'}/chat-list` | `/chat-list`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/add-post` | `/add-post`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/explore` | `/explore`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/home` | `/home`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/matched-users` | `/matched-users`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/matching` | `/matching`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/profile/edit` | `/profile/edit`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/profile` | `/profile`; params?: Router.UnknownInputParams; } | `/+not-found` | `${'/(chat)'}/${Router.SingleRoutePart<T>}` | `/${Router.SingleRoutePart<T>}` | `${'/(tabs)'}/profile/${Router.SingleRoutePart<T>}` | `/profile/${Router.SingleRoutePart<T>}` | { pathname: `/+not-found`, params: Router.UnknownInputParams & {  } } | { pathname: `${'/(chat)'}/[id]` | `/[id]`, params: Router.UnknownInputParams & { id: string | number; } } | { pathname: `${'/(tabs)'}/profile/[id]` | `/profile/[id]`, params: Router.UnknownInputParams & { id: string | number; } };
    }
  }
}
